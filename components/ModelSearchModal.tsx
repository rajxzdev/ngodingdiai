"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelInfo } from "@/lib/models-db";
import { badgeLabel } from "@/lib/models-db";
import { getProvider } from "@/lib/providers";
import Icon from "./Icon";

interface ModelSearchModalProps {
  open: boolean;
  providerId: string;
  currentModel?: string;
  onClose: () => void;
  onSelect: (modelId: string) => void;
}

function Badge({ b }: { b: ModelInfo["badge"] }) {
  if (!b) return null;
  const label = badgeLabel(b);
  const styles: Record<NonNullable<ModelInfo["badge"]>, string> = {
    new: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    fast: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    free: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    recommended: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${styles[b]}`}>
      {label}
    </span>
  );
}

export default function ModelSearchModal({
  open,
  providerId,
  currentModel,
  onClose,
  onSelect,
}: ModelSearchModalProps) {
  const [q, setQ] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchModels = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/models?provider=${encodeURIComponent(providerId)}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setModels(data.models ?? []);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCustom("");
    fetchModels("");
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fetchModels, onClose]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchModels(q), 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, open, fetchModels]);

  if (!open) return null;

  const prov = getProvider(providerId);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Icon name="search" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Cari Model — {prov.name}
            </h3>
            <p className="min-w-0 flex-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
              Terurut dari model terbaru → terlama · DB JSON lokal · pakai ⚡ Cepat untuk pipeline lebih cepat
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Tutup"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Icon name="search" size={16} />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Ketik model… mis. "gpt-4.0", "gemini flash", "claude sonnet"'
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-10 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500 dark:focus:bg-zinc-900"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                aria-label="Bersihkan"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Hasil */}
        <div className="min-h-[200px] flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-14 text-zinc-400">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
              <span className="text-xs">Mencari di database model…</span>
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <Icon name="search" size={22} />
              </span>
              <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Model tidak ditemukan di database
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Jangan khawatir — kamu tetap bisa pakai <b>custom model</b> di bawah.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {models.map((m) => {
                const active = m.id === currentModel;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => onSelect(m.id)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-150 ${
                        active
                          ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800"
                          : "border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        <Icon name="cpu" size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {m.name}
                          </span>
                          {m.badge && <Badge b={m.badge} />}
                        </span>
                        <span className="block min-w-0 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                          {m.id}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                          {m.released}
                        </span>
                        {m.note && (
                          <span className="hidden max-w-[140px] truncate text-[10px] text-zinc-400 sm:block dark:text-zinc-500">
                            {m.note}
                          </span>
                        )}
                      </span>
                      {active && <Icon name="check" size={16} className="shrink-0 text-zinc-900 dark:text-white" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Custom model fallback */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/60">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <Icon name="wand" size={13} />
            Model tidak ada di daftar? Pakai custom model
          </p>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={`ID model custom… (cth: ${prov.id === "openrouter" ? "vendor/nama-model" : "nama-model"})`}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 font-mono text-xs text-zinc-900 outline-none transition-all placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && custom.trim()) onSelect(custom.trim());
              }}
            />
            <button
              onClick={() => custom.trim() && onSelect(custom.trim())}
              disabled={!custom.trim()}
              className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-zinc-700 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Icon name="plus" size={13} />
              Pakai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
