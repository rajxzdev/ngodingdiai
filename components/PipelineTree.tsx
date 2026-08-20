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

const W = 1500;
const H = 640;

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

/** Layout bersih 2 baris: baris 1 = Web→Prompt→PRD→UX→UI, baris 2 = DS→DE→Map→QA */
const BOX_W = 205;
const BOX_H = 56;
const COL1 = 145; // x kolom 1..5 (baris 1)
const COL2 = 385;
const COL3 = 625;
const COL4 = 865;
const COL5 = 1105;
const ROW1_Y = 265; // baris 1
const ROW2_Y = 480; // baris 2
const OUT_DY = 86; // chip output di bawah kotak

const ROLE_POS: Record<string, Pt> = {
  "web-analyst": { x: COL1, y: ROW1_Y },
  "prompt-engineer": { x: COL2, y: ROW1_Y },
  "prd-analyst": { x: COL3, y: ROW1_Y },
  "ux-researcher": { x: COL4, y: ROW1_Y },
  "ui-designer": { x: COL5, y: ROW1_Y },
  "design-system": { x: COL1, y: ROW2_Y },
  "design-engineer": { x: COL2, y: ROW2_Y },
  "map-engineer": { x: COL3, y: ROW2_Y },
  "quality-reviewer": { x: COL4, y: ROW2_Y },
};

function buildNodes(): TreeNode[] {
  const nodes: TreeNode[] = [
    // Project Brief — TENGAH ATAS
    { id: "root", x: W / 2, y: 90, label: "Project Brief", kind: "root" },
  ];
  for (const r of ROLES) {
    const p = ROLE_POS[r.id] ?? { x: COL1, y: ROW1_Y };
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

/** Panah lurus horizontal / vertikal / satu lengkung lembut (UI → Design System) */
function edgePath(a: Pt, b: Pt): string {
  const ax = a.x + BOX_W / 2;
  const bx = b.x + BOX_W / 2;
  const ay = a.y + BOX_H / 2;
  const by = b.y + BOX_H / 2;
  // sama baris → garis lurus horizontal
  if (Math.abs(ay - by) < 4) return `M ${ax} ${ay} L ${bx} ${by}`;
  // sama kolom → garis lurus vertikal
  if (Math.abs(ax - bx) < 4) return `M ${ax} ${ay} L ${bx} ${by}`;
  // turun + belok (UI → Design System): satu lengkung lembut
  return `M ${ax} ${ay} C ${ax} ${(ay + by) / 2}, ${bx} ${(ay + by) / 2}, ${bx} ${by}`;
}

const EDGES: { from: string; to: string }[] = [
  // root → baris 1
  { from: "root", to: "web-analyst" },
  // baris 1 kiri→kanan
  { from: "web-analyst", to: "prompt-engineer" },
  { from: "prompt-engineer", to: "prd-analyst" },
  { from: "prd-analyst", to: "ux-researcher" },
  { from: "ux-researcher", to: "ui-designer" },
  // turun ke baris 2
  { from: "ui-designer", to: "design-system" },
  // baris 2 kiri→kanan
  { from: "design-system", to: "design-engineer" },
  { from: "design-engineer", to: "map-engineer" },
  { from: "map-engineer", to: "quality-reviewer" },
  // output chips
  { from: "web-analyst", to: "out:web-analyst" },
  { from: "prompt-engineer", to: "out:prompt-engineer" },
  { from: "prd-analyst", to: "out:prd-analyst" },
  { from: "design-engineer", to: "out:design-engineer" },
  { from: "map-engineer", to: "out:map-engineer" },
  { from: "quality-reviewer", to: "out:quality-reviewer" },
];

const EDGE_D = EDGES.map((e) => {
  const a = byId.get(e.from)!;
  const b = byId.get(e.to)!;
  return { ...e, d: edgePath(a, b), len: Math.hypot(b.x - a.x, b.y - a.y) };
});

function pct(p: number, total: number): string {
  return `${((p / total) * 100).toFixed(3)}%`;
}

/** Partikel melayang di dalam bagan (deterministik, ringan) */
const PARTICLES = [
  { left: "8%", bottom: "10%", size: 4, dur: "9s", delay: "0s", drift: "18px" },
  { left: "18%", bottom: "22%", size: 3, dur: "11s", delay: "1.2s", drift: "-14px" },
  { left: "30%", bottom: "8%", size: 5, dur: "8s", delay: "0.6s", drift: "22px" },
  { left: "44%", bottom: "30%", size: 3, dur: "12s", delay: "2s", drift: "-20px" },
  { left: "56%", bottom: "14%", size: 4, dur: "10s", delay: "0.3s", drift: "16px" },
  { left: "68%", bottom: "26%", size: 3, dur: "9.5s", delay: "1.6s", drift: "-12px" },
  { left: "78%", bottom: "9%", size: 5, dur: "11.5s", delay: "0.9s", drift: "20px" },
  { left: "88%", bottom: "20%", size: 3, dur: "8.5s", delay: "2.4s", drift: "-18px" },
  { left: "95%", bottom: "12%", size: 4, dur: "10.5s", delay: "1s", drift: "14px" },
  { left: "24%", bottom: "40%", size: 3, dur: "13s", delay: "3s", drift: "-16px" },
  { left: "64%", bottom: "42%", size: 3, dur: "12.5s", delay: "2.8s", drift: "12px" },
  { left: "82%", bottom: "36%", size: 4, dur: "9.8s", delay: "1.9s", drift: "-22px" },
];

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
          className="tree-c relative min-w-[1000px] w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0f] shadow-xl"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {/* glow lembut */}
          <div className="pointer-events-none absolute left-1/2 top-[-140px] h-[280px] w-[620px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[110px]" />
          <div className="pointer-events-none absolute bottom-[-80px] left-[10%] h-[200px] w-[320px] rounded-full bg-violet-500/5 blur-[100px]" />

          {/* partikel melayang (dot field ala reactbits) */}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="tree-particle"
              style={{
                left: p.left,
                bottom: p.bottom,
                width: p.size,
                height: p.size,
                animationDuration: p.dur,
                animationDelay: p.delay,
                ["--drift" as string]: p.drift,
              }}
            />
          ))}

          {/* SVG: background + edges + titik mengalir */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <radialGradient id="tree-bg3" cx="50%" cy="12%" r="85%">
                <stop offset="0%" stopColor="#14141a" />
                <stop offset="100%" stopColor="#0c0c0f" />
              </radialGradient>
              <pattern id="tree-dots3" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1.4" cy="1.4" r="1.3" fill="rgba(255,255,255,0.045)" />
              </pattern>
              <linearGradient id="edge-base3" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3a4150" />
                <stop offset="100%" stopColor="#1e2129" />
              </linearGradient>
            </defs>
            <rect width={W} height={H} fill="url(#tree-bg3)" />
            <rect width={W} height={H} fill="url(#tree-dots3)" />

            {/* Edges — garis lurus, rapi */}
            {EDGE_D.map((e, i) => {
              const s = stOf(e.to);
              const active = s === "running";
              const lit = s === "done";
              const err = s === "error";
              const stroke = err ? "#f87171" : active ? "#ffffff" : lit ? "#8b8f9a" : "url(#edge-base3)";
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
                    <circle r={2.6} fill="#ffffff" opacity={0.95}>
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

          {/* Overlay HTML: node */}
          {NODES.map((n) => {
            const s = stOf(n.id);

            // OUTPUT — chip file kecil di bawah kotak
            if (n.kind === "output") {
              const done = s === "done";
              const running = s === "running";
              const c = n.chain ? CHAIN_META[n.chain].color : "#fff";
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(n.x + BOX_W / 2, W), top: pct(n.y, H) }}
                >
                  <div
                    className={`tree-out-chip flex items-center gap-1.5 rounded-lg border font-mono font-medium transition-all duration-300 ${
                      done
                        ? "border-white bg-white text-zinc-900 shadow-lg shadow-white/10"
                        : running
                          ? "border-white/60 bg-white/10 text-white"
                          : "border-dashed border-white/25 bg-white/[0.04] text-zinc-500"
                    }`}
                    style={running ? { boxShadow: `0 0 16px ${c}55` } : undefined}
                  >
                    {done ? (
                      <Icon name="check" size={10} strokeWidth={2.6} />
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

            // ROOT — kotak kecil "Project Brief" (tengah atas)
            if (n.kind === "root") {
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(n.x, W), top: pct(n.y, H) }}
                >
                  <div className="tree-root-box relative flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                    <Icon name="sparkles" size={14} className="text-white/90" />
                    <span className="tree-box-name whitespace-nowrap font-extrabold uppercase tracking-[0.1em] text-white">
                      {n.label}
                    </span>
                    <span className="breathe absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>
              );
            }

            // ROLE — kotak
            const running = s === "running";
            const done = s === "done";
            const err = s === "error";
            const chainColor = n.chain ? CHAIN_META[n.chain].color : "#fff";
            const active = running || done;

            return (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pct(n.x + BOX_W / 2, W), top: pct(n.y + BOX_H / 2, H) }}
              >
                {running && (
                  <>
                    <span className="tree-ring absolute left-1/2 top-1/2 rounded-full border border-white/60 [animation:ringPulseCenter_1.4s_ease-out_infinite]" />
                    <span className="tree-ring absolute left-1/2 top-1/2 rounded-full border border-white/25 [animation:ringPulseCenter_1.4s_ease-out_infinite_0.4s]" />
                  </>
                )}
                <div
                  className={`tree-box relative flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-300 ${
                    err
                      ? "border-red-400/70 bg-red-500/10"
                      : running
                        ? "border-white/80 bg-[#17171d] shadow-[0_0_24px_rgba(255,255,255,0.15)]"
                        : done
                          ? "border-white/55 bg-[#18181f]"
                          : "border-white/15 bg-[#121216]"
                  }`}
                >
                  <span
                    className="tree-box-icon flex shrink-0 items-center justify-center rounded-[9px]"
                    style={{ background: `${chainColor}1c`, color: chainColor, boxShadow: active ? `0 0 12px ${chainColor}33` : "none" }}
                  >
                    <Icon name={n.icon ?? "cpu"} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`tree-box-name truncate font-bold leading-tight ${active ? "text-white" : "text-zinc-300"}`}>
                      {n.label}
                    </div>
                    <div className="tree-box-sub truncate font-medium" style={{ color: chainColor, opacity: active ? 1 : 0.65 }}>
                      {n.chain ? CHAIN_META[n.chain].label : ""}
                    </div>
                  </div>
                  {done ? (
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-900 tree-status">
                      <Icon name="check" size={10} strokeWidth={3} />
                    </span>
                  ) : running ? (
                    <span className="tree-status shrink-0 animate-pulse rounded-full bg-white" />
                  ) : err ? (
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-red-400 text-zinc-900 tree-status">
                      <Icon name="x" size={10} strokeWidth={3} />
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
      </div>
    </div>
  );
}
