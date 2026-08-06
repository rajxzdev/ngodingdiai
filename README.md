# NgodingDiAI — PRD · Prompt · Design Generator (BYOK)

Web app generator berbasis **pipeline AI 8 role** — dari *Prompt Engineering* sampai *Design Engineering* —
yang mengubah satu brief produk menjadi dokumen siap pakai:

| Output | Isi |
| --- | --- |
| `prompt.md` | Master prompt produksi (peran, spesifikasi, kriteria kualitas, constraints) |
| `prd.md` | Product Requirements Document (tujuan, persona, user stories, prioritas MoSCoW) |
| `design.md` | Design specification (design tokens, komponen, halaman, animasi, dark mode) |
| `map.md` | Project map (struktur direktori, routes, komponen tree, API, data flow) |
| `review.md` | Quality review (checklist, temuan, rekomendasi perbaikan) |

**BYOK (Bring Your Own Key)** — cukup isi **1 API key per provider** (OpenAI, Anthropic, Google, OpenRouter, dll),
dipakai otomatis oleh semua role yang memilih provider tersebut. Setiap role tetap bisa memakai **provider & model
berbeda**, atau set semua role ke satu provider. Key hanya tersimpan di browser (localStorage), dikirim langsung ke
provider AI — tidak pernah ke server.

## Fitur

- 🧠 **8 Role AI berurutan** — hasil role sebelumnya menjadi konteks role berikutnya (SSE live progress).
- ⚙️ **Halaman "Atur AI"** — **Provider API Keys** (isi sekali per provider: OpenAI, Gemini/Google, Anthropic, OpenRouter, Groq, DeepSeek, Mistral, xAI, + Custom OpenAI-compatible) lalu pilih provider & model per role; ada tombol set semua role ke satu provider.
- 🔎 **Search engine model** — cari model dari database JSON, otomatis **terbaru → terlama** (fuzzy match, contoh: `gpt-4.0` menemukan `gpt-4o`), dengan **custom model** sebagai fallback jika tidak ditemukan.
- 🌳 **UI Pipeline** — tree dot putih dengan background hitam keabuan & **animasi mengalir** (flowing dashes + titik berjalan di sepanjang edge), node menyala saat role bekerja.
- 🎨 **UI Web modern** — full-rounded, ikon SVG, scroll animation (IntersectionObserver), light & dark mode, tanpa warna mencolok.
- 🧪 **Mode demo** — tanpa API key, pipeline tetap jalan menghasilkan dokumen contoh sehingga alurnya bisa dilihat.

## Quickstart

```bash
npm install
npm run dev        # http://localhost:3000
```

Build produksi:

```bash
npm run build
npm start
```

## Alur Pipeline (8 Role)

```
Project Brief
 ├─ 1. Prompt Engineer            → prompt.md
 ├─ 2. PRD Analyst                → prd.md
 ├─ 3. UX Researcher
 ├─ 4. UI/UX Designer
 ├─ 5. Design System Engineer
 ├─ 6. Design Engineer            → design.md
 ├─ 7. Architecture & Map Engineer → map.md
 └─ 8. QA & Design Reviewer       → review.md
```

## Arsitektur

```
app/
  page.tsx                # Landing (hero, pipeline demo, output, cara pakai)
  generator/page.tsx      # Generator: brief → pipeline live (CLIENT-SIDE streaming) → output tabs
  api/llm/route.ts        # Proxy streaming per-role (provider tanpa CORS: OpenAI, Anthropic)
  settings/page.tsx       # Atur AI: provider & model per role (BYOK)
  api/
    models/route.ts       # Search engine model (GET ?provider=&q=)
    pipeline/route.ts     # Jalankan 8 role (SSE POST)
    test/route.ts         # Test koneksi provider (POST)
components/
  PipelineTree.tsx        # Tree dot putih + animasi mengalir
  ModelSearchModal.tsx    # Pencarian model + custom model fallback
  OutputTabs.tsx          # Preview markdown / raw, copy, download
  Markdown.tsx            # Renderer markdown ringan
  ...
lib/
  roles.ts                # Definisi 8 role + system prompt + konteks rantai
  providers.ts            # Daftar provider (endpoint OpenAI/Anthropic/Google)
  models-db.ts            # Database model JSON + mesin pencarian fuzzy
  llm.ts                  # Client LLM multi-provider
  demo.ts                 # Generator konten demo (tanpa API key)
  store.ts                # localStorage: roles (provider+model), keys per provider, tema
```

## Teknologi

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS 4** (CSS-first config, dark mode class)
- **Streaming langsung dari browser** ke provider AI (OpenRouter, Google, Groq, dll) — TANPA batas durasi Vercel, jadi pipeline tidak terputus di tengah.
- **Proxy `/api/llm`** untuk provider tanpa CORS (OpenAI, Anthropic) — 1 panggilan per role, bukan 8 sekaligus.

## Deploy ke Vercel

### Cara cepat (Vercel CLI)

```bash
cd genera-studio
npm i -g vercel        # sekali saja
vercel                 # ikuti wizard, pilih project baru
vercel --prod          # deploy produksi
```

**Penting:** jalankan perintah dari **dalam folder `genera-studio`** — bukan dari folder workspace/luar.

### Cara GitHub → Vercel

1. Push isi folder `genera-studio` ke repositori GitHub (package.json, app/, lib/, dll. ada di ROOT repo).
2. Di vercel.com → **Add New Project** → Import repo.
3. Saat import, pastikan setting:
   - **Framework Preset:** `Next.js` (pilih manual jika tidak otomatis terdeteksi)
   - **Root Directory:** `/` jika isi repo = isi project. **Jika kamu push folder `genera-studio` sebagai subfolder di repo, set Root Directory ke `genera-studio`.**
   - **Build Command:** `next build` (default)
   - **Output Directory:** otomatis
4. Deploy.

### ⚠️ Penyebab 404 paling umum di Vercel

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| Semua halaman 404 dengan branding Vercel | **Root Directory salah** — project ada di subfolder tapi di-deploy dari root, sehingga framework tidak terdeteksi dan di-serve sebagai statis | Set **Root Directory** ke `genera-studio` (atau pindahkan isi project ke root repo) |
| Semua halaman 404 | Framework tidak terdeteksi sebagai Next.js | Di Vercel, pilih **Framework Preset: Next.js** lalu redeploy |
| Halaman 404 hanya di route tertentu (`/generator`, `/settings`) | Deploy versi lama / cache | Redeploy (Vercel → Deployments → Redeploy), hard refresh (Cmd/Ctrl+Shift+R) |
| 404 di custom domain tapi OK di `*.vercel.app` | DNS custom domain belum selesai (propagasi / A record salah) | Cek tab **Domains** di Vercel — tunggu "Valid Configuration" |
| Build gagal (bukan 404) | Versi Node salah | Sudah dipin lewat `engines` + `.nvmrc` (Node 20) |

### Catatan penting untuk project ini

- **API key tidak perlu env var** — semua key tersimpan di localStorage browser user (BYOK). App bisa langsung jalan setelah deploy tanpa konfigurasi apa pun.
- Pipeline berjalan **di browser (client-side)** — tidak kena batas durasi function Vercel (Hobby ±10–60s). Provider dengan CORS (OpenRouter, Google, Groq, DeepSeek, Mistral, xAI, Custom) dipanggil langsung dari browser; OpenAI & Anthropic lewat proxy `/api/llm` (per-role, maxDuration 60s; aktifkan Fluid Compute untuk 300s).
- Database model (`lib/models.json`) ikut ter-bundle saat build, jadi tidak perlu external database.

### Verifikasi setelah deploy

```bash
curl -I https://<url-vercel>/                # harus 200
curl "https://<url-vercel>/api/models?provider=openrouter&q=gemini"
```

# ©RAJXZDEV
