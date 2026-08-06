import { NextRequest } from "next/server";
import { callLLM, friendlyError, LLMConfig } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { config?: LLMConfig };
    const cfg = body.config;
    if (!cfg) return Response.json({ ok: false, error: "Konfigurasi kosong" }, { status: 400 });

    const start = Date.now();
    const reply = await callLLM(cfg, [
      { role: "system", content: "Kamu adalah asisten uji koneksi. Balas hanya dengan satu kata: OK" },
      { role: "user", content: "Tes koneksi." },
    ]);
    const latency = Date.now() - start;
    return Response.json({ ok: true, latencyMs: latency, reply: reply.slice(0, 120) });
  } catch (e) {
    return Response.json({ ok: false, error: friendlyError(e) }, { status: 200 });
  }
}
