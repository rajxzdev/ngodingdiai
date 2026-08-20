import { searchModels } from "@/lib/models-db";
import { NextRequest } from "next/server";

/**
 * Search engine model AI.
 * GET /api/models?provider=openai&q=gpt-4.0
 * → daftar model yang cocok, diurutkan TERBARU → TERLAMA (dari DB JSON).
 * Provider di luar DB (mis. custom) → hasil kosong; user pakai custom model.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") || "openrouter";
  const q = searchParams.get("q") || "";

  const result = searchModels(provider, q);
  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
