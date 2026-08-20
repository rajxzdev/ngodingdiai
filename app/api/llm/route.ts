import { NextRequest } from "next/server";
import { callLLMStream, friendlyError, LLMConfig, LLMMessage } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Per-role call (1 panggilan model) — cukup 60s di Vercel Hobby; aktifkan Fluid Compute utk 300s.
export const maxDuration = 60;

const encoder = new TextEncoder();
function send(controller: ReadableStreamDefaultController, type: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
}

/**
 * Proxy streaming SATU panggilan LLM (dipakai provider tanpa CORS: OpenAI, Anthropic,
 * atau fallback saat koneksi browser gagal). Streaming token tetap real-time.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { config?: LLMConfig; messages?: LLMMessage[] };
  const cfg = body.config;
  const messages = body.messages ?? [];
  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!cfg) throw new Error("Konfigurasi kosong");
        const text = await callLLMStream(cfg, messages, (chunk) => {
          send(controller, "chunk", { type: "chunk", chunk });
        }, signal);
        send(controller, "done", { type: "done", output: text });
      } catch (e) {
        if (signal.aborted) return;
        send(controller, "error", { type: "error", message: friendlyError(e) });
      } finally {
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
