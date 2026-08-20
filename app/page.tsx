"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import Icon from "@/components/Icon";
import PipelineTree from "@/components/PipelineTree";
import { ROLES, CHAIN_META } from "@/lib/roles";
import type { IconName } from "@/components/Icon";

const STATS = [
  { value: "9", label: "Role AI berurutan" },
  { value: "5", label: "Output .md siap pakai" },
  { value: "8+", label: "Provider didukung" },
  { value: "100%", label: "BYOK — key di tanganmu" },
];

const OUTPUTS: { file: string; icon: IconName; desc: string }[] = [
  { file: "web-analysis.md", icon: "globe", desc: "Analisis website referensi — desain & sistem yang bisa diadopsi produk baru." },
  { file: "prompt.md", icon: "pen", desc: "Master prompt produksi — peran, spesifikasi, kriteria kualitas, dan constraints." },
  { file: "prd.md", icon: "clipboard", desc: "Product Requirements Document — tujuan, persona, user stories, prioritas MoSCoW." },
  { file: "design.md", icon: "palette", desc: "Design specification — design tokens, komponen, halaman, animasi, dark mode." },
  { file: "map.md", icon: "map", desc: "Project map — struktur direktori, routes, komponen tree, API, dan data flow." },
  { file: "review.md", icon: "shield", desc: "Quality review — checklist, temuan, dan rekomendasi perbaikan prioritas." },
];

const STEPS = [
  {
    icon: "key" as IconName,
    title: "Atur Provider & Model per Role",
    desc: "Tiap role AI punya pengaturan sendiri: pilih provider (OpenRouter, OpenAI, Anthropic, Google, Groq, dll) dan model dengan search engine model terbaru → terlama. Tidak ketemu? Pakai custom model.",
  },
  {
    icon: "send" as IconName,
    title: "Masukkan Brief Produk",
    desc: "Tulis nama, jenis, dan deskripsi produk. Cukup 1 paragraf — pipeline yang mengerjakan sisanya.",
  },
  {
    icon: "download" as IconName,
    title: "Generate & Download",
    desc: "9 role berjalan berurutan dengan animasi pipeline live. Hasil akhir: web-analysis.md, prompt.md, prd.md, design.md, map.md, review.md — preview, copy, dan download.",
  },
];

const FEATURES = [
  { icon: "shield" as IconName, title: "Privasi BYOK", desc: "API key hanya tersimpan di browser (localStorage) dan dikirim langsung ke provider AI — tidak pernah ke server lain." },
  { icon: "search" as IconName, title: "Search Engine Model", desc: "Cari model per provider dari database JSON, otomatis terurut dari versi terbaru sampai terlama." },
  { icon: "wand" as IconName, title: "Custom Model", desc: "Model baru tidak ditemukan di daftar? Masukkan ID model custom secara manual — tetap bisa jalan." },
  { icon: "layout" as IconName, title: "Modern UI", desc: "Full-rounded, ikon SVG, scroll animation, light & dark mode. Tanpa warna alay." },
];

export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* ================= HERO ================= */}
      <section className="relative">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="glow-orb left-1/2 top-[-140px] h-[340px] w-[640px] -translate-x-1/2 bg-indigo-500/15 dark:bg-indigo-500/10" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              BYOK — Bring Your Own Key · 9 Role AI
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              <span className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-white dark:via-white dark:to-zinc-500">
                Ubah brief jadi PRD, Prompt & Design
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-indigo-400">
                dalam satu pipeline AI.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-500 sm:text-lg dark:text-zinc-400">
              Sembilan role AI berjalan berurutan — dari <b className="text-zinc-700 dark:text-zinc-200">Web &amp; Reference Analyst</b> yang
              menganalisis website referensimu, hingga <b className="text-zinc-700 dark:text-zinc-200">Design Engineering</b> — menghasilkan{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">web-analysis.md</code>,{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">prompt.md</code>,{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">design.md</code>, dan{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">map.md</code>.
              Pilih provider &amp; model untuk tiap role — key API milikmu.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/generator"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:shadow-white/10 dark:hover:bg-zinc-200 sm:w-auto"
              >
                <Icon name="sparkles" size={17} />
                Mulai Generate
                <Icon name="arrowRight" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/settings"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white/60 px-7 py-3.5 text-sm font-semibold text-zinc-700 backdrop-blur transition-all duration-200 hover:border-zinc-400 hover:bg-white active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 sm:w-auto"
              >
                <Icon name="sliders" size={16} />
                Atur Provider AI
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-3xl border border-zinc-200 bg-white/70 px-4 py-5 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= PIPELINE ================= */}
      <section className="relative py-14 sm:py-20">
        <div className="mx-auto w-full px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-400">
              <Icon name="gitBranch" size={13} />
              UI Pipeline
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Pipeline 9 Role AI, satu alur
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
              Setiap dokumen disusun berurutan — hasil role sebelumnya menjadi konteks role berikutnya.
              Titik putih menyala saat role bekerja, dan cahaya mengalir di sepanjang pipeline.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10">
            <PipelineTree auto />
          </Reveal>

          {/* role chips */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROLES.map((r, i) => (
              <Reveal key={r.id} delay={i * 60}>
                <div className="flex h-full items-start gap-3 rounded-3xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: `${CHAIN_META[r.chain].color}1a`, color: CHAIN_META[r.chain].color }}
                  >
                    <Icon name={r.icon as IconName} size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Role {i + 1}
                    </div>
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{r.name}</div>
                    {r.output && (
                      <code className="mt-1 inline-block rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        → {r.output}
                      </code>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= OUTPUT ================= */}
      <section className="relative py-14 sm:py-20">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-400">
              <Icon name="download" size={13} />
              Output yang Diharapkan
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Lima dokumen, satu brief
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
              Semua output berupa Markdown (.md / .txt) — bisa di-preview, disalin, dan diunduh langsung.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OUTPUTS.map((o, i) => (
              <Reveal key={o.file} delay={i * 70} className={i >= 3 ? "sm:col-span-2 lg:col-span-1" : ""}>
                <div className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-white dark:text-zinc-900">
                      <Icon name={o.icon} size={19} />
                    </span>
                    <code className="rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {o.file}
                    </code>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{o.desc}</p>
                </div>
              </Reveal>
            ))}

            {/* CTA card */}
            <Reveal delay={350}>
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-zinc-900 p-6 text-white dark:bg-white dark:text-zinc-900">
                <div className="glow-orb right-[-60px] top-[-60px] h-[180px] w-[180px] bg-indigo-500/30" />
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-900/10">
                    <Icon name="rocket" size={19} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold tracking-tight">Siap mengubah brief-mu?</h3>
                  <p className="mt-2 text-sm text-zinc-300 dark:text-zinc-500">
                    Tidak perlu API key untuk mencoba — mode demo tersedia.
                  </p>
                </div>
                <Link
                  href="/generator"
                  className="mt-6 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-200 active:scale-[0.98] dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-700"
                >
                  Buka Generator <Icon name="arrowUpRight" size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-400">
              <Icon name="compass" size={13} />
              Cara Pakai
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Tiga langkah sederhana</h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="relative h-full rounded-3xl border border-zinc-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-6 top-5 text-5xl font-bold text-zinc-100 dark:text-zinc-800">
                    {i + 1}
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    <Icon name={s.icon} size={20} />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-zinc-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BYOK FEATURES ================= */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-400">
              <Icon name="shield" size={13} />
              BYOK System
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Kendali penuh di tanganmu
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="flex h-full gap-4 rounded-3xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Icon name={f.icon} size={19} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="pb-16 pt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 px-8 py-16 text-center text-white dark:bg-white dark:text-zinc-900">
              <div className="bg-dots absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(255,255,255,0.09)_1px,transparent_1px)] dark:[background-image:radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)]" />
              <div className="glow-orb left-1/2 top-[-120px] h-[260px] w-[480px] -translate-x-1/2 bg-indigo-500/30 dark:bg-indigo-500/20" />
              <div className="relative">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/10 dark:bg-zinc-900/5">
                  <Icon name="sparkles" size={24} />
                </span>
                <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                  Generate PRD, Prompt & Design-mu sekarang
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 dark:text-zinc-500">
                  Atur provider & model AI per role — atau langsung coba dengan mode demo tanpa API key.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/generator"
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-200 active:scale-[0.98] dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-700 sm:w-auto"
                  >
                    <Icon name="play" size={16} />
                    Buka Generator
                    <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/settings"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.98] dark:border-zinc-900/20 dark:text-zinc-900 dark:hover:bg-zinc-900/5 sm:w-auto"
                  >
                    <Icon name="sliders" size={15} />
                    Atur Provider AI
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
