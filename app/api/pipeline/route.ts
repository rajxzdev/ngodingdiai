import { NextRequest } from "next/server";
import { PIPELINE_ORDER, CONTEXT_CHAIN, getRole } from "@/lib/roles";
import { callLLMStreamWithFallback, friendlyError, LLMError, LLMConfig } from "@/lib/llm";
import { generateDemo, DemoInput } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Catatan: di Vercel Hobby (gratis) batas function default ±10s, maks 60s.
// Aktifkan "Fluid Compute" di Vercel untuk maks 300s. Di bawah ini 60s agar build tidak error di Hobby.
export const maxDuration = 60;

interface PipelinePayload {
  project: string;
  type: string;
  brief: string;
  extra: string;
  configs: Record<string, LLMConfig>;
  demo?: boolean;
  /** "chain" = berurutan (kualitas) · "fast" = paralel (lebih cepat) */
  mode?: "chain" | "fast";
}

const encoder = new TextEncoder();

function send(controller: ReadableStreamDefaultController, type: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Timeout per role: kalau model tidak selesai dalam batas waktu, role dianggap gagal (bukan macet selamanya) */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(
      () => rej(new LLMError(`Timeout — ${label} tidak merespons dalam ${Math.round(ms / 1000)}s.`)),
      ms
    );
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

function buildMessages(roleId: string, payload: PipelinePayload, outputs: Record<string, string>) {
  const role = getRole(roleId);
  const { project, type, brief, extra } = payload;

  const ctxParts: string[] = [];
  for (const dep of CONTEXT_CHAIN[roleId] ?? []) {
    if (outputs[dep]?.trim()) {
      ctxParts.push(`<dokumen:${getRole(dep).output ?? dep}>\n${outputs[dep].slice(0, 4500)}\n</dokumen>`);
    }
  }
  const contextBlock = ctxParts.length ? `\n\nKonteks dari role sebelumnya:\n${ctxParts.join("\n\n")}` : "";

  const userContent = [
    `# Project Brief`,
    `- **Nama produk:** ${project}`,
    `- **Jenis:** ${type}`,
    `- **Deskripsi:** ${brief}`,
    extra ? `- **Catatan tambahan:** ${extra}` : "",
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

/**
 * Jalankan SATU role. Mengembalikan true jika sukses, false jika gagal (error sudah dikirim via event).
 * Role yang gagal TIDAK menghentikan pipeline — dilanjutkan ke role berikutnya.
 */
async function runOne(
  controller: ReadableStreamDefaultController,
  payload: PipelinePayload,
  roleId: string,
  outputs: Record<string, string>,
  demoTarget: DemoInput,
  signal: AbortSignal,
  failedRoles: Set<string>
): Promise<boolean> {
  const role = getRole(roleId);
  send(controller, "step", { type: "step", role: roleId, name: role.name, status: "running" });

  const start = Date.now();
  let text: string;
  let usedFallback = false;

  try {
    if (payload.demo || !payload.configs[roleId]?.key?.trim()) {
      text = generateDemo(roleId, demoTarget);
      send(controller, "chunk", { type: "chunk", role: roleId, chunk: text });
    } else {
      const cfg = payload.configs[roleId];
      const messages = buildMessages(roleId, payload, outputs);
      const fb = cfg.fallback && cfg.fallback.model?.trim() ? cfg.fallback : null;
      const result = await withTimeout(
        callLLMStreamWithFallback(
          cfg,
          messages,
          (chunk) => send(controller, "chunk", { type: "chunk", role: roleId, chunk }),
          signal,
          (primaryErr) =>
            send(controller, "fallback", {
              type: "fallback",
              role: roleId,
              name: role.name,
              fallbackModel: fb?.model ?? "",
              reason: friendlyError(primaryErr),
            })
        ),
        120000, // batas per role 120 detik
        `model ${role.name}`
      );
      text = result.text;
      usedFallback = result.usedFallback;
    }
  } catch (e) {
    if (signal.aborted) return false;
    failedRoles.add(roleId);
    send(controller, "role_error", {
      type: "role_error",
      role: roleId,
      name: role.name,
      reason: friendlyError(e),
    });
    return false;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  outputs[roleId] = text;
  send(controller, "step", {
    type: "step",
    role: roleId,
    name: role.name,
    status: "done",
    output: text,
    elapsed: Number(elapsed),
    usedFallback,
  });
  return true;
}

/** Pipeline 8 role AI (SSE + streaming token). mode chain = berurutan, mode fast = paralel. */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as PipelinePayload;
  const { project, type, brief, extra, configs = {}, demo = false } = body;
  const mode = body.mode === "fast" ? "fast" : "chain";
  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const outputs: Record<string, string> = {};
      const failedRoles = new Set<string>();
      const demoTarget: DemoInput = { project, type, brief, extra };
      const startAll = Date.now();

      // Heartbeat: kirim event ringan tiap 15 detik agar koneksi/proxy tidak menganggap mati
      const heartbeat = setInterval(() => {
        try {
          send(controller, "heartbeat", { type: "heartbeat" });
        } catch {
          /* stream sudah ditutup */
        }
      }, 15000);

      try {
        send(controller, "start", { type: "start", roles: PIPELINE_ORDER, demo, mode });

        if (mode === "fast") {
          // Tahap 1: Prompt Engineer (master prompt sebagai konteks)
          await runOne(controller, body, "prompt-engineer", outputs, demoTarget, signal, failedRoles);
          if (signal.aborted) return;
          // Tahap 2: role lainnya paralel (maks 3 bersamaan agar tidak kena rate limit)
          const rest = PIPELINE_ORDER.slice(1);
          let cursor = 0;
          const workers = Math.min(3, rest.length);
          await Promise.all(
            Array.from({ length: workers }, async () => {
              for (;;) {
                if (signal.aborted) return;
                const idx = cursor++;
                if (idx >= rest.length) return;
                const roleId = rest[idx];
                // Tunggu dependensi selesai (atau gagal) dengan batas waktu 40 detik
                const deps = CONTEXT_CHAIN[roleId] ?? [];
                const deadline = Date.now() + 40000;
                for (const d of deps) {
                  while (!outputs[d] && !failedRoles.has(d) && !signal.aborted && Date.now() < deadline) {
                    await sleep(150);
                  }
                }
                await runOne(controller, body, roleId, outputs, demoTarget, signal, failedRoles);
              }
            })
          );
        } else {
          for (const roleId of PIPELINE_ORDER) {
            if (signal.aborted) break;
            await runOne(controller, body, roleId, outputs, demoTarget, signal, failedRoles);
          }
        }

        if (signal.aborted) {
          send(controller, "cancel", { type: "cancel" });
          return;
        }

        send(controller, "done", {
          type: "done",
          outputs,
          totalSec: ((Date.now() - startAll) / 1000).toFixed(1),
          mode,
          failed: [...failedRoles],
        });
      } catch (e) {
        send(controller, "error", { type: "error", message: friendlyError(e) });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
