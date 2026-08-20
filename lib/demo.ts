export interface DemoInput {
  project: string;
  type: string;
  brief: string;
  extra: string;
}

const NOTE =
  "> ⚠️ *Konten DEMO* — dihasilkan tanpa API key. Atur provider & model AI untuk tiap role di halaman **Atur AI**, lalu jalankan kembali untuk hasil asli.\n";

function briefBlock(input: DemoInput): string {
  return [
    `- **Nama produk:** ${input.project}`,
    `- **Jenis:** ${input.type}`,
    `- **Brief:** ${input.brief}`,
    input.extra ? `- **Catatan tambahan:** ${input.extra}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function generateDemo(roleId: string, input: DemoInput): string {
  const { project, type } = input;

  switch (roleId) {
    case "web-analyst":
      return `# Web Analysis — Website Referensi

${NOTE}
## 1. Ringkasan
Analisis awal website referensi untuk memandu desain & sistem produk **${project}**.

## 2. Informasi Halaman
- **URL:** (diisi dari input user — di mode demo memakai contoh)
- **Mode analisis:** desain + sistem
- **Struktur umum:** hero, section fitur, testimoni, harga/CTA, footer

## 3. Analisis Desain (contoh desain)
- **Tata letak:** hero besar satu kolom → grid kartu → section bergantian; whitespace lega.
- **Komponen:** tombol pill (rounded-full), kartu rounded-2xl/3xl, badge kecil, navbar sticky dengan blur.
- **Warna:** palet monokrom netral + satu aksen subtil (indigo/violet); dark mode penuh.
- **Tipografi:** judul besar & tebal (700), body kecil dengan line-height lega.
- **Animasi:** reveal saat scroll (fade + translate), hover naik 1–2px, transisi 150–300ms.

## 4. Analisis Sistem & Fitur (contoh sistem)
- **Fitur utama:** onboarding cepat, alur aksi inti ≤ 3 langkah, umpan balik instan (loading/success/error).
- **Struktur informasi:** navigasi sederhana (Beranda → Fitur → Harga → CTA).
- **Interaksi:** form singkat, empty & error state jelas, mode gelap toggle.

## 5. Insight & Pola yang Bisa Diadopsi
1. Hero satu kalimat + satu CTA utama.
2. Kartu ringkas dengan hierarki kuat; tanpa dekorasi berlebihan.
3. Dark mode bukan "mewah" tapi "wajib" untuk user teknis.

## 6. Kesimpulan & Rekomendasi untuk Prompt Engineer
Jadikan pola di atas sebagai acuan: minimalis, full-rounded, aksen subtil, dark mode, dan alur yang pendek. Produk **${project}** mengikuti bahasa visual yang sama namun dengan identitas sendiri.
`;

    case "prompt-engineer":
      return `# Master Prompt — ${project}

${NOTE}
## 1. Peran
Kamu adalah **AI Product Builder** yang mengubah brief menjadi produk digital yang utuh, modern, dan siap produksi.

## 2. Konteks & Latar Belakang
${briefBlock(input)}

## 3. Tujuan Produk
1. Menyediakan ${type} yang memenuhi kebutuhan utama user dalam waktu singkat.
2. Pengalaman pengguna minimalis, cepat, dan enak dipakai (full-rounded, tanpa warna mencolok).
3. Kode bersih, terstruktur, mudah dikembangkan, dengan dukungan dark & light mode.
4. Aksesibilitas dan performa menjadi standar wajib (SEO, LCP < 2.5s).

## 4. Spesifikasi Fungsional
- **Utama (wajib):** landing/beranda, halaman inti sesuai ${type}, navigasi responsif.
- **Prioritas tinggi:** form input yang jelas, feedback state, empty state, error state.
- **Tambahan:** animasi scroll halus, filter/pencarian (jika relevan), halaman detail.
- **Alur utama:** User membuka → memahami value → melakukan aksi inti → mendapat hasil → kembali.

## 5. Desain & Pengalaman Pengguna
- Gaya **modern & minimalis**: banyak ruang kosong, sudut membulat penuh (rounded-2xl/3xl), ikon SVG stroke dengan sudut halus.
- Palet monokrom netral + **satu aksen subtil**; dukung light & dark mode penuh.
- Animasi halus: reveal saat scroll, transisi 150–300ms, micro-interaction pada tombol.
- Tipografi hierarki jelas; kontras WCAG AA.

## 6. Spesifikasi Teknis
- **Stack:** Next.js (App Router) + Tailwind CSS.
- **Arsitektur:** komponen di \`components/\`, halaman di \`app/\`, logika di \`lib/\`.
- **State:** React state/context lokal; minimal dependency.
- **API:** route handler Next.js jika butuh backend.

## 7. Format Output yang Diharapkan
1. \`prompt.md\` — master prompt (dokumen ini)
2. \`prd.md\` — product requirements
3. \`design.md\` — design specification
4. \`map.md\` — peta arsitektur proyek
5. \`review.md\` — quality review

## 8. Kriteria Kualitas
- [ ] UI konsisten di semua halaman & kedua mode (light/dark)
- [ ] Semua state (hover/active/error/empty) terdefinisi
- [ ] Responsif mobile → desktop tanpa breakpoint yang aneh
- [ ] Semantik HTML benar, aksesibilitas keyboard, focus ring jelas
- [ ] Kode TypeScript strict, tidak ada \`any\` yang tidak perlu

## 9. Batasan (Constraints)
- Dilarang menggunakan warna mencolok/neon; tetap netral & elegan.
- Dilarang menambah dependency berat tanpa alasan.
- Tidak memakai library UI pihak ketiga untuk komponen dasar.

## Langkah Berikutnya
1. Generate \`prd.md\` untuk mempertajam fitur & prioritas.
2. Generate \`design.md\` sebagai acuan visual.
3. Generate \`map.md\` untuk struktur implementasi.
4. Jalankan QA (\`review.md\`) sebelum coding.
`;

    case "prd-analyst":
      return `# PRD — ${project}

${NOTE}
## 1. Ringkasan Produk
**${project}** adalah ${type} yang menyelesaikan masalah utama user dengan pengalaman modern, cepat, dan minimalis.

## 2. Tujuan & Metrik Sukses
| Tujuan | Metrik |
| --- | --- |
| Adopsi awal | 1.000 pengguna aktif di bulan pertama |
| Engagement | ≥ 4 sesi / minggu per user |
| Retensi | ≥ 40% pengguna kembali di minggu ke-2 |
| Kualitas | Kepuasan ≥ 4.5/5 pada survei |

## 3. Persona Pengguna
1. **Pengguna awal (early adopter)** — melek teknologi, ekspektasi UI modern.
2. **Pengguna harian** — butuh kecepatan & alur yang minim friksi.
3. **Pengguna mobile-first** — mayoritas akses dari HP.

## 4. User Stories
- Sebagai pengguna baru, saya ingin langsung paham value produk, agar tidak bingung.
- Sebagai pengguna aktif, saya ingin menyelesaikan aksi inti dalam ≤ 3 langkah.
- Sebagai pengguna mobile, saya ingin semua fitur nyaman dipakai di layar kecil.

## 5. Fitur & Prioritas
| Fitur | Prioritas | Deskripsi |
| --- | --- | --- |
| Beranda & hero | Must | Value proposition jelas + CTA |
| Halaman inti ${type} | Must | Fungsi utama produk |
| Navigasi responsif | Must | Mobile & desktop |
| Dark mode | Should | Token warna lengkap |
| Animasi scroll | Should | Reveal halus |
| Pencarian/filter | Could | Jika relevan |

## 6. Alur Utama
1. User membuka halaman → melihat hero + CTA.
2. User melakukan aksi inti (daftar/input/pilih).
3. Sistem memberi umpan balik instan (loading, success, error).
4. User melihat hasil & terdorong kembali.

## 7. Kebutuhan Non-Fungsional
- Performa: LCP < 2.5s, bundle < 200KB gzipped (halaman utama).
- Aksesibilitas: WCAG 2.1 AA; keyboard navigable.
- SEO: meta lengkap, semantic HTML, sitemap.

## 8. Risiko & Mitigasi
| Risiko | Mitigasi |
| --- | --- |
| Scope membengkak | Prioritas MoSCoW disepakati sejak awal |
| Desain tidak konsisten | Design system + design.md sebagai acuan tunggal |
| Performa turun | Code-splitting, gambar dioptimasi, lazy load |

## 9. Definition of Done
- Semua fitur Must selesai & teruji.
- Light & dark mode konsisten.
- Responsif di 3 breakpoint.
- \`map.md\` diikuti saat implementasi.
`;

    case "ux-researcher":
      return `# Riset UX — ${project}

${NOTE}
## 1. Ringkasan Riset
Pengguna ${type} ini paling menghargai **kecepatan, kejelasan, dan keindahan antarmuka**. Hambatan terbesar: kebingungan alur dan kesan "berantakan".

## 2. Persona & Kebutuhan
| Persona | Kebutuhan utama | Pain point |
| --- | --- | --- |
| Early adopter | Eksplorasi cepat, fitur terlihat jelas | Info berlebihan di beranda |
| User harian | Alur singkat, shortcut | Form panjang & repetitif |
| Mobile-first | Satu tangan, thumb zone | Tombol kecil, teks kecil |

## 3. User Journey Map
| Tahap | Aksi | Pikiran | Emosi | Peluang |
| --- | --- | --- | --- | --- |
| Sadar | Lihat iklan/referensi | "Apa ini?" | Penasaran | Hero jelas |
| Pertimbang | Buka beranda | "Apakah berguna?" | Ragu | Bukti/sosial proof |
| Aksi | Daftar / gunakan | "Semoga cepat" | Antusias | Form singkat |
| Hasil | Lihat output | "Wow, rapi" | Puas | Feedback instan |
| Kembali | Kunjungi lagi | "Enak dipakai" | Loyal | Notifikasi/ritme |

## 4. Task Flow Utama
- **Task A (onboarding):** Beranda → hero → CTA → form singkat → sukses.
- **Task B (aksi inti):** Navigasi → halaman inti → input → hasil → ulangi.
- **Task C (pengaturan):** Profile → settings → toggle dark mode → tersimpan.

## 5. Struktur Informasi (Sitemap)
- Beranda
  - Halaman inti
  - Tentang / fitur
  - Pengaturan (dark mode, profil)

## 6. Pain Point & Insight
- Form panjang = drop-off tertinggi → pecah jadi langkah kecil.
- Tanpa umpan balik saat loading = user mengira rusak → skeleton + spinner halus.
- Mode gelap bukan "mewah" tapi "wajib" bagi user teknis.

## 7. Kebutuhan Aksesibilitas
- Kontras teks ≥ 4.5:1; target sentuh ≥ 44px.
- Fokus keyboard terlihat jelas; hindari interaksi hover-only.

## 8. Rekomendasi untuk Desain
1. Hero satu kalimat + satu CTA.
2. Kartu berisi ringkas dengan hierarki kuat.
3. Semua tombol rounded penuh; aksen subtil.
`;

    case "ui-designer":
      return `# Keputusan Desain UI — ${project}

${NOTE}
## 1. Arah Visual & Prinsip Desain
- **Tenang & presisi:** banyak whitespace, tanpa dekorasi berlebihan.
- **Full-rounded:** kartu \`rounded-2xl/3xl\`, tombol \`rounded-full\`, input \`rounded-xl\`.
- **Monokrom + aksen:** netral (zinc) dengan satu aksen indigo subtil.
- **Icon SVG stroke** dengan \`stroke-width 1.8\`, ujung membulat.

## 2. Layout & Grid per Halaman
- **Header:** logo kiri, nav tengah, aksi kanan; sticky + backdrop blur.
- **Hero:** judul besar (clamp 2.5–4rem), subjudul, CTA, visual/ilustrasi abstrak.
- **Konten:** grid 12 kolom; kartu 3 kolom di desktop, 1 kolom di mobile.
- **Footer:** 3 kolom link + hak cipta.

## 3. Komponen Utama
- Button (primary/secondary/ghost) — semua \`rounded-full\`
- Card, Input, Badge, Toggle (dark mode), Modal, Skeleton, Toast
- Navigation bar, Footer, Empty state, Error state

## 4. Pola Interaksi
- Hover: naik 1–2px + shadow halus (150ms).
- Scroll: reveal fade+translate (700ms, easing lembut).
- Click: scale 0.98 → kembali.
- Dark mode toggle: ikon sun/moon berputar halus.

## 5. Responsif
- Mobile: 1 kolom, nav jadi menu hamburger, tombol full-width.
- Tablet: 2 kolom, nav ringkas.
- Desktop: 3 kolom, container max-7xl.

## 6. Dark Mode Strategy
- Bukan "invert", tapi token terpisah: surface gelap (#0c0c0e), teks terang.
- Aksen sedikit dinaikkan luminansinya agar kontras di gelap.

## 7. Catatan untuk Design System Engineer
- Semua warna & spacing harus jadi token, bukan hardcode.
- Radius konsisten: 12/16/24/999.
- Sediakan state untuk setiap komponen.
`;

    case "design-system":
      return `# Design System — ${project}

${NOTE}
## 1. Prinsip Sistem
Satu sumber kebenaran untuk warna, tipografi, spacing, radius, dan komponen. Semua UI memakai token — tidak ada nilai hardcode.

## 2. Color Tokens
| Token | Light | Dark |
| --- | --- | --- |
| \`bg-surface\` | #ffffff | #0c0c0e |
| \`bg-muted\` | #f4f4f5 | #131316 |
| \`text-primary\` | #18181b | #fafafa |
| \`text-secondary\` | #52525b | #a1a1aa |
| \`border-default\` | #e4e4e7 | #27272a |
| \`accent\` | #6366f1 | #818cf8 |

## 3. Typography
| Level | Size | Weight | Line-height |
| --- | --- | --- | --- |
| Display | clamp(2.5rem, 6vw, 4rem) | 700 | 1.05 |
| H1 | 1.75rem | 700 | 1.2 |
| H2 | 1.35rem | 650 | 1.3 |
| Body | 0.95rem | 400 | 1.7 |
| Caption | 0.8rem | 500 | 1.5 |

Font: system-ui stack (tanpa webfont berat).

## 4. Spacing & Layout
- Skala spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Container: max-w-7xl (80rem), padding mobile 16px, desktop 32px.
- Grid: 12 kolom, gutter 24px.

## 5. Radius, Border & Shadow
- Radius: 12px (card kecil), 16px (card besar), 24px (modal/section), 999px (pill).
- Border: 1px \`border-default\`.
- Shadow: \`0 1px 2px rgba(0,0,0,.05)\`, hover \`0 8px 24px rgba(0,0,0,.08)\`.

## 6. Komponen Dasar
| Komponen | Default | Hover | Active | Disabled |
| --- | --- | --- | --- | --- |
| Button primary | bg-zinc-900 text-white | bg-zinc-800 | scale .98 | opacity-50 |
| Button accent | bg-accent text-white | opacity-90 | scale .98 | opacity-50 |
| Input | border-default bg-surface | border-zinc-400 | ring-2 accent | opacity-50 |
| Card | border bg-surface radius-16 | shadow-md translate-y-[-2px] | — | — |
| Badge | bg-muted text-secondary | — | — | — |

## 7. Iconography
- Gaya: stroke 1.8, sudut membulat, viewBox 24.
- Ukuran: 16/20/24px.

## 8. Aksesibilitas
- Kontras teks ≥ 4.5:1; aksen ≥ 3:1 untuk elemen besar.
- Focus ring: \`ring-2 ring-accent ring-offset-2\`.
- Target sentuh minimum 44×44px.

## 9. Mapping ke Tailwind
\`\`\`ts
// tailwind theme
colors: { surface: "var(--bg-surface)", muted: ..., accent: "#6366f1" }
borderRadius: { card: "16px", modal: "24px", pill: "999px" }
\`\`\`
`;

    case "design-engineer":
      return `# Design Specification — ${project}

${NOTE}
## 1. Ringkasan Desain
**${project}** mengusung estetika **modern-minimalis**: monokrom netral, satu aksen subtil, sudut membulat penuh, ikon SVG stroke, animasi halus, dan dukungan light/dark mode penuh.

## 2. Prinsip Desain
1. **Ketenangan** — whitespace adalah fitur.
2. **Konsistensi** — token, bukan nilai hardcode.
3. **Kecepatan** — animasi 150–300ms, tidak pernah menghalangi.
4. **Aksesibilitas** — kontras AA, keyboard-first.
5. **Kesederhanaan** — satu cara utama untuk tiap aksi.

## 3. Design Tokens
| Token | Light | Dark |
| --- | --- | --- |
| Surface | #ffffff | #0c0c0e |
| Muted | #f4f4f5 | #131316 |
| Text primary | #18181b | #fafafa |
| Text secondary | #52525b | #a1a1aa |
| Border | #e4e4e7 | #27272a |
| Accent | #6366f1 | #818cf8 |
| Radius card | 16px | 16px |
| Radius pill | 999px | 999px |

## 4. Komponen & States
- **Button:** primary (zinc-900), accent (indigo), ghost (transparan + border). Hover naik 1px + shadow; active scale .98; disabled opacity-50.
- **Input:** border 1px, fokus ring accent, label jelas, helper text.
- **Card:** border + radius 16px; hover shadow + -2px.
- **Toggle dark mode:** sun ⇄ moon dengan rotasi 180° (300ms).

## 5. Halaman & Layout
- **Header:** sticky, backdrop-blur, logo + nav + CTA.
- **Hero:** badge kecil → judul besar → subjudul → 2 CTA → visual.
- **Section fitur:** 3 kartu grid; reveal bergantian saat scroll.
- **Footer:** 3 kolom + copyright.

## 6. Interaksi & Animasi
- Scroll reveal: opacity 0→1, translateY 24px→0, 700ms cubic-bezier(.22,1,.36,1), stagger 80ms.
- Hover: transition 150ms; tombol scale .98 saat click.
- Skeleton shimmer saat loading konten.

## 7. Mode Terang & Gelap
- Strategy: class \`.dark\` di \`<html>\`; token via CSS variables.
- Default ikuti \`prefers-color-scheme\`, toggle tersimpan di localStorage.
- Dark: surface #0c0c0e, border #27272a, text #fafafa.

## 8. Aksesibilitas
- Kontras ≥ 4.5:1 teks; focus ring 2px accent + offset.
- Semua interaksi bisa diakses keyboard; skip-link disediakan.

## 9. Implementasi Tailwind
\`\`\`tsx
<button className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white
  transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[.98] dark:bg-white dark:text-black">
  Mulai Sekarang
</button>
\`\`\`

## 10. Checklist Kualitas Desain
- [ ] Token dipakai di seluruh halaman
- [ ] Light & dark mode konsisten
- [ ] Semua state terdefinisi
- [ ] Responsif 3 breakpoint
- [ ] Kontras AA terpenuhi
`;

    case "map-engineer":
      return `# Project Map — ${project}

${NOTE}
## 1. Ringkasan Arsitektur
Aplikasi **${project}** dibangun dengan **Next.js (App Router) + Tailwind CSS**, monorepo sederhana, statis-first dengan API opsional. Fokus: cepat, ringan, mudah dikembangkan.

## 2. Struktur Direktori
\`\`\`
${project.toLowerCase().replace(/\s+/g, "-")}/
├── app/
│   ├── layout.tsx          # Root layout + theme provider
│   ├── page.tsx            # Beranda / hero
│   ├── globals.css         # Tailwind + tokens
│   └── (fitur)/
│       ├── page.tsx        # Halaman inti
│       └── components.tsx  # Komponen spesifik halaman
├── components/
│   ├── ui/                 # Button, Input, Card, Badge...
│   └── layout/             # Header, Footer, Nav
├── lib/
│   ├── tokens.ts           # Warna/spacing (CSS variables)
│   └── utils.ts            # Helper
└── public/                 # Aset statis
\`\`\`

## 3. Peta Halaman / Routes
| Route | Deskripsi | Auth |
| --- | --- | --- |
| \`/\` | Beranda: hero, fitur, CTA | — |
| \`/fitur\` | Halaman inti | opsional |
| \`/pengaturan\` | Toggle dark mode, profil | ya |

## 4. Komponen Tree
\`\`\`
<Layout>
  <Header /> <Nav /> <ThemeToggle />
  <main>
    <Hero /> <FeatureGrid /> <CTA />
  </main>
  <Footer />
</Layout>
\`\`\`

## 5. Data Flow & State
- **Client state:** React \`useState\`/context untuk theme & form (lokal).
- **Server state:** route handler Next.js bila perlu API.
- **Pola:** \`use client\` hanya di komponen interaktif; sisanya server components.

## 6. API Endpoints
| Method | Path | Deskripsi | Response |
| --- | --- | --- | --- |
| POST | \`/api/generate\` | Proses aksi inti | \`{ ok, data }\` |
| GET | \`/api/health\` | Health check | \`{ status: "ok" }\` |

## 7. Database / Data Model
\`\`\`ts
interface User {
  id: string; name: string; theme: "light" | "dark";
  createdAt: string;
}
\`\`\`

## 8. Integrasi & Deployment
- **Deploy:** Vercel (default) — build \`next build\`.
- **Env:** \`.env.local\` untuk variabel rahasia; jangan commit.
- **CI:** lint + typecheck sebelum deploy.

## 9. Checklist Implementasi
1. Setup Next.js + Tailwind + tokens (dark mode).
2. Layout & komponen UI dasar.
3. Beranda + hero + section fitur.
4. Halaman inti + form + feedback state.
5. Responsif & animasi scroll.
6. Aksesibilitas & SEO (meta, sitemap).
7. QA review sebelum rilis.
`;

    case "quality-reviewer":
      return `# Quality Review — ${project}

${NOTE}
## 1. Ringkasan Penilaian
| Dokumen | Skor | Catatan |
| --- | --- | --- |
| prompt.md | 8.5/10 | Struktur lengkap, terarah |
| prd.md | 8.0/10 | Prioritas jelas, metrik terukur |
| design.md | 8.5/10 | Token & komponen konsisten |
| map.md | 8.0/10 | Arsitektur praktis, mudah diikuti |

## 2. Checklist Kualitas
| Aspek | Status | Catatan |
| --- | --- | --- |
| Tujuan & metrik | ✅ | Ada di PRD |
| Persona | ✅ | 3 persona dengan pain point |
| Design tokens | ✅ | Light/dark lengkap |
| Aksesibilitas | ⚠️ | Sudah disebut, perlu pengujian |
| Responsif | ✅ | 3 breakpoint |
| API & data flow | ✅ | Sederhana & cukup |

## 3. Temuan Utama
1. **⚠️ (P1)** — Belum ada rencana pengujian aksesibilitas konkret (tool, target skor).
2. **⚠️ (P2)** — Empty & error state hanya disebut, perlu didetailkan.
3. **ℹ️ (P2)** — Skala \`prefers-reduced-motion\` belum eksplisit untuk animasi.

## 4. Perbaikan yang Direkomendasikan
| Dokumen | Perbaikan | Prioritas |
| --- | --- | --- |
| design.md | Tambah aturan \`prefers-reduced-motion\` | P2 |
| prd.md | Tambah definisi empty/error state | P2 |
| map.md | Tambah skenario deploy & env vars | P2 |

## 5. Risiko & Blocker
- **Blocker:** tidak ada.
- **Risiko utama:** scope creep pada fitur "Could" → kunci di Must/Should.

## 6. Verdict Akhir
**READY** ✅ — dengan catatan: selesaikan item P1/P2 di atas selama implementasi. Dokumen sudah cukup konsisten untuk mulai coding mengikuti \`map.md\`.
`;

    default:
      return `# ${roleId}\n\n${NOTE}\n_Dokumen demo._`;
  }
}
