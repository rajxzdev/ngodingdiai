/**
 * Mesin pencari model AI.
 * Database model tersimpan sebagai JSON (lib/models.json) — diurutkan otomatis
 * dari TERBARU ke TERLAMA, dengan fuzzy search + fallback custom model.
 */
import rawModels from "./models.json";

export interface ModelInfo {
  id: string;
  name: string;
  released: string; // ISO date
  ctx?: number; // context window (ribuan token)
  note?: string;
  badge?: "new" | "fast" | "free" | "recommended";
}

export const MODELS_DB: Record<string, ModelInfo[]> = rawModels as Record<string, ModelInfo[]>;

const BADGE_LABEL: Record<NonNullable<ModelInfo["badge"]>, string> = {
  new: "Baru",
  fast: "Cepat",
  free: "Gratis",
  recommended: "Rekomendasi",
};

export function badgeLabel(b: ModelInfo["badge"]): string | null {
  return b ? BADGE_LABEL[b] : null;
}

/** Normalisasi untuk pencarian fuzzy: "gpt-4.0" ≈ "gpt-4o", "claude 3.5 sonnet" ≈ "claude-3-5-sonnet" */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/o/g, "0");
}

function scoreModel(m: ModelInfo, q: string, qNorm: string): number {
  if (!q) return 1;
  const idNorm = norm(m.id);
  const nameNorm = norm(m.name);
  if (idNorm === qNorm) return 100;
  if (idNorm.startsWith(qNorm)) return 80;
  if (idNorm.includes(qNorm)) return 60;
  if (nameNorm.includes(qNorm)) return 45;
  // token-based: semua token query ada di id/name
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => norm(t))
    .filter(Boolean);
  if (tokens.length > 1) {
    const allInId = tokens.every((t) => idNorm.includes(t));
    const allInName = tokens.every((t) => nameNorm.includes(t));
    if (allInId || allInName) return 40;
    const someInId = tokens.filter((t) => idNorm.includes(t)).length;
    const someInName = tokens.filter((t) => nameNorm.includes(t)).length;
    if (someInId + someInName > 0) return 15 + Math.max(someInId, someInName) * 5;
  }
  return 0;
}

export interface SearchResult {
  provider: string;
  query: string;
  total: number;
  models: ModelInfo[];
}

/** Mesin pencari model: filter provider → fuzzy match → urut TERBARU ke TERLAMA */
export function searchModels(providerId: string, q: string, limit = 50): SearchResult {
  const all = MODELS_DB[providerId] ?? [];
  const qNorm = norm(q);
  const scored = all
    .map((m) => ({ m, s: scoreModel(m, q, qNorm) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.m.released.localeCompare(a.m.released) || a.m.id.localeCompare(b.m.id));
  const models = scored.slice(0, limit).map((x) => x.m);
  // OpenRouter: sematkan "openrouter/auto" di paling atas (router otomatis) — tanpa duplikat
  if (providerId === "openrouter") {
    const auto = all.find((m) => m.id === "openrouter/auto");
    if (auto) {
      const withoutAuto = models.filter((m) => m.id !== "openrouter/auto");
      const result = [auto, ...withoutAuto];
      return { provider: providerId, query: q, total: result.length, models: result };
    }
  }
  return { provider: providerId, query: q, total: models.length, models };
}

export function allModels(providerId: string): ModelInfo[] {
  return [...(MODELS_DB[providerId] ?? [])].sort((a, b) => b.released.localeCompare(a.released));
}

const FAST_RE = /fast|mini|small|nano|flash-lite|flash|instant|scout|8b|20b|17b|31b|oss-20b|lite|luna/i;
const HEAVY_RE = /opus|fable|super|ultra|maverick|pro|large|sol|120b|70b|1t|max|cyber|deepseek-v4-pro|sonnet-5/i;

/** Perkiraan bobot model untuk bantu user memilih (kecepatan pipeline) */
export function modelHint(providerId: string, modelId: string): { label: string; tone: "fast" | "heavy" | "normal" } | null {
  if (!modelId?.trim()) return null;
  const list = MODELS_DB[providerId] ?? [];
  const m = list.find((x) => x.id === modelId || x.name === modelId);
  if (m?.badge === "fast") return { label: "Cepat", tone: "fast" };
  if (m?.badge === "free") return { label: "Gratis", tone: "fast" };
  if (FAST_RE.test(modelId)) return { label: "Cepat", tone: "fast" };
  if (HEAVY_RE.test(modelId)) return { label: "Berat · lambat", tone: "heavy" };
  return null;
}
