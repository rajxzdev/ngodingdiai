"use client";

import { useEffect, useRef, useState } from "react";
import { PIPELINE_ORDER, ROLES, CHAIN_META } from "@/lib/roles";
import Icon from "./Icon";

export type StepStatus = "idle" | "running" | "done" | "error";

interface PipelineTreeProps {
  status?: Record<string, StepStatus>;
  auto?: boolean; // mode demo: status berjalan sendiri (untuk landing page)
  className?: string;
}

const W = 1600;
const H = 700;

interface Pt {
  x: number;
  y: number;
}
interface TreeNode extends Pt {
  id: string;
  label: string;
  kind: "root" | "role" | "output";
  roleId?: string;
  file?: string;
}

/** Posisi kolom: 5 kolom merata, memenuhi lebar canvas (tanpa ruang kosong di kanan) */
const ROLE_POS: Record<string, Pt> = {
  "prompt-engineer": { x: 200, y: 190 },
  "prd-analyst": { x: 490, y: 190 },
  "ux-researcher": { x: 800, y: 120 },
  "ui-designer": { x: 800, y: 250 },
  "design-system": { x: 800, y: 380 },
  "design-engineer": { x: 800, y: 510 },
  "map-engineer": { x: 1110, y: 190 },
  "quality-reviewer": { x: 1400, y: 190 },
};
const OUT_DY = 130;

function buildNodes(): TreeNode[] {
  const nodes: TreeNode[] = [
    { id: "root", x: 800, y: 80, label: "Project Brief", kind: "root" },
  ];
  for (const r of ROLES) {
    const p = ROLE_POS[r.id] ?? { x: 800, y: 300 };
    nodes.push({
      id: r.id,
      x: p.x,
      y: p.y,
      label: r.short,
      kind: "role",
      roleId: r.id,
    });
    if (r.output) {
      nodes.push({
        id: `out:${r.id}`,
        x: p.x,
        y: p.y + OUT_DY,
        label: r.output,
        kind: "output",
        roleId: r.id,
        file: r.output,
      });
    }
  }
  return nodes;
}

const NODES = buildNodes();
const byId = new Map(NODES.map((n) => [n.id, n]));

const EDGES: { from: string; to: string }[] = [
  { from: "root", to: "prompt-engineer" },
  { from: "root", to: "prd-analyst" },
  { from: "root", to: "ux-researcher" },
  { from: "root", to: "map-engineer" },
  { from: "root", to: "quality-reviewer" },
  { from: "prompt-engineer", to: "out:prompt-engineer" },
  { from: "prd-analyst", to: "out:prd-analyst" },
  { from: "ux-researcher", to: "ui-designer" },
  { from: "ui-designer", to: "design-system" },
  { from: "design-system", to: "design-engineer" },
  { from: "design-engineer", to: "out:design-engineer" },
  { from: "map-engineer", to: "out:map-engineer" },
  { from: "quality-reviewer", to: "out:quality-reviewer" },
];

function edgePath(a: Pt, b: Pt): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `M ${a.x} ${a.y} C ${a.x + dx * 0.5} ${a.y + dy * 0.45}, ${b.x - dx * 0.5} ${
    b.y - dy * 0.45
  }, ${b.x} ${b.y}`;
}

const EDGE_D = EDGES.map((e) => {
  const a = byId.get(e.from)!;
  const b = byId.get(e.to)!;
  return { ...e, d: edgePath(a, b), len: Math.hypot(b.x - a.x, b.y - a.y) };
});

function pct(p: number, total: number): string {
  return `${((p / total) * 100).toFixed(3)}%`;
}

export default function PipelineTree({
  status: external,
  auto = false,
  className = "",
}: PipelineTreeProps) {
  const [demoStatus, setDemoStatus] = useState<Record<string, StepStatus>>({});
  const timers = useRef<number[]>([]);

  const status: Record<string, StepStatus> = auto ? demoStatus : external ?? {};

  // Demo: status berjalan sendiri secara berurutan & berulang
  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    const clear = () => timers.current.forEach((t) => window.clearTimeout(t));
    const run = () => {
      const next: Record<string, StepStatus> = {};
      PIPELINE_ORDER.forEach((id, i) => {
        const delay = i * 1250 + 400;
        timers.current.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setDemoStatus((s) => ({ ...s, [id]: "running" }));
          }, delay),
          window.setTimeout(() => {
            if (cancelled) return;
            setDemoStatus((s) => ({ ...s, [id]: "done" }));
          }, delay + 1000)
        );
      });
      timers.current.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setDemoStatus({});
          run();
        }, PIPELINE_ORDER.length * 1250 + 1400)
      );
    };
    run();
    return () => {
      cancelled = true;
      clear();
    };
  }, [auto]);

  const stOf = (id: string): StepStatus => {
    if (id === "root") return "done";
    const node = byId.get(id)!;
    if (node.kind === "output") return status[node.roleId!] ?? "idle";
    return status[id] ?? "idle";
  };

  return (
    <div className={`select-none ${className}`}>
      <div className="w-full max-w-full overflow-x-auto pb-2">
        <div
          className="tree-c relative min-w-[600px] w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#0a0a0c] shadow-xl"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {/* glow orbs */}
          <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[280px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[-80px] left-[8%] h-[200px] w-[300px] rounded-full bg-violet-500/5 blur-[90px]" />

          {/* SVG: kanvas, edge, titik mengalir */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <radialGradient id="tree-bg" cx="50%" cy="18%" r="80%">
                <stop offset="0%" stopColor="#141418" />
                <stop offset="100%" stopColor="#0a0a0c" />
              </radialGradient>
              <pattern id="tree-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1.4" cy="1.4" r="1.3" fill="rgba(255,255,255,0.05)" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#tree-bg)" />
            <rect width={W} height={H} fill="url(#tree-dots)" />

            {EDGE_D.map((e, i) => {
              const s = stOf(e.to);
              const active = s === "running";
              const lit = s === "done";
              const err = s === "error";
              const stroke = err ? "#f87171" : active ? "#ffffff" : lit ? "#71717a" : "#2a2a30";
              return (
                <g key={i}>
                  <path d={e.d} fill="none" stroke="#202026" strokeWidth={1.6} />
                  <path
                    d={e.d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={active ? 2 : 1.5}
                    className={active ? "flow-dash-active" : "flow-dash"}
                    style={lit || err ? { animation: "none", strokeDasharray: "none" } : undefined}
                    opacity={lit || err ? 0.55 : 1}
                  />
                  {!lit && !err && (
                    <circle r={2.4} fill="#ffffff" opacity={0.9}>
                      <animateMotion
                        dur={`${(e.len / 260).toFixed(2)}s`}
                        path={e.d}
                        begin={`${(i * 0.4).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Overlay HTML: node dot + label + chip output */}
          {NODES.map((n) => {
            const s = stOf(n.id);

            if (n.kind === "output") {
              const done = s === "done";
              const running = s === "running";
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(n.x, W), top: pct(n.y, H) }}
                >
                  <div
                    className={`tree-chip flex items-center gap-1.5 rounded-full border font-mono font-medium transition-all duration-300 ${
                      done
                        ? "border-white bg-white text-zinc-900 shadow-lg shadow-white/10"
                        : running
                          ? "border-white/50 bg-white/10 text-white"
                          : "border-dashed border-white/20 bg-white/[0.03] text-zinc-500"
                    }`}
                  >
                    {done ? (
                      <Icon name="check" size={13} strokeWidth={2.4} />
                    ) : running ? (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    ) : (
                      <Icon name="fileText" size={12} />
                    )}
                    {n.file}
                  </div>
                </div>
              );
            }

            const isRoot = n.kind === "root";
            const running = s === "running";
            const done = s === "done";
            const err = s === "error";

            if (isRoot) {
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(n.x, W), top: pct(n.y, H) }}
                >
                  <div className="tree-label-above absolute left-1/2 w-max -translate-x-1/2 text-zinc-300">
                    <span className="tree-label-root block whitespace-nowrap font-semibold uppercase tracking-[0.14em]">
                      {n.label}
                    </span>
                  </div>
                  <span className="tree-dot-lg breathe relative block rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.55)]" />
                </div>
              );
            }

            return (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pct(n.x, W), top: pct(n.y, H) }}
              >
                {/* ring pulse saat running */}
                {running && (
                  <>
                    <span className="tree-ring absolute left-1/2 top-1/2 rounded-full border border-white/60 [animation:ringPulseCenter_1.4s_ease-out_infinite]" />
                    <span className="tree-ring absolute left-1/2 top-1/2 rounded-full border border-white/30 [animation:ringPulseCenter_1.4s_ease-out_infinite_0.4s]" />
                  </>
                )}
                {done && (
                  <span className="tree-ring-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
                )}
                {err && (
                  <span className="tree-ring-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400/50" />
                )}
                <span
                  className={`relative block rounded-full transition-all duration-300 ${
                    err
                      ? "tree-dot-active tree-shadow-red bg-red-400"
                      : running
                        ? "tree-dot-active tree-shadow-glow bg-white"
                        : done
                          ? "tree-dot tree-shadow-soft bg-white"
                          : "tree-dot bg-white/45"
                  }`}
                />
                {/* label */}
                <div className="tree-label-below tree-label-wrap absolute left-1/2 -translate-x-1/2 text-center">
                  <span
                    title={ROLES.find((r) => r.id === n.roleId)?.name}
                    className={`tree-label block leading-tight tracking-tight ${
                      running || done ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    {n.label}
                  </span>
                  {n.roleId && (
                    <span
                      className="mx-auto mt-1 block h-[3px] w-6 rounded-full"
                      style={{
                        background: CHAIN_META[ROLES.find((r) => r.id === n.roleId)!.chain].color,
                        opacity: running || done ? 0.9 : 0.35,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-2 sm:hidden">
          <Icon name="chevronRight" size={12} />
          Geser untuk lihat seluruh pipeline
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/45" /> Idle
        </span>
        <span className="flex items-center gap-2">
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white [animation:ringPulse_1.4s_ease-out_infinite]" />
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          Sedang diproses
        </span>
        <span className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white">
            <span className="text-[8px] font-bold text-zinc-900">✓</span>
          </span>
          Selesai
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full border border-dashed border-white/30 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            output.md
          </span>
          Dokumen output
        </span>
      </div>
    </div>
  );
}
