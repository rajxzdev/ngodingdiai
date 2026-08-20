"use client";

import { useEffect, useRef, useState } from "react";
import { PIPELINE_ORDER, ROLES, CHAIN_META, type ChainId } from "@/lib/roles";
import Icon, { type IconName } from "./Icon";

export type StepStatus = "idle" | "running" | "done" | "error";

interface PipelineTreeProps {
  status?: Record<string, StepStatus>;
  auto?: boolean; // mode demo: status berjalan sendiri (untuk landing page)
  className?: string;
}

const W = 3400;
const H = 860;

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
  chain?: ChainId;
  icon?: IconName;
}

/** Posisi 6 kolom (9 role) — kotak LEBAR besar, jarak renggang */
const ROLE_POS: Record<string, Pt> = {
  "web-analyst": { x: 250, y: 300 },
  "prompt-engineer": { x: 870, y: 300 },
  "prd-analyst": { x: 1490, y: 300 },
  "ux-researcher": { x: 2110, y: 160 },
  "ui-designer": { x: 2110, y: 310 },
  "design-system": { x: 2110, y: 460 },
  "design-engineer": { x: 2110, y: 610 },
  "map-engineer": { x: 2730, y: 300 },
  "quality-reviewer": { x: 3350, y: 300 },
};
const OUT_DY = 158;

function buildNodes(): TreeNode[] {
  const nodes: TreeNode[] = [
    { id: "root", x: 1800, y: 110, label: "Project Brief", kind: "root" },
  ];
  for (const r of ROLES) {
    const p = ROLE_POS[r.id] ?? { x: 900, y: 300 };
    nodes.push({
      id: r.id,
      x: p.x,
      y: p.y,
      label: r.short,
      kind: "role",
      roleId: r.id,
      chain: r.chain,
      icon: r.icon as IconName,
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
        chain: r.chain,
      });
    }
  }
  return nodes;
}

const NODES = buildNodes();
const byId = new Map(NODES.map((n) => [n.id, n]));

const EDGES: { from: string; to: string }[] = [
  { from: "root", to: "web-analyst" },
  { from: "root", to: "prompt-engineer" },
  { from: "root", to: "prd-analyst" },
  { from: "root", to: "ux-researcher" },
  { from: "root", to: "map-engineer" },
  { from: "root", to: "quality-reviewer" },
  { from: "web-analyst", to: "prompt-engineer" },
  { from: "web-analyst", to: "out:web-analyst" },
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

const ZONES: { chain: ChainId; label: string; x: number; y: number; w: number; h: number }[] = [
  { chain: "web", label: "WEB REFERENCE", x: 150, y: 115, w: 200, h: 650 },
  { chain: "prompt", label: "PROMPT", x: 770, y: 115, w: 200, h: 650 },
  { chain: "prompt", label: "PRD", x: 1390, y: 115, w: 200, h: 650 },
  { chain: "design", label: "DESIGN CHAIN", x: 2010, y: 80, w: 200, h: 720 },
  { chain: "map", label: "MAP & ARCH", x: 2630, y: 115, w: 200, h: 650 },
  { chain: "review", label: "QA & REVIEW", x: 3250, y: 115, w: 200, h: 650 },
];

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
      PIPELINE_ORDER.forEach((id, i) => {
        const delay = i * 1100 + 400;
        timers.current.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setDemoStatus((s) => ({ ...s, [id]: "running" }));
          }, delay),
          window.setTimeout(() => {
            if (cancelled) return;
            setDemoStatus((s) => ({ ...s, [id]: "done" }));
          }, delay + 900)
        );
      });
      timers.current.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setDemoStatus({});
          run();
        }, PIPELINE_ORDER.length * 1100 + 1500)
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
          className="tree-c relative min-w-[1600px] w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#0a0a0c] shadow-xl"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {/* glow orbs */}
          <div className="pointer-events-none absolute left-1/2 top-[-140px] h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[110px]" />
          <div className="pointer-events-none absolute bottom-[-80px] left-[10%] h-[220px] w-[340px] rounded-full bg-violet-500/5 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[-60px] right-[8%] h-[200px] w-[300px] rounded-full bg-emerald-500/5 blur-[90px]" />

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <radialGradient id="tree-bg2" cx="50%" cy="14%" r="85%">
                <stop offset="0%" stopColor="#14141a" />
                <stop offset="100%" stopColor="#0a0a0c" />
              </radialGradient>
              <pattern id="tree-dots2" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1.4" cy="1.4" r="1.3" fill="rgba(255,255,255,0.05)" />
              </pattern>
              <linearGradient id="edge-base2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a4150" />
                <stop offset="100%" stopColor="#1e2129" />
              </linearGradient>
            </defs>
            <rect width={W} height={H} fill="url(#tree-bg2)" />
            <rect width={W} height={H} fill="url(#tree-dots2)" />

            {/* Zona chain */}
            {ZONES.map((z) => {
              const c = CHAIN_META[z.chain];
              return (
                <g key={z.chain}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={26} fill={c.color} opacity={0.05} />
                  <rect
                    x={z.x}
                    y={z.y}
                    width={z.w}
                    height={z.h}
                    rx={26}
                    fill="none"
                    stroke={c.color}
                    strokeOpacity={0.14}
                    strokeWidth={1}
                    strokeDasharray="3 7"
                  />
                  <text x={z.x + 14} y={z.y + 22} fill={c.color} opacity={0.7} fontSize={11} fontWeight={650} letterSpacing={1.5}>
                    {z.label}
                  </text>
                </g>
              );
            })}

            {/* Edges */}
            {EDGE_D.map((e, i) => {
              const s = stOf(e.to);
              const active = s === "running";
              const lit = s === "done";
              const err = s === "error";
              const stroke = err ? "#f87171" : active ? "#ffffff" : lit ? "#8b8f9a" : "url(#edge-base2)";
              return (
                <g key={i}>
                  <path d={e.d} fill="none" stroke="#191c22" strokeWidth={2.4} />
                  <path
                    d={e.d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={active ? 2 : 1.6}
                    className={active ? "flow-dash-active" : "flow-dash"}
                    style={lit || err ? { animation: "none", strokeDasharray: "none" } : undefined}
                    opacity={lit || err ? 0.65 : 1}
                  />
                  {!lit && !err && (
                    <circle r={2.8} fill="#ffffff" opacity={0.95}>
                      <animateMotion
                        dur={`${(e.len / 300).toFixed(2)}s`}
                        path={e.d}
                        begin={`${(i * 0.35).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Overlay HTML: kotak node */}
          {NODES.map((n) => {
            const s = stOf(n.id);

            // OUTPUT — chip file
            if (n.kind === "output") {
              const done = s === "done";
              const running = s === "running";
              const c = n.chain ? CHAIN_META[n.chain].color : "#fff";
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(n.x, W), top: pct(n.y, H) }}
                >
                  <div
                    className={`tree-out-chip flex items-center gap-1.5 rounded-lg border font-mono font-medium transition-all duration-300 ${
                      done
                        ? "border-white bg-white text-zinc-900 shadow-lg shadow-white/10"
                        : running
                          ? "border-white/60 bg-white/10 text-white"
                          : "border-dashed border-white/25 bg-white/[0.04] text-zinc-500"
                    }`}
                    style={running ? { boxShadow: `0 0 18px ${c}55` } : undefined}
                  >
                    {done ? (
                      <Icon name="check" size={11} strokeWidth={2.6} />
                    ) : running ? (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    ) : (
                      <Icon name="fileText" size={10} />
                    )}
                    {n.file}
                  </div>
                </div>
              );
            }

            // ROOT — kotak besar
            if (n.kind === "root") {
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(n.x, W), top: pct(n.y, H) }}
                >
                  <div className="tree-root-box relative rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm">
                    <div className="tree-box-name flex items-center justify-center gap-2 font-extrabold uppercase tracking-[0.14em] text-white">
                      <Icon name="sparkles" size={15} className="text-white/90" />
                      {n.label}
                    </div>
                    <div className="tree-box-sub mt-0.5 font-medium text-zinc-400">
                      brief · preferensi · URL referensi
                    </div>
                    <span className="breathe absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>
              );
            }

            // ROLE — kotak lebar
            const running = s === "running";
            const done = s === "done";
            const err = s === "error";
            const chainColor = n.chain ? CHAIN_META[n.chain].color : "#fff";
            const active = running || done;

            return (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pct(n.x, W), top: pct(n.y, H) }}
              >
                {running && (
                  <>
                    <span className="tree-ring absolute left-1/2 top-1/2 rounded-full border border-white/60 [animation:ringPulseCenter_1.4s_ease-out_infinite]" />
                    <span className="tree-ring absolute left-1/2 top-1/2 rounded-full border border-white/25 [animation:ringPulseCenter_1.4s_ease-out_infinite_0.4s]" />
                  </>
                )}
                <div
                  className={`tree-box relative flex items-center gap-2.5 rounded-2xl border px-2.5 py-2 backdrop-blur-sm transition-all duration-300 ${
                    err
                      ? "border-red-400/70 bg-red-500/10"
                      : running
                        ? "border-white/80 bg-[#17171d] shadow-[0_0_28px_rgba(255,255,255,0.15)]"
                        : done
                          ? "border-white/60 bg-[#18181f]"
                          : "border-white/15 bg-[#111116]"
                  }`}
                >
                  <span
                    className="tree-box-icon flex shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: `${chainColor}1f`, color: chainColor, boxShadow: active ? `0 0 14px ${chainColor}44` : "none" }}
                  >
                    <Icon name={n.icon ?? "cpu"} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`tree-box-name truncate font-bold leading-tight ${active ? "text-white" : "text-zinc-300"}`}>
                      {n.label}
                    </div>
                    <div className="tree-box-sub truncate font-medium" style={{ color: chainColor, opacity: active ? 1 : 0.7 }}>
                      {n.chain ? CHAIN_META[n.chain].label : ""}
                    </div>
                  </div>
                  {done ? (
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-900 tree-status">
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                  ) : running ? (
                    <span className="tree-status shrink-0 animate-pulse rounded-full bg-white" />
                  ) : err ? (
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-red-400 text-zinc-900 tree-status">
                      <Icon name="x" size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="tree-status shrink-0 rounded-full bg-white/25" />
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
          <span className="h-3 w-5 rounded-md border border-white/25 bg-white/10" /> Kotak role
        </span>
        <span className="flex items-center gap-2">
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white [animation:ringPulse_1.4s_ease-out_infinite]" />
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          Sedang diproses
        </span>
        <span className="flex items-center gap-2">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
            <span className="text-[9px] font-bold text-zinc-900">✓</span>
          </span>
          Selesai
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-md border border-dashed border-white/30 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            output.md
          </span>
          Dokumen output
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-md border border-dashed border-white/25 bg-white/5" />
          Zona alur
        </span>
      </div>
    </div>
  );
}
