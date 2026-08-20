"use client";

import { useMemo, useState } from "react";
import { OUTPUT_FILES } from "@/lib/roles";
import Icon, { IconName } from "./Icon";
import Markdown from "./Markdown";

interface OutputTabsProps {
  outputs: Record<string, string>;
}

const FILE_ICON: Record<string, IconName> = {
  "prompt.md": "pen",
  "prd.md": "clipboard",
  "design.md": "palette",
  "map.md": "map",
  "review.md": "shield",
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OutputTabs({ outputs }: OutputTabsProps) {
  const files = useMemo(() => OUTPUT_FILES.filter((f) => outputs[f]?.trim()), [outputs]);
  const [active, setActive] = useState(files[0] ?? null);
  const [raw, setRaw] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (files.length === 0) return null;

  const current = active && outputs[active] ? active : files[0];
  const content = outputs[current] ?? "";
  const chars = content.length;

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* noop */
    }
  };

  const copyAll = async () => {
    const all = files.map((f) => `<!-- ==== ${f} ==== -->\n\n${outputs[f]}`).join("\n\n");
    await copy(all, "all");
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
        {files.map((f) => (
          <button
            key={f}
            onClick={() => {
              setActive(f);
              setRaw(false);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-medium transition-all duration-200 ${
              current === f
                ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon name={FILE_ICON[f] ?? "fileText"} size={13} />
            {f}
            <span
              className={`rounded-full px-1.5 text-[10px] ${
                current === f ? "bg-white/20 dark:bg-zinc-900/20" : "bg-zinc-200/80 dark:bg-zinc-800"
              }`}
            >
              {outputs[f].split(/\s+/).filter(Boolean).length}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setRaw((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              raw
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {raw ? "Preview" : "Raw"}
          </button>
          <button
            onClick={copyAll}
            className="hidden items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-zinc-700 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:flex"
          >
            <Icon name={copied === "all" ? "check" : "copy"} size={13} />
            {copied === "all" ? "Tersalin" : "Salin semua"}
          </button>
        </div>
      </div>

      {/* Konten */}
      <div className="relative">
        <div className="max-h-[600px] overflow-y-auto p-5 text-zinc-800 dark:text-zinc-200 sm:p-7">
          {raw ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              {content}
            </pre>
          ) : (
            <Markdown text={content} />
          )}
        </div>

        {/* Aksi mengambang */}
        <div className="pointer-events-none sticky bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-white via-white/90 to-transparent px-5 pb-3 pt-8 dark:from-zinc-900 dark:via-zinc-900/90 sm:px-7">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            {chars.toLocaleString("id-ID")} karakter
          </span>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => copy(content, "file")}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600"
            >
              <Icon name={copied === "file" ? "check" : "copy"} size={13} />
              {copied === "file" ? "Tersalin" : "Salin"}
            </button>
            <button
              onClick={() => downloadText(current, content)}
              className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-700 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Icon name="download" size={13} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
