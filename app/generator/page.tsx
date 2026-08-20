"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import PipelineTree, { StepStatus } from "@/components/PipelineTree";
import OutputTabs from "@/components/OutputTabs";
import { loadConfig, hasAnyKey } from "@/lib/store";
import { ROLES, PIPELINE_ORDER, CONTEXT_CHAIN } from "@/lib/roles";
import { buildRoleMessages, runRoleStream, sleep, type BriefInput } from "@/lib/engine";
import { generateDemo } from "@/lib/demo";
import type { LLMConfig } from "@/lib/llm";
import type { IconName } from "@/components/Icon";

const TYPES = ["Website", "Web App", "Landing Page", "Dashboard", "Aplikasi Mobile UI", "Portal", "Lainnya"];

const EXAMPLES: { label: string; project: string; type: string; brief: string; extra: string }[] = [
  {
    label: "Landing Page Startup",
    project: "NusantaraTech",
    type: "Landing Page",
    brief:
      "Landing page modern untuk startup teknologi AI asal Indonesia. Tampilkan value proposition, 3 fitur utama, testimoni, harga, dan CTA pendaftaran beta. Target: developer & UMKM.",
    extra: "Gaya minimalis, aksen indigo, dark mode wajib.",
  },
  {
    label: "E-Commerce",
    project: "TokoKita",
    type: "Web App",
    brief:
      "Toko online untuk produk lokal: katalog, pencarian & filter, keranjang, checkout, riwayat pesanan, dan panel admin sederhana. Target mobile-first.",
    extra: "",
  },
  {
    label: "Dashboard Analitik",
    project: "MetrikPro",
    type: "Dashboard",
    brief:
      "Dashboard analitik untuk tim marketing: KPI utama, grafik penjualan, tabel data, filter periode, dan ekspor laporan PDF/CSV.",
    extra: "Fokus kecepatan render & UX data yang padat.",
  },
];


/** Otomatis tambahkan https:// jika user tidak menulis protocol */
function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return t;
  return "https://" + t;
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

// ---------- Pertanyaan pilihan (untuk brief lebih optimal) ----------
const LANGS = ["Bahasa Indonesia", "English", "Campuran (EN/ID)"];
const AUDIENCES = [
  "Publik Umum",
  "Developer & Profesional",
  "UMKM & Bisnis",
  "Pelajar & Mahasiswa",
  "Internal Tim",
];
const PLATFORMS = ["Responsif (semua layar)", "Mobile-first", "Desktop-first"];
const STYLES = [
  "Minimalis & bersih",
  "Modern (gradient halus)",
  "Glassmorphism / futuristik",
  "Profesional & formal",
  "Ceria & playful",
];
const FEATURES = [
  "Autentikasi / Login",
  "Dashboard / Admin",
  "Pencarian & Filter",
  "Pembayaran / Checkout",
  "Notifikasi",
  "Ekspor / Download",
  "Dark Mode",
  "SEO / Blog",
];

const SCALES = ["Landing sederhana", "Multi-halaman", "Web app kompleks"];
const ACCENTS = [
  "Indigo/Biru",
  "Emerald/Hijau",
  "Violet/Ungu",
  "Rose/Merah",
  "Amber/Oranye",
  "Monokrom (hitam)",
];
const THEMES = ["Light + Dark", "Light saja", "Dark saja"];
const STACKS = [
  "Next.js + Tailwind",
  "React + Tailwind",
  "Next.js + shadcn/ui",
  "Terserah (pilihkan)",
];
const CONTENTS = ["Konten realistis siap pakai", "Konten dummy/placeholder"];
const PRIORITIES = ["Kecepatan & performa", "Fitur lengkap", "SEO & konten"];
const LANGS_UI = ["Indonesia", "English", "Multi-bahasa (i18n)"];

interface PrefForm {
  project: string;
  type: string;
  brief: string;
  extra: string;
  lang: string;
  audience: string;
  platform: string;
  style: string;
  features: string[];
  scale: string;
  accent: string;
  theme: string;
  stack: string;
  content: string;
  priority: string;
  langUi: string;
}

const PREF_DEFAULTS = {
  lang: LANGS[0],
  audience: AUDIENCES[0],
  platform: PLATFORMS[0],
  style: STYLES[0],
  features: ["Dark Mode"],
  scale: SCALES[0],
  accent: ACCENTS[0],
  theme: THEMES[0],
  stack: STACKS[0],
  content: CONTENTS[0],
  priority: PRIORITIES[0],
  langUi: LANGS_UI[0],
};

function buildPrefs(f: PrefForm): string {
  return [
    `Bahasa output: ${f.lang}`,
    `Bahasa UI: ${f.langUi}`,
    `Target pengguna: ${f.audience}`,
    `Platform utama: ${f.platform}`,
    `Gaya desain: ${f.style}`,
    `Skala proyek: ${f.scale}`,
    `Warna aksen: ${f.accent}`,
    `Mode tampilan: ${f.theme}`,
    `Stack teknologi: ${f.stack}`,
    `Konten: ${f.content}`,
    `Prioritas: ${f.priority}`,
    f.features.length ? `Fitur utama: ${f.features.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n- ");
}

// Tombol pilihan reusable
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
      {children}
    </label>
  );
}

export default function GeneratorPage() {
  const [form, setForm] = useState<PrefForm>({
    project: "",
    type: TYPES[0],
    brief: "",
    extra: "",
    ...PREF_DEFAULTS,
  });
  // Website referensi (Web & Reference Analyst)
  const [webUrl, setWebUrl] = useState("");
  const [webMode, setWebMode] = useState<"desain" | "sistem" | "both">("both");
  const [manualWeb, setManualWeb] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [mode, setMode] = useState<"chain" | "fast">("chain");
  const [status, setStatus] = useState<Record<string, StepStatus>>({});
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [totalSec, setTotalSec] = useState<string | null>(null);
  // Live streaming per role
  const [live, setLive] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const [fallbackCount, setFallbackCount] = useState(0);
  const fallbackCountRef = useRef(0);

  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startTs = useRef<Record<string, number>>({});
  const liveRef = useRef<Record<string, string>>({});
  const timerRef = useRef<number | null>(null);
  // Deteksi stream terputus: event "done" beneran harus sampai dulu
  const statusRef = useRef<Record<string, StepStatus>>({});
  // Watchdog: tidak ada event dalam X detik → peringatan di log
  const lastEventRef = useRef(Date.now());
  const watchdogWarningRef = useRef(false);

  // Watchdog: kalau tidak ada data dari server selama 40 detik, kasih peringatan di log
  useEffect(() => {
    if (phase !== "running") return;
    watchdogWarningRef.current = false;
    const iv = window.setInterval(() => {
      const idle = Date.now() - lastEventRef.current;
      if (idle > 40000 && !watchdogWarningRef.current) {
        watchdogWarningRef.current = true;
        setLogs((l) => [
          ...l,
          `⚠️  Tidak ada respons dari AI selama ${Math.round(idle / 1000)}s — model besar memang lambat, tapi jika berlanjut kemungkinan koneksi macet / batas durasi server. Gunakan tombol "Batal" jika terlalu lama.`,
        ]);
        scrollLog();
      }
    }, 10000);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Ticker untuk elapsed time selama running
  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [phase]);

  const fileOutputs = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of ROLES) if (r.output && outputs[r.id]) out[r.output] = outputs[r.id];
    return out;
  }, [outputs]);

  const activeRoles = useMemo(
    () => PIPELINE_ORDER.filter((id) => status[id] === "running"),
    [status]
  );

  const scrollLog = () => {
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const run = async () => {
    if (!form.project.trim() || !form.brief.trim()) {
      setError("Isi nama produk dan deskripsi dulu ya.");
      return;
    }
    const cfg = loadConfig();
    const demo = !hasAnyKey(cfg);
    setIsDemo(demo);
    // Config runtime per role: provider+model dari role, key dari penyimpanan per-provider
    const configs: Record<string, LLMConfig> = {};
    for (const r of ROLES) {
      const rc = cfg.roles[r.id];
      const fallback: LLMConfig | undefined =
        rc.fallbackEnabled && rc.fallbackModel?.trim()
          ? {
              provider: rc.fallbackProvider,
              model: rc.fallbackModel,
              key: cfg.keys[rc.fallbackProvider] ?? "",
              temperature: rc.temperature,
              base: cfg.bases[rc.fallbackProvider] || undefined,
            }
          : undefined;
      configs[r.id] = {
        provider: rc.provider,
        model: rc.model,
        key: cfg.keys[rc.provider] ?? "",
        temperature: rc.temperature,
        base: cfg.bases[rc.provider] || undefined,
        fallback,
        smartFallback: rc.smartFallback !== false,
      };
    }
    setError(null);
    setOutputs({});
    setLogs([]);
    setStatus({});
    statusRef.current = {};
    setTotalSec(null);
    startTs.current = {};
    liveRef.current = {};
    fallbackCountRef.current = 0;
    setFallbackCount(0);
    lastEventRef.current = Date.now();
    watchdogWarningRef.current = false;
    setLive({});
    setPhase("running");
    scrollLog();

    const controller = new AbortController();
    abortRef.current = controller;

    // ---- Ambil isi website referensi (jika ada URL / teks manual) ----
    let webInfo: BriefInput["web"] = undefined;
    const urlTrim = normalizeUrl(webUrl);
    const manualTrim = manualWeb.trim();
    if (urlTrim || manualTrim) {
      if (urlTrim) {
        setLogs((l) => [...l, `🔗  Mengambil isi ${urlTrim} …`]);
        scrollLog();
        setFetchingUrl(true);
        try {
          const res = await fetch("/api/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urlTrim, mode: webMode }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (data.ok) {
            webInfo = data;
            setLogs((l) => [
              ...l,
              `✓  Isi website diambil (${(data.text || "").length.toLocaleString("id-ID")} karakter)${data.title ? ` — "${data.title}"` : ""}`,
            ]);
          } else {
            setLogs((l) => [...l, `⚠️  URL gagal diambil: ${data.error || "error"}`]);
            if (manualTrim) {
              webInfo = { ok: true, url: "(isi manual)", text: manualTrim, mode: webMode };
              setLogs((l) => [...l, `✓  Memakai isi manual (${manualTrim.length.toLocaleString("id-ID")} karakter)`]);
            } else {
              webInfo = { ok: false, url: urlTrim, error: data.error || "error", mode: webMode };
            }
          }
        } catch (e) {
          if ((e as Error)?.name === "AbortError") throw e;
          setLogs((l) => [...l, `⚠️  Gagal mengambil URL: ${e instanceof Error ? e.message : String(e)}`]);
          webInfo = manualTrim
            ? { ok: true, url: "(isi manual)", text: manualTrim, mode: webMode }
            : { ok: false, url: urlTrim, error: String(e), mode: webMode };
        } finally {
          setFetchingUrl(false);
        }
      } else {
        webInfo = { ok: true, url: "(isi manual)", text: manualTrim, mode: webMode };
        setLogs((l) => [...l, `✓  Memakai isi manual (${manualTrim.length.toLocaleString("id-ID")} karakter)`]);
      }
    }

    const input = {
      project: form.project,
      type: form.type,
      brief: form.brief,
      extra: form.extra,
      prefs: buildPrefs(form),
      web: webInfo,
    };
    const demoTarget = { ...input };
    const outputsLocal: Record<string, string> = {};
    const failedLocal: string[] = [];

    const runRole = async (roleId: string) => {
      const role = ROLES.find((x) => x.id === roleId);
      if (!role) return false;
      statusRef.current[roleId] = "running";
      setStatus((s) => ({ ...s, [roleId]: "running" }));
      startTs.current[roleId] = Date.now();
      liveRef.current[roleId] = "";
      setLive((l) => ({ ...l, [roleId]: "" }));
      setLogs((l) => [...l, `▶  ${role.name} — menulis dokumen…`]);
      scrollLog();

      const messages = buildRoleMessages(roleId, input, outputsLocal);
      const c = configs[roleId];
      let text = "";
      let usedFallback = false;

      try {
        if (demo || !c?.key?.trim()) {
          text = generateDemo(roleId, demoTarget);
          liveRef.current[roleId] = text;
          setLive((l) => ({ ...l, [roleId]: text }));
        } else {
          const res = await runRoleStream(
            c,
            messages,
            (chunk) => {
              const rid = roleId;
              lastEventRef.current = Date.now();
              watchdogWarningRef.current = false;
              liveRef.current[rid] = (liveRef.current[rid] ?? "") + chunk;
              setLive((l) => ({ ...l, [rid]: liveRef.current[rid]! }));
            },
            controller.signal,
            (primaryErr) => {
              const rid = roleId;
              liveRef.current[rid] = "";
              setLive((l) => ({ ...l, [rid]: "" }));
              fallbackCountRef.current += 1;
              setFallbackCount((n) => n + 1);
              const reason = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
              setLogs((l) => [
                ...l,
                `🛟  ${role.name} — model utama gagal (${reason}), beralih ke ${c.fallback?.model || "fallback"}…`,
              ]);
              scrollLog();
            },
            {
              enabled: c.smartFallback !== false,
              onTry: ({ model }) => {
                const rid = roleId;
                liveRef.current[rid] = "";
                setLive((l) => ({ ...l, [rid]: "" }));
                fallbackCountRef.current += 1;
                setFallbackCount((n) => n + 1);
                setLogs((l) => [
                  ...l,
                  `🛟  ${role.name} — mencoba cadangan otomatis: ${model}…`,
                ]);
                scrollLog();
              },
            }
          );
          text = res.text;
          usedFallback = res.usedFallback;
        }
      } catch (e) {
        if (controller.signal.aborted) return false;
        failedLocal.push(roleId);
        statusRef.current[roleId] = "error";
        setStatus((s) => ({ ...s, [roleId]: "error" }));
        const reason = e instanceof Error ? e.message : String(e);
        setLogs((l) => [
          ...l,
          `⛔  ${role.name} GAGAL (${reason}) — dilewati, lanjut role berikutnya.`,
        ]);
        scrollLog();
        return false;
      }

      outputsLocal[roleId] = text;
      setOutputs((o) => ({ ...o, [roleId]: text }));
      const sec = ((Date.now() - startTs.current[roleId]) / 1000).toFixed(1);
      statusRef.current[roleId] = "done";
      setStatus((s) => ({ ...s, [roleId]: "done" }));
      const via = usedFallback ? " · via fallback 🛟" : "";
      setLogs((l) => [...l, `✓  ${role.name} — selesai (${wordCount(text)} kata · ${sec}s${via})`]);
      scrollLog();
      return true;
    };

    try {
      if (mode === "fast") {
        // Web Analyst → Prompt Engineer dulu (Prompt butuh hasil analisis web), sisanya paralel
        await runRole("web-analyst");
        await runRole("prompt-engineer");
        const rest = PIPELINE_ORDER.slice(2);
        let cursor = 0;
        const workers = Math.min(3, rest.length);
        await Promise.all(
          Array.from({ length: workers }, async () => {
            for (;;) {
              if (controller.signal.aborted) return;
              const idx = cursor++;
              if (idx >= rest.length) return;
              const rid = rest[idx];
              const deps = CONTEXT_CHAIN[rid] ?? [];
              const deadline = Date.now() + 40000;
              for (const d of deps) {
                while (!outputsLocal[d] && !failedLocal.includes(d) && !controller.signal.aborted && Date.now() < deadline) {
                  await sleep(150);
                }
              }
              await runRole(rid);
            }
          })
        );
      } else {
        for (const rid of PIPELINE_ORDER) {
          if (controller.signal.aborted) break;
          await runRole(rid);
        }
      }

      if (controller.signal.aborted) {
        setLogs((l) => [...l, "⏹  Pipeline dibatalkan."]);
        setPhase("idle");
        return;
      }
      const failNote = failedLocal.length ? ` · GAGAL: ${failedLocal.length} role` : "";
      setLogs((l) => [
        ...l,
        `✅  Pipeline selesai (${fallbackCountRef.current} fallback dipakai${failNote}) — dokumen siap diunduh!`,
      ]);
      setPhase("done");
      scrollLog();
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        setLogs((l) => [...l, "⏹  Pipeline dibatalkan."]);
        setPhase("idle");
      } else {
        setError(e instanceof Error ? e.message : String(e));
        setLogs((l) => [...l, `⛔  Error: ${e instanceof Error ? e.message : String(e)}`]);
        setPhase("idle");
      }
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const fill = (ex: (typeof EXAMPLES)[number]) => {
    setForm({ project: ex.project, type: ex.type, brief: ex.brief, extra: ex.extra, ...PREF_DEFAULTS });
  };

  const running = phase === "running";

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Generator Pipeline</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            9 role AI · output: web-analysis.md, prompt.md, prd.md, design.md, map.md, review.md
          </p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500"
        >
          <Icon name="sliders" size={14} />
          Atur Provider & Model per Role
        </Link>
      </div>

      {/* Banner demo / error */}
      {isDemo && phase !== "idle" && (
        <div className="mt-5 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
          <div>
            <b>Mode Demo aktif</b> — tidak ada API key terdeteksi, jadi pipeline menghasilkan contoh dokumen.
            Untuk hasil asli, atur provider & model AI di halaman{" "}
            <Link href="/settings" className="font-semibold underline underline-offset-2">
              Atur AI
            </Link>
            .
          </div>
        </div>
      )}
      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr]">
        {/* ====== FORM ====== */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <Icon name="send" size={16} />
              </span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Brief Produk</h2>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Nama Produk
                </label>
                <input
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="cth: NusantaraTech"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Jenis Produk
                </label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevronDown"
                    size={15}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>

              {/* ===== Website referensi (opsional) ===== */}
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 dark:border-emerald-500/25 dark:bg-emerald-500/5">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  <Icon name="globe" size={11} />
                  Website Referensi (opsional)
                </p>
                <div className="space-y-2.5">
                  <input
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    onBlur={(e) => setWebUrl(normalizeUrl(e.target.value))}
                    placeholder="contoh-website.com"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={fetchingUrl}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-xs outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-emerald-500"
                  />
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Dipakai sebagai
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: "desain", label: "🎨 Contoh Desain" },
                          { id: "sistem", label: "🧩 Contoh Sistem" },
                          { id: "both", label: "✨ Desain + Sistem" },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setWebMode(m.id)}
                          disabled={fetchingUrl}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-60 ${
                            webMode === m.id
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={manualWeb}
                    onChange={(e) => setManualWeb(e.target.value)}
                    rows={2}
                    placeholder="Atau tempel isi web manual di sini (dipakai jika URL gagal diambil)…"
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-emerald-500"
                  />
                  <p className="text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                    <b className="text-emerald-500">https:// ditambahkan otomatis</b> kalau tidak ditulis. Role{" "}
                    <b>Web & Reference Analyst</b> akan menganalisis isi website ini, lalu hasilnya diteruskan
                    ke <b>Prompt Engineer</b> sebagai acuan desain &amp; sistem.
                  </p>
                </div>
              </div>

              {/* ===== Pertanyaan pilihan (buat hasil lebih optimal) ===== */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <Icon name="sparkles" size={11} />
                  Pilih preferensi (bikin hasil lebih pas)
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Bahasa Output
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setForm({ ...form, lang: l })}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                            form.lang === l
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Target Pengguna
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AUDIENCES.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setForm({ ...form, audience: a })}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                            form.audience === a
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Platform Utama
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, platform: p })}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                            form.platform === p
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Gaya Desain
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, style: s })}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                            form.style === s
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Fitur Utama <span className="font-normal text-zinc-400">(boleh pilih banyak)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {FEATURES.map((f) => {
                        const on = form.features.includes(f);
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                features: on
                                  ? form.features.filter((x) => x !== f)
                                  : [...form.features, f],
                              })
                            }
                            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                              on
                                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                            }`}
                          >
                            {on && <Icon name="check" size={11} strokeWidth={2.6} />}
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Skala Proyek</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {SCALES.map((s) => (
                        <Pill key={s} active={form.scale === s} onClick={() => setForm({ ...form, scale: s })}>
                          {s}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Warna Aksen</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCENTS.map((a) => (
                        <Pill key={a} active={form.accent === a} onClick={() => setForm({ ...form, accent: a })}>
                          {a}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Mode Tampilan</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {THEMES.map((t) => (
                        <Pill key={t} active={form.theme === t} onClick={() => setForm({ ...form, theme: t })}>
                          {t}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Stack Teknologi</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {STACKS.map((s) => (
                        <Pill key={s} active={form.stack === s} onClick={() => setForm({ ...form, stack: s })}>
                          {s}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Bahasa UI</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGS_UI.map((l) => (
                        <Pill key={l} active={form.langUi === l} onClick={() => setForm({ ...form, langUi: l })}>
                          {l}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Isi Konten</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {CONTENTS.map((c) => (
                        <Pill key={c} active={form.content === c} onClick={() => setForm({ ...form, content: c })}>
                          {c}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <PillLabel>Prioritas Utama</PillLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {PRIORITIES.map((p) => (
                        <Pill key={p} active={form.priority === p} onClick={() => setForm({ ...form, priority: p })}>
                          {p}
                        </Pill>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Deskripsi Produk
                </label>
                <textarea
                  value={form.brief}
                  onChange={(e) => setForm({ ...form, brief: e.target.value })}
                  rows={3}
                  placeholder="Jelaskan produkmu: target pengguna, fitur utama, dan tujuan…"
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Catatan Tambahan <span className="font-normal text-zinc-400">(opsional)</span>
                </label>
                <textarea
                  value={form.extra}
                  onChange={(e) => setForm({ ...form, extra: e.target.value })}
                  rows={2}
                  placeholder="Gaya visual, stack, batasan, dsb…"
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                />
              </div>

              {/* Mode pipeline */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Mode Pipeline
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
                  <button
                    onClick={() => setMode("chain")}
                    disabled={running}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                      mode === "chain"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    🧵 Rantai (kualitas)
                  </button>
                  <button
                    onClick={() => setMode("fast")}
                    disabled={running}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                      mode === "fast"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    ⚡ Ekspres (paralel)
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                  <b>Rantai:</b> 9 role berurutan, hasil role sebelumnya jadi konteks (kualitas terbaik).{" "}
                  <b>Ekspres:</b> setelah Prompt Engineer, 7 role berjalan paralel — jauh lebih cepat.
                </p>
              </div>

              <button
                onClick={run}
                disabled={running}
                className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-zinc-900 dark:bg-white dark:text-zinc-900 dark:shadow-white/10 dark:hover:bg-zinc-200"
              >
                {running ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                    Pipeline berjalan…
                  </>
                ) : (
                  <>
                    <Icon name="play" size={16} />
                    Jalankan Pipeline 9 Role
                  </>
                )}
              </button>
              {running && (
                <button
                  onClick={cancel}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-2.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  <Icon name="x" size={13} />
                  Batal
                </button>
              )}
            </div>

            {/* Contoh */}
            <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Contoh cepat
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => fill(ex)}
                    disabled={running}
                    className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Icon name="bolt" size={13} className="text-indigo-500 dark:text-indigo-400" />
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ====== PIPELINE + LIVE + LOG ====== */}
        <div className="min-w-0">
          <PipelineTree status={status} className={phase === "idle" && Object.keys(status).length === 0 ? "opacity-70" : ""} />

          {/* Live output streaming */}
          {(running || Object.keys(live).length > 0) && (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                  </span>
                  Live Output
                  {mode === "fast" && activeRoles.length > 0 && (
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-500">
                      {activeRoles.length} paralel
                    </span>
                  )}
                </span>
                {totalSec && phase === "done" && (
                  <span className="text-[11px] font-semibold text-emerald-500">⏱ total {totalSec}s</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto px-5 py-4">
                {PIPELINE_ORDER.map((id) => {
                  const r = ROLES.find((x) => x.id === id)!;
                  const st = status[id];
                  if (!st && !live[id]) return null;
                  const text = live[id] ?? "";
                  const elapsed = startTs.current[id]
                    ? (((now - startTs.current[id]) / 1000)).toFixed(1)
                    : null;
                  return (
                    <div key={id} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            st === "done"
                              ? "bg-emerald-500"
                              : st === "error"
                                ? "bg-red-500"
                                : st === "running"
                                  ? "animate-pulse bg-indigo-500"
                                  : "bg-zinc-300 dark:bg-zinc-600"
                          }`}
                        />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{r.name}</span>
                        {st === "done" && (
                          <span className="text-[10px] font-semibold text-emerald-500">✓ {elapsed}s</span>
                        )}
                        {st === "error" && (
                          <span className="text-[10px] font-semibold text-red-500">✗ gagal</span>
                        )}
                        {st === "running" && (
                          <span className="font-mono text-[10px] text-indigo-500">
                            menulis… {wordCount(text)} kata · {elapsed}s
                          </span>
                        )}
                        {st === "idle" && <span className="text-[10px] text-zinc-400">antre…</span>}
                      </div>
                      {text && (
                        <pre className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-zinc-100 bg-zinc-50 p-3 font-mono text-[11px] leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                          {text}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Log */}
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <Icon name="terminal" size={14} />
                Log Pipeline
              </span>
              <span
                className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                  running
                    ? "text-indigo-500"
                    : phase === "done"
                      ? "text-emerald-500"
                      : "text-zinc-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    running ? "animate-pulse bg-indigo-500" : phase === "done" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                {running ? "RUNNING" : phase === "done" ? "COMPLETED" : "IDLE"}
              </span>
            </div>
            <div ref={logRef} className="max-h-56 overflow-y-auto px-5 py-4 font-mono text-[12px] leading-relaxed">
              {logs.length === 0 ? (
                <p className="text-zinc-400 dark:text-zinc-500">
                  # Pipeline siap. Isi brief, pilih mode, lalu tekan "Jalankan Pipeline 9 Role"…
                </p>
              ) : (
                logs.map((l, i) => (
                  <p
                    key={i}
                    className={
                      l.startsWith("✅")
                        ? "font-semibold text-emerald-500"
                        : l.startsWith("✓")
                          ? "text-zinc-600 dark:text-zinc-300"
                          : l.startsWith("▶")
                            ? "text-indigo-500 dark:text-indigo-400"
                            : l.startsWith("🛟") || l.startsWith("⚠️")
                              ? "font-medium text-amber-500"
                              : l.startsWith("⛔")
                                ? "font-semibold text-red-500"
                                : l.startsWith("⏹")
                                  ? "text-red-500"
                                  : "text-zinc-500 dark:text-zinc-400"
                    }
                  >
                    {l}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Tips singkat */}
          <div className="mt-4 flex items-start gap-2.5 rounded-3xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-[11px] leading-relaxed text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-300">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            <p>
              <b>Tips:</b> pakai model ber-badge <b>⚡ Cepat</b> untuk role ringan (PRD, UX) &amp; model besar untuk
              role kompleks (Design Engineer, QA) di halaman{" "}
              <Link href="/settings" className="font-semibold underline underline-offset-2">
                Atur AI
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* ====== OUTPUT ====== */}
      {Object.keys(fileOutputs).length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Icon name="download" size={16} />
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Output Dokumen</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Preview, salin, atau unduh masing-masing file Markdown.
              </p>
            </div>
          </div>
          <OutputTabs outputs={fileOutputs} />
        </div>
      )}
    </main>
  );
}
