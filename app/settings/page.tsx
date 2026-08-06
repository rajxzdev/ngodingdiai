"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Icon from "@/components/Icon";
import ModelSearchModal from "@/components/ModelSearchModal";
import { ROLES, CHAIN_META } from "@/lib/roles";
import { PROVIDERS, getProvider } from "@/lib/providers";
import { modelHint } from "@/lib/models-db";
import {
  AppConfig,
  RoleConfig,
  defaultConfig,
  loadConfig,
  saveConfig,
  clearConfig,
  hasAnyKey,
  parseImported,
} from "@/lib/store";
import type { IconName } from "@/components/Icon";

interface TestState {
  state: "idle" | "testing" | "ok" | "fail";
  label: string;
}

/** Badge kecil status uji koneksi */
function TestBadge({ state }: { state?: TestState }) {
  if (!state) return null;
  return (
    <span
      className={`inline-flex max-w-[200px] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        state.state === "ok"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : state.state === "fail"
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : state.state === "testing"
              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              : "bg-zinc-500/10 text-zinc-500"
      }`}
    >
      {state.state === "testing" && (
        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {state.label}
    </span>
  );
}

/** Tombol uji koneksi */
function TestButton({
  state,
  onClick,
  idleLabel,
}: {
  state?: TestState;
  onClick: () => void;
  idleLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={state?.state === "testing"}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-60 ${
        state?.state === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          : state?.state === "fail"
            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      }`}
      title="Uji koneksi key + model"
    >
      {state?.state === "testing" ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : state?.state === "ok" ? (
        <Icon name="check" size={12} />
      ) : state?.state === "fail" ? (
        <Icon name="alert" size={12} />
      ) : (
        <Icon name="bolt" size={12} />
      )}
      {state?.state === "ok" || state?.state === "fail" ? state.label : idleLabel}
    </button>
  );
}

/** Toggle switch kecil */
function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [cfg, setCfg] = useState<AppConfig>(() => loadConfig());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [modalRole, setModalRole] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tests, setTests] = useState<Record<string, TestState>>({}); // per role + fallback
  const [keyTests, setKeyTests] = useState<Record<string, TestState>>({}); // per provider
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importTimer = useRef<number | null>(null);

  const showImport = (ok: boolean, text: string) => {
    setImportMsg({ ok, text });
    if (importTimer.current) window.clearTimeout(importTimer.current);
    importTimer.current = window.setTimeout(() => setImportMsg(null), 5000);
  };

  useEffect(() => {
    return () => {
      if (importTimer.current) window.clearTimeout(importTimer.current);
    };
  }, []);

  // Auto-save ke localStorage
  useEffect(() => {
    saveConfig(cfg);
    setSavedAt(
      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  }, [cfg]);

  // ---------- update helpers ----------
  const updateRole = (roleId: string, patch: Partial<RoleConfig>) =>
    setCfg((c) => ({
      ...c,
      roles: { ...c.roles, [roleId]: { ...c.roles[roleId], ...patch } },
    }));

  const setKey = (providerId: string, key: string) =>
    setCfg((c) => ({ ...c, keys: { ...c.keys, [providerId]: key } }));

  const setBase = (providerId: string, base: string) =>
    setCfg((c) => ({ ...c, bases: { ...c.bases, [providerId]: base } }));

  const applyToAllRoles = (providerId: string) =>
    setCfg((c) => {
      const roles = { ...c.roles };
      for (const r of ROLES) roles[r.id] = { ...roles[r.id], provider: providerId };
      return { ...c, roles };
    });

  // ---------- statistik ----------
  const providerCount = useMemo(
    () => new Set(Object.values(cfg.roles).map((c) => c.provider)).size,
    [cfg]
  );
  const readyCount = useMemo(
    () =>
      ROLES.filter((r) => {
        const rc = cfg.roles[r.id];
        return rc && rc.model?.trim() && Boolean(cfg.keys[rc.provider]?.trim());
      }).length,
    [cfg]
  );
  const keyCount = useMemo(() => Object.values(cfg.keys).filter((k) => k?.trim()).length, [cfg]);

  // ---------- test koneksi ----------
  const runTest = async (
    id: string,
    opts: { provider: string; model: string }
  ) => {
    const { provider, model } = opts;
    const prov = getProvider(provider);
    const key = cfg.keys[provider] ?? "";

    if (!key.trim()) {
      setTests((t) => ({ ...t, [id]: { state: "fail", label: `Key ${prov.name} kosong` } }));
      return;
    }
    if (!model.trim()) {
      setTests((t) => ({ ...t, [id]: { state: "fail", label: "Pilih model dulu" } }));
      return;
    }
    setTests((t) => ({ ...t, [id]: { state: "testing", label: "Menguji…" } }));
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { provider, model, key, base: cfg.bases[provider] || undefined },
        }),
      });
      const data = await res.json();
      setTests((t) => ({
        ...t,
        [id]: data.ok
          ? { state: "ok", label: `OK · ${data.latencyMs}ms` }
          : { state: "fail", label: data.error || "Gagal" },
      }));
    } catch {
      setTests((t) => ({ ...t, [id]: { state: "fail", label: "Gagal terhubung" } }));
    }
  };

  const runRoleTest = (roleId: string) => {
    const rc = cfg.roles[roleId];
    runTest(roleId, { provider: rc.provider, model: rc.model });
  };

  const runFallbackTest = (roleId: string) => {
    const rc = cfg.roles[roleId];
    runTest(`${roleId}::fb`, { provider: rc.fallbackProvider, model: rc.fallbackModel });
  };

  const runKeyTest = (providerId: string) => {
    const prov = getProvider(providerId);
    const firstRole = ROLES.find((r) => cfg.roles[r.id]?.provider === providerId);
    const model = prov.testModel || (firstRole ? cfg.roles[firstRole.id].model : "") || "";
    const key = cfg.keys[providerId] ?? "";
    if (!key.trim()) {
      setKeyTests((t) => ({ ...t, [providerId]: { state: "fail", label: `Key kosong` } }));
      return;
    }
    setKeyTests((t) => ({ ...t, [providerId]: { state: "testing", label: "Menguji…" } }));
    (async () => {
      try {
        const res = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: { provider: providerId, model, key, base: cfg.bases[providerId] || undefined },
          }),
        });
        const data = await res.json();
        setKeyTests((t) => ({
          ...t,
          [providerId]: data.ok
            ? { state: "ok", label: `OK · ${data.latencyMs}ms` }
            : { state: "fail", label: data.error || "Gagal" },
        }));
      } catch {
        setKeyTests((t) => ({ ...t, [providerId]: { state: "fail", label: "Gagal" } }));
      }
    })();
  };

  // ---------- import / ekspor ----------
  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ngodingdiai-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        const { cfg: next, count } = parseImported(data, cfg);
        if (count === 0) throw new Error("tidak ada role yang cocok di file");
        setCfg(next);
        setTests({});
        setKeyTests({});
        showImport(true, `Import berhasil — ${count} role dimuat.`);
      } catch (err) {
        showImport(false, "File tidak valid: " + (err instanceof Error ? err.message : "parse error"));
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (!window.confirm("Reset semua pengaturan provider, model & API key ke default?")) return;
    clearConfig();
    setCfg(defaultConfig());
    setTests({});
    setKeyTests({});
  };

  // Modal pencarian model: roleId (utama) atau roleId::fb (fallback)
  const modalRoleId = modalRole ? modalRole.replace(/::fb$/, "") : null;
  const modalIsFallback = modalRole ? modalRole.endsWith("::fb") : false;
  const modalProvider = modalRoleId
    ? modalIsFallback
      ? cfg.roles[modalRoleId]?.fallbackProvider
      : cfg.roles[modalRoleId]?.provider
    : "openrouter";
  const modalCurrentModel = modalRoleId
    ? modalIsFallback
      ? cfg.roles[modalRoleId]?.fallbackModel
      : cfg.roles[modalRoleId]?.model
    : "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-400">
            <Icon name="sliders" size={13} />
            BYOK — Atur Provider AI
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            API Key sekali, Role fleksibel
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Isi <b className="text-zinc-700 dark:text-zinc-200">1 API key per provider</b> di bagian bawah —
            otomatis dipakai semua role yang memilih provider itu. Tiap role bisa{" "}
            <b className="text-zinc-700 dark:text-zinc-200">berbeda provider &amp; model</b>, plus{" "}
            <b className="text-zinc-700 dark:text-zinc-200">fallback model</b> sendiri.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-400 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <Icon name="upload" size={13} /> Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
          <button
            onClick={exportConfig}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-400 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <Icon name="download" size={13} /> Ekspor JSON
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-95 dark:border-red-500/30 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Icon name="refresh" size={13} /> Reset
          </button>
        </div>
      </div>

      {/* ===== Info BYOK + statistik ===== */}
      <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon name="shield" size={19} />
        </span>
        <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <b className="text-zinc-900 dark:text-white">API key cukup diisi sekali per provider.</b> Key hanya
          tersimpan di browser (localStorage) dan dikirim langsung ke provider AI — tidak pernah ke server.
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-zinc-100 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {keyCount} key · {providerCount} provider
          </span>
          <span
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${
              readyCount === ROLES.length
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {readyCount}/8 role siap
          </span>
        </div>
      </div>

      {savedAt && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <Icon name="check" size={12} className="text-emerald-500" />
          Tersimpan otomatis di browser · {savedAt}
        </p>
      )}
      {importMsg && (
        <p
          className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${
            importMsg.ok ? "text-emerald-500" : "text-red-500"
          }`}
        >
          <Icon name={importMsg.ok ? "check" : "alert"} size={12} />
          {importMsg.text}
        </p>
      )}

      {/* ===== SECTION: PROVIDER API KEYS ===== */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Icon name="key" size={17} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Provider API Keys</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Isi sekali per provider — otomatis dipakai semua role yang memilih provider ini.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((p) => {
            const key = cfg.keys[p.id] ?? "";
            const kt = keyTests[p.id];
            return (
              <div
                key={p.id}
                className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-4 transition-shadow duration-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      key.trim()
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Icon name={key.trim() ? "check" : "key"} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="min-w-0 flex-1 truncate text-[13px] font-bold text-zinc-900 dark:text-white">{p.name}</h3>
                      {p.id === "custom" && (
                        <span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400">
                          custom
                        </span>
                      )}
                    </div>
                  </div>
                  {p.docs && (
                    <a
                      href={p.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-[9px] font-semibold text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
                    >
                      <span className="flex items-center gap-1">
                        <Icon name="link" size={9} /> Key
                      </span>
                    </a>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type={showKeys[p.id] ? "text" : "password"}
                      value={key}
                      onChange={(e) => setKey(p.id, e.target.value)}
                      placeholder={p.placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-3 pr-9 font-mono text-[11px] outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                    />
                    <button
                      onClick={() => setShowKeys((s) => ({ ...s, [p.id]: !s[p.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      aria-label="Tampilkan/sembunyikan key"
                    >
                      <Icon name={showKeys[p.id] ? "eyeOff" : "eye"} size={13} />
                    </button>
                  </div>
                  {p.needsBase && (
                    <input
                      type="text"
                      value={cfg.bases[p.id] ?? ""}
                      onChange={(e) => setBase(p.id, e.target.value)}
                      placeholder="Base URL"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-9 w-2/5 min-w-0 flex-none rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 font-mono text-[11px] outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                    />
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                  <span
                    title={p.hint}
                    className="min-w-0 flex-1 truncate text-[10px] text-zinc-400 dark:text-zinc-500"
                  >
                    {p.hint}
                  </span>
                  <button
                    onClick={() => runKeyTest(p.id)}
                    disabled={kt?.state === "testing"}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold text-zinc-600 transition-all hover:border-zinc-400 active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    {kt?.state === "testing" ? (
                      <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : kt?.state === "ok" ? (
                      <Icon name="check" size={10} />
                    ) : kt?.state === "fail" ? (
                      <Icon name="alert" size={10} />
                    ) : (
                      <Icon name="bolt" size={10} />
                    )}
                    {kt?.state === "ok" || kt?.state === "fail" ? kt.label : "Test"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== SECTION: KONFIGURASI PER ROLE ===== */}
      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Icon name="cpu" size={17} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Konfigurasi per Role</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Provider, model &amp; fallback untuk tiap role — tanpa isi API key lagi.
            </p>
          </div>
        </div>

        {/* Set semua role ke satu provider */}
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-3xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Set semua role →</span>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyToAllRoles(p.id)}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Role cards — grid 2 kolom rapi */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ROLES.map((r, idx) => {
            const rc = cfg.roles[r.id];
            const prov = getProvider(rc.provider);
            const hasKey = Boolean(cfg.keys[rc.provider]?.trim());
            const fbProv = getProvider(rc.fallbackProvider);
            const fbHasKey = Boolean(cfg.keys[rc.fallbackProvider]?.trim());
            const fbOn = rc.fallbackEnabled && rc.fallbackModel?.trim();
            const test = tests[r.id];
            const fbTest = tests[`${r.id}::fb`];
            return (
              <div
                key={r.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-shadow duration-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* header */}
                <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    <Icon name={r.icon as IconName} size={15} />
                    <span
                      className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                        rc.model?.trim() && hasKey ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">{r.name}</h3>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{
                          background: `${CHAIN_META[r.chain].color}1a`,
                          color: CHAIN_META[r.chain].color,
                        }}
                      >
                        {r.chainLabel}
                      </span>
                      {r.output && (
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {r.output}
                        </code>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{r.blurb}</p>
                  </div>
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
                    #{idx + 1}
                  </span>
                </div>

                {/* body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {/* Provider + Model */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={rc.provider}
                        onChange={(e) => updateRole(r.id, { provider: e.target.value })}
                        className="h-9 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 pl-3 pr-7 text-xs font-medium outline-none transition-all focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                        title="Provider AI"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <Icon
                        name="chevronDown"
                        size={12}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                    </div>
                    <button
                      onClick={() => setModalRole(r.id)}
                      className="flex h-9 min-w-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-left transition-all hover:border-zinc-300 hover:bg-white active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      title="Pilih model utama"
                    >
                      <Icon name="search" size={12} className="shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] font-medium text-zinc-800 dark:text-zinc-100">
                        {rc.model || "Pilih model…"}
                      </span>
                      {(() => {
                        const h = modelHint(rc.provider, rc.model);
                        return h ? (
                          <span
                            className={`shrink-0 rounded-full px-1 py-0.5 text-[8px] font-bold ${
                              h.tone === "fast"
                                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                : h.tone === "heavy"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-zinc-500/10 text-zinc-500"
                            }`}
                          >
                            {h.label}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  </div>

                  {/* Status bar: key + temp + test */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        hasKey
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <Icon name={hasKey ? "check" : "alert"} size={10} />
                      {prov.name} key {hasKey ? "✓" : "✗"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                      Temp
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={rc.temperature}
                        onChange={(e) => updateRole(r.id, { temperature: Number(e.target.value) })}
                        className="w-16 accent-zinc-900 dark:accent-white"
                      />
                      <span className="w-6 rounded bg-zinc-100 px-0.5 text-center font-mono text-[9px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {rc.temperature.toFixed(1)}
                      </span>
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <TestBadge state={test} />
                      <TestButton state={test} onClick={() => runRoleTest(r.id)} idleLabel="Test" />
                    </div>
                  </div>

                  {/* Fallback */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        <Icon name="refresh" size={11} />
                        Fallback
                        {fbOn && (
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                            aktif
                          </span>
                        )}
                      </span>
                      <Switch
                        on={rc.fallbackEnabled}
                        onToggle={() => updateRole(r.id, { fallbackEnabled: !rc.fallbackEnabled })}
                      />
                    </div>
                    {rc.fallbackEnabled && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="relative">
                          <select
                            value={rc.fallbackProvider}
                            onChange={(e) => updateRole(r.id, { fallbackProvider: e.target.value })}
                            className="h-8 w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-2.5 pr-6 text-[10.5px] font-medium outline-none transition-all focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                          >
                            {PROVIDERS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <Icon
                            name="chevronDown"
                            size={11}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
                          />
                        </div>
                        <button
                          onClick={() => setModalRole(`${r.id}::fb`)}
                          className="flex h-8 min-w-0 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-left transition-all hover:border-zinc-300 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-900"
                          title="Pilih model fallback"
                        >
                          <Icon name="search" size={11} className="shrink-0 text-zinc-400" />
                          <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] font-medium text-zinc-700 dark:text-zinc-200">
                            {rc.fallbackModel || "Model cadangan…"}
                          </span>
                        </button>
                        <div className="col-span-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`flex items-center gap-1 text-[9.5px] font-semibold ${
                              fbHasKey
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          >
                            <Icon name={fbHasKey ? "check" : "alert"} size={9} />
                            key {fbProv.name} {fbHasKey ? "✓" : "✗"}
                          </span>
                          <TestBadge state={fbTest} />
                          <button
                            onClick={() => runFallbackTest(r.id)}
                            disabled={fbTest?.state === "testing"}
                            className="ml-auto flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold text-zinc-600 transition-all hover:border-zinc-400 active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
                          >
                            {fbTest?.state === "testing" ? (
                              <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : fbTest?.state === "ok" ? (
                              <Icon name="check" size={10} />
                            ) : fbTest?.state === "fail" ? (
                              <Icon name="alert" size={10} />
                            ) : (
                              <Icon name="bolt" size={10} />
                            )}
                            Test Fallback
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Note model DB */}
      <p className="mt-8 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        Database model AI: JSON lokal · urutan pencarian terbaru → terlama · jika tidak ditemukan, pakai custom
        model · provider "Custom" = endpoint OpenAI-compatible dengan Base URL sendiri.
      </p>

      {/* Modal search model (utama & fallback) */}
      {modalRole && modalRoleId && (
        <ModelSearchModal
          open
          providerId={modalProvider}
          currentModel={modalCurrentModel}
          onClose={() => setModalRole(null)}
          onSelect={(model) => {
            if (modalIsFallback) {
              updateRole(modalRoleId, { fallbackModel: model });
            } else {
              updateRole(modalRoleId, { model });
            }
            setModalRole(null);
          }}
        />
      )}

      {!hasAnyKey(cfg) && (
        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
          <Icon name="info" size={17} className="mt-0.5 shrink-0" />
          <div>
            <b>Belum ada API key.</b> Generator akan berjalan dalam <b>mode demo</b> (contoh dokumen) sampai
            kamu mengisi minimal satu key di bagian <b>Provider API Keys</b>.
          </div>
        </div>
      )}
    </main>
  );
}
