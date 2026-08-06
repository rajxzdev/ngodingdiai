/**
 * Engine pipeline CLIENT-SIDE.
 * Streaming langsung dari browser ke API provider (tanpa lewat server → tanpa
 * batas durasi Vercel). Untuk provider yang memblokir CORS (OpenAI, Anthropic),
 * otomatis memakai proxy server kecil per-role (/api/llm) — 1 panggilan saja,
 * bukan 8 sekaligus seperti pipeline lama.
 */
import { getProvider } from "./providers";
import type { LLMConfig, LLMMessage } from "./llm";
import { LLMError } from "./llm";
import { CONTEXT_CHAIN, getRole } from "./roles";

export interface BriefInput {
  project: string;
  type: string;
  brief: string;
  extra: string;
  /** Jawaban pertanyaan pilihan (bahasa, target, platform, gaya, fitur) — sudah terformat */
  prefs?: string;
}

export interface StreamResult {
  text: string;
  usedFallback: boolean;
}

export function buildRoleMessages(
  roleId: string,
  input: BriefInput,
  outputs: Record<string, string>
): LLMMessage[] {
  const role = getRole(roleId);

  const ctxParts: string[] = [];
  for (const dep of CONTEXT_CHAIN[roleId] ?? []) {
    if (outputs[dep]?.trim()) {
      ctxParts.push(
        `<dokumen:${getRole(dep).output ?? dep}>\n${outputs[dep].slice(0, 4500)}\n</dokumen>`
      );
    }
  }
  const contextBlock = ctxParts.length
    ? `\n\nKonteks dari role sebelumnya:\n${ctxParts.join("\n\n")}`
    : "";

  const userContent = [
    `# Project Brief`,
    `- **Nama produk:** ${input.project}`,
    `- **Jenis:** ${input.type}`,
    `- **Deskripsi:** ${input.brief}`,
    input.prefs ? `- **Preferensi:** ${input.prefs}` : "",
    input.extra ? `- **Catatan tambahan:** ${input.extra}` : "",
    contextBlock,
    "",
    "Tulis dokumen output-mu sekarang.",
  ]
    .filter((s) => s !== "")
    .join("\n");

  return [
    { role: "system" as const, content: role.system },
    { role: "user" as const, content: userContent },
  ];
}

/** Parse SSE dari respons fetch (client) */
async function parseSSE(
  res: Response,
  onChunk: (t: string) => void,
  parse: (data: unknown) => string | null
): Promise<string> {
  if (!res.body) throw new LLMError("Stream tidak tersedia.");
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
        /* skip */
      }
    }
  }
  return full;
}

/** Streaming LANGSUNG dari browser ke provider (tanpa server) */
async function streamFromBrowser(
  cfg: LLMConfig,
  messages: LLMMessage[],
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const prov = getProvider(cfg.provider);
  const base = (cfg.base?.trim() || prov.base).replace(/\/+$/, "");
  if (!base) throw new LLMError(`Base URL belum diisi untuk provider ${prov.name}.`);
  const temp = Math.min(Math.max(cfg.temperature ?? 0.7, 0), 1);

  const throwRes = async (res: Response) => {
    const body = await res.text().catch(() => "");
    const err = new LLMError(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  };

  if (prov.kind === "openai") {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      signal,
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: temp,
        max_tokens: 8000,
        stream: true,
      }),
    });
    if (!res.ok) return throwRes(res);
    return parseSSE(res, onChunk, (d) => {
      const j = d as { choices?: { delta?: { content?: string } }[] };
      return j.choices?.[0]?.delta?.content ?? null;
    });
  }

  if (prov.kind === "google") {
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
        generationConfig: { temperature: temp, maxOutputTokens: 8192 },
      }),
    });
    if (!res.ok) return throwRes(res);
    return parseSSE(res, onChunk, (d) => {
      const j = d as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const parts = j.candidates?.[0]?.content?.parts;
      return parts?.map((p) => p.text ?? "").join("") || null;
    });
  }

  // Anthropic tidak mengizinkan CORS dari browser → harus lewat proxy
  throw new LLMError("ANTHROPIC_NEEDS_PROXY");
}

/** Streaming lewat proxy server (untuk provider tanpa CORS) — 1 panggilan per role */
async function streamViaProxy(
  cfg: LLMConfig,
  messages: LLMMessage[],
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config: cfg, messages }),
    signal,
  });
  if (!res.ok || !res.body) throw new LLMError(`Proxy HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const d = JSON.parse(line.slice(6));
          if (d.type === "chunk" && d.chunk) {
            full += d.chunk;
            onChunk(d.chunk);
          } else if (d.type === "done") {
            full = d.output ?? full;
          } else if (d.type === "error") {
            throw new LLMError(d.message || "Proxy error");
          }
        } catch (e) {
          if (e instanceof LLMError) throw e;
        }
      }
    }
  }
  return full;
}

function isNetworkError(e: unknown): boolean {
  return (
    e instanceof TypeError ||
    (e instanceof LLMError &&
      /CORS|Failed to fetch|NetworkError|load failed|Network request failed/i.test(e.message))
  );
}

async function streamModel(
  cfg: LLMConfig,
  messages: LLMMessage[],
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const prov = getProvider(cfg.provider);
  if (prov.browserSafe) {
    try {
      return await streamFromBrowser(cfg, messages, onChunk, signal);
    } catch (e) {
      // CORS/network gagal → otomatis pakai proxy server
      if (isNetworkError(e)) {
        return await streamViaProxy(cfg, messages, onChunk, signal);
      }
      throw e;
    }
  }
  return await streamViaProxy(cfg, messages, onChunk, signal);
}

/** Jalankan SATU role dengan fallback (klien) */
export async function runRoleStream(
  cfg: LLMConfig,
  messages: LLMMessage[],
  onChunk: (t: string) => void,
  signal?: AbortSignal,
  onFallback?: (primaryError: unknown) => void
): Promise<StreamResult> {
  try {
    const text = await streamModel(cfg, messages, onChunk, signal);
    return { text, usedFallback: false };
  } catch (e) {
    if (signal?.aborted) throw e;
    const fb = cfg.fallback;
    if (!fb || !fb.model?.trim()) throw e;
    onFallback?.(e);
    const text = await streamModel(fb, messages, onChunk, signal);
    return { text, usedFallback: true };
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
