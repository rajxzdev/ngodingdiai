import { getProvider } from "./providers";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMConfig {
  provider: string;
  model: string;
  key: string;
  temperature?: number;
  /** Override base URL — dipakai provider custom (OpenAI-compatible) */
  base?: string;
  /** Model cadangan (fallback): config lengkap — dipakai otomatis kalau model utama gagal */
  fallback?: LLMConfig;
}

export class LLMError extends Error {
  status?: number;
}

async function fetchJson(url: string, init: RequestInit, timeoutMs = 150000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch {
        /* noop */
      }
      const err = new LLMError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function buildBase(cfg: LLMConfig): string {
  const prov = getProvider(cfg.provider);
  const base = (cfg.base?.trim() || prov.base).replace(/\/+$/, "");
  if (!base) throw new LLMError(`Base URL belum diisi untuk provider ${prov.name}.`);
  return base;
}

function authHeader(cfg: LLMConfig): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` };
}

/** Panggil LLM non-streaming (dipakai untuk test koneksi) */
export async function callLLM(cfg: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const prov = getProvider(cfg.provider);
  if (!cfg.key?.trim()) throw new LLMError("API key belum diisi. Atur di halaman Settings.");
  if (!cfg.model?.trim()) throw new LLMError("Model belum dipilih.");
  const base = buildBase(cfg);
  const temperature = Math.min(Math.max(cfg.temperature ?? 0.7, 0), 1);

  if (prov.kind === "openai") {
    const data = await fetchJson(`${base}/chat/completions`, {
      method: "POST",
      headers: authHeader(cfg),
      body: JSON.stringify({ model: cfg.model, messages, temperature, max_tokens: 8000 }),
    });
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new LLMError("Respons kosong dari provider.");
    return String(text).trim();
  }

  if (prov.kind === "anthropic") {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const msgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    const data = await fetchJson(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 8000,
        temperature,
        system: system || undefined,
        messages: msgs,
      }),
    });
    const parts = data?.content?.filter((b: { type?: string }) => b.type === "text");
    const text = parts?.map((b: { text?: string }) => b.text).join("\n");
    if (!text) throw new LLMError("Respons kosong dari provider.");
    return String(text).trim();
  }

  // google
  const url = `${base}/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.key)}`;
  const data = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature, maxOutputTokens: 8192 },
    }),
  });
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = parts?.map((p: { text?: string }) => p.text).join("\n");
  if (!text) throw new LLMError("Respons kosong dari provider.");
  return String(text).trim();
}

/* ============================================================
 * STREAMING — token mengalir langsung ke UI (tidak nunggu penuh)
 * ============================================================ */

async function readSSE(
  res: Response,
  onChunk: (text: string) => void,
  parse: (data: unknown) => string | null
): Promise<string> {
  if (!res.body) throw new LLMError("Stream tidak tersedia dari provider.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const text = parse(JSON.parse(payload));
        if (text) {
          full += text;
          onChunk(text);
        }
      } catch {
        /* skip event tak dikenal */
      }
    }
  }
  return full;
}

async function streamOpenAI(
  cfg: LLMConfig,
  messages: LLMMessage[],
  base: string,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: authHeader(cfg),
    signal,
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: Math.min(Math.max(cfg.temperature ?? 0.7, 0), 1),
      max_tokens: 8000,
      stream: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new LLMError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return readSSE(res, onChunk, (d) => {
    const j = d as { choices?: { delta?: { content?: string } }[] };
    return j.choices?.[0]?.delta?.content ?? null;
  });
}

async function streamAnthropic(
  cfg: LLMConfig,
  messages: LLMMessage[],
  base: string,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const msgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.key,
      "anthropic-version": "2023-06-01",
    },
    signal,
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 8000,
      temperature: Math.min(Math.max(cfg.temperature ?? 0.7, 0), 1),
      system: system || undefined,
      messages: msgs,
      stream: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new LLMError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return readSSE(res, onChunk, (d) => {
    const j = d as { type?: string; delta?: { type?: string; text?: string } };
    return j.type === "content_block_delta" && j.delta?.type === "text_delta" ? j.delta.text ?? null : null;
  });
}

async function streamGoogle(
  cfg: LLMConfig,
  messages: LLMMessage[],
  base: string,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const url = `${base}/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: Math.min(Math.max(cfg.temperature ?? 0.7, 0), 1), maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new LLMError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return readSSE(res, onChunk, (d) => {
    const j = d as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const parts = j.candidates?.[0]?.content?.parts;
    return parts?.map((p) => p.text ?? "").join("") || null;
  });
}

/**
 * Panggil LLM dengan STREAMING — setiap potongan token dikirim via onChunk.
 * Mengembalikan teks lengkap setelah selesai.
 */
export async function callLLMStream(
  cfg: LLMConfig,
  messages: LLMMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const prov = getProvider(cfg.provider);
  if (!cfg.key?.trim()) throw new LLMError("API key belum diisi. Atur di halaman Settings.");
  if (!cfg.model?.trim()) throw new LLMError("Model belum dipilih.");
  const base = buildBase(cfg);

  if (prov.kind === "openai") return streamOpenAI(cfg, messages, base, onChunk, signal);
  if (prov.kind === "anthropic") return streamAnthropic(cfg, messages, base, onChunk, signal);
  return streamGoogle(cfg, messages, base, onChunk, signal);
}

export interface StreamResult {
  text: string;
  usedFallback: boolean;
}

/**
 * Streaming dengan FALLBACK: coba model utama dulu; kalau gagal (error/rate-limit),
 * otomatis coba model cadangan (fallback) jika tersedia. onFallback dipanggil dengan
 * error penyebab gagalnya model utama (dipakai UI untuk menampilkan alasan di log).
 */
export async function callLLMStreamWithFallback(
  cfg: LLMConfig,
  messages: LLMMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  onFallback?: (primaryError: unknown) => void
): Promise<StreamResult> {
  try {
    const text = await callLLMStream(cfg, messages, onChunk, signal);
    return { text, usedFallback: false };
  } catch (e) {
    if (signal?.aborted) throw e;
    const fb = cfg.fallback;
    if (!fb || !fb.model?.trim()) throw e;
    // Model utama gagal → pindah ke model cadangan
    onFallback?.(e);
    const text = await callLLMStream(fb, messages, onChunk, signal);
    return { text, usedFallback: true };
  }
}

export function friendlyError(e: unknown): string {
  if (e instanceof LLMError) {
    switch (e.status) {
      case 401:
        return "API key tidak valid (401). Cek kembali key di halaman Atur AI.";
      case 403:
        return "Akses ditolak (403). Key tidak punya akses ke model ini.";
      case 404:
        return "Model tidak ditemukan (404). Periksa nama model atau gunakan custom model.";
      case 429:
        return "Rate limit / kuota tercapai (429). Tunggu sebentar lalu coba lagi.";
      case 402:
        return "Saldo/kredit tidak mencukupi (402). Top up dulu di provider.";
      default:
        return e.message;
    }
  }
  const msg = e instanceof Error ? e.message : String(e);
  return msg || "Terjadi kesalahan tak dikenal.";
}
