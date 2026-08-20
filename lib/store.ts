import { ROLES } from "./roles";
import { PROVIDERS } from "./providers";

export interface RoleConfig {
  provider: string;
  model: string;
  temperature: number;
  /** Fallback model MANUAL: dipakai otomatis kalau model utama error/rate-limit */
  fallbackEnabled: boolean;
  fallbackProvider: string;
  fallbackModel: string;
  /** Smart Fallback: otomatis cari & coba model lain yang tersedia saat kena limit/unavailable */
  smartFallback: boolean;
}

export interface AppConfig {
  /** Konfigurasi per role (provider + model, TANPA key) */
  roles: Record<string, RoleConfig>;
  /** Satu API key per provider — dipakai otomatis oleh semua role provider tersebut */
  keys: Record<string, string>;
  /** Override base URL per provider (dipakai provider custom / gateway) */
  bases: Record<string, string>;
}

const CONFIG_KEY = "ngodingdiai.config.v1";
const THEME_KEY = "ngodingdiai.theme";

export const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

export function defaultConfig(): AppConfig {
  const cfg: AppConfig = { roles: {}, keys: {}, bases: {} };
  for (const r of ROLES) {
    cfg.roles[r.id] = {
      provider: "openrouter",
      model: DEFAULT_MODEL,
      temperature: 0.7,
      fallbackEnabled: false,
      fallbackProvider: "openrouter",
      fallbackModel: "",
      smartFallback: true,
    };
  }
  // Default yang lebih "berat" untuk role yang butuh reasoning kuat
  const heavy: Record<string, string> = {
    "design-engineer": "anthropic/claude-sonnet-4.6",
    "map-engineer": "anthropic/claude-sonnet-4.6",
    "quality-reviewer": "anthropic/claude-sonnet-4.6",
  };
  for (const [id, model] of Object.entries(heavy)) {
    if (cfg.roles[id]) cfg.roles[id].model = model;
  }
  return cfg;
}

function clampTemp(t: unknown): number {
  return typeof t === "number" && Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0.7;
}

function validProvider(p: unknown): boolean {
  return typeof p === "string" && PROVIDERS.some((x) => x.id === p);
}

function normalizeRole(s: unknown, fallback: RoleConfig): RoleConfig {
  const o = (s ?? {}) as Record<string, unknown>;
  return {
    provider: validProvider(o.provider) ? (o.provider as string) : fallback.provider,
    model: typeof o.model === "string" && o.model.trim() ? o.model.trim() : fallback.model,
    temperature: clampTemp(o.temperature),
    fallbackEnabled:
      typeof o.fallbackEnabled === "boolean" ? o.fallbackEnabled : fallback.fallbackEnabled,
    fallbackProvider: validProvider(o.fallbackProvider)
      ? (o.fallbackProvider as string)
      : fallback.fallbackProvider,
    fallbackModel:
      typeof o.fallbackModel === "string" && o.fallbackModel.trim() ? o.fallbackModel.trim() : fallback.fallbackModel,
    smartFallback: typeof o.smartFallback === "boolean" ? o.smartFallback : fallback.smartFallback,
  };
}

export function loadConfig(): AppConfig {
  const base = defaultConfig();
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    if (!saved || typeof saved !== "object") return base;

    const loadRole = (id: string, s: unknown) => {
      base.roles[id] = normalizeRole(s, base.roles[id]);
    };

    if (saved.roles && typeof saved.roles === "object") {
      // Format baru: { roles, keys, bases }
      const roles = saved.roles as Record<string, unknown>;
      for (const r of ROLES) loadRole(r.id, roles[r.id]);
      if (saved.keys && typeof saved.keys === "object") {
        for (const [p, k] of Object.entries(saved.keys as Record<string, unknown>)) {
          if (typeof k === "string" && k.trim()) base.keys[p] = k;
        }
      }
      if (saved.bases && typeof saved.bases === "object") {
        for (const [p, b] of Object.entries(saved.bases as Record<string, unknown>)) {
          if (typeof b === "string") base.bases[p] = b;
        }
      }
    } else {
      // Format lama: key per role → migrasi otomatis ke key per provider
      for (const r of ROLES) {
        const s = saved[r.id];
        if (s && typeof s === "object") {
          loadRole(r.id, s);
          const o = s as Record<string, unknown>;
          if (typeof o.key === "string" && o.key.trim()) {
            const p = validProvider(o.provider) ? (o.provider as string) : base.roles[r.id].provider;
            if (!base.keys[p]) base.keys[p] = o.key;
          }
        }
      }
    }
    return base;
  } catch {
    return base;
  }
}

export function saveConfig(cfg: AppConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* noop */
  }
}

export function hasAnyKey(cfg: AppConfig): boolean {
  return Object.values(cfg.keys).some((k) => Boolean(k?.trim()));
}

/** Parsing file konfigurasi hasil ekspor (mendukung format baru & lama) */
export function parseImported(data: unknown, current: AppConfig): { cfg: AppConfig; count: number } {
  const cfg: AppConfig = JSON.parse(JSON.stringify(current));
  let count = 0;

  const applyRole = (id: string, s: unknown) => {
    if (!s || typeof s !== "object") return;
    cfg.roles[id] = normalizeRole(s, cfg.roles[id]);
    const o = s as Record<string, unknown>;
    if (typeof o.key === "string" && o.key.trim()) {
      const p = validProvider(o.provider) ? (o.provider as string) : cfg.roles[id].provider;
      cfg.keys[p] = o.key;
    }
    count++;
  };

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.roles && typeof d.roles === "object") {
      const roles = d.roles as Record<string, unknown>;
      for (const r of ROLES) applyRole(r.id, roles[r.id]);
      if (d.keys && typeof d.keys === "object") {
        for (const [p, k] of Object.entries(d.keys as Record<string, unknown>)) {
          if (typeof k === "string" && k.trim()) cfg.keys[p] = k;
        }
      }
      if (d.bases && typeof d.bases === "object") {
        for (const [p, b] of Object.entries(d.bases as Record<string, unknown>)) {
          if (typeof b === "string") cfg.bases[p] = b;
        }
      }
    } else {
      // legacy: per role dengan key
      for (const r of ROLES) applyRole(r.id, d[r.id]);
    }
  }
  return { cfg, count };
}

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function setTheme(t: "light" | "dark"): void {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* noop */
  }
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
}
