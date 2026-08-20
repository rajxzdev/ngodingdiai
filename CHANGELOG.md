# Changelog

Semua perubahan penting pada **NgodingDiAI** akan dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/),
dan versioning mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Ditambahkan
- `CHANGELOG.md` — dokumentasi riwayat perubahan project.
- **Animasi ala React Bits** di landing page:
  - **Soft Aurora** — 3 blob gradient (indigo/violet/sky) yang mengambang pelan di belakang hero.
  - **Text Scramble** — judul section diacak lalu merapikan jadi teks penuh saat scroll (Pipeline 9 Role AI, Lima dokumen, Tiga langkah, Kendali penuh).
  - **Number Ticker** — angka statistik (9, 6, 8+, 100%) berhitung naik saat terlihat.
  - **Shine** — kilau cahaya menyapu tombol CTA ("Mulai Generate" & "Jalankan Pipeline").
  - **Dot Field** — 12 partikel melayang naik pelan di dalam bagan tree.
  - Komponen baru: `components/TextScramble.tsx`, `components/Ticker.tsx` (tanpa dependency tambahan).

### Diubah
- **Bagan tree didesain ulang total** — alur linear 2 baris yang bersih:
  - Baris 1: Web Analyst → Prompt Engineer → PRD → UX Researcher → UI Designer.
  - Baris 2: Design System → Design Engineer → Map Engineer → QA Reviewer.
  - Zona warna besar dihapus; garis panah lurus (1 lengkungan lembut di UI→Design System).
  - Warna hanya jadi aksen kecil (ikon + label chain + status).
  - **Project Brief dipindah ke tengah atas** (sebelumnya kiri atas).
  - Kotak role berukuran pas (~203px), jarak antar kotak konsisten, kanvas 1500px (muat di desktop).
- **Konten anti-blank** — elemen animasi scroll hanya disembunyikan saat JS benar-benar jalan; kalau JS gagal, konten tetap terlihat.
- Server preview dijalankan dalam **mode produksi** (`next build` + `next start`).

### Diperbaiki
- Duplikat key zona alur (React warning) — key kini unik per label.
- Bug ukuran kotak di bagan yang tidak konsisten antar lebar layar.

## [1.0.0] — 2026-08-19

### Ditambahkan
- **Sistem lisensi Apache-2.0** — file `LICENSE` lengkap + `license` & `author` di `package.json`.
- **Role baru: Web & Reference Analyst** — pipeline menjadi **9 role** (sebelumnya 8):
  1. Web & Reference Analyst → `web-analysis.md`
  2. Prompt Engineer → `prompt.md`
  3. PRD Analyst → `prd.md`
  4. UX Researcher
  5. UI/UX Designer
  6. Design System Engineer
  7. Design Engineer → `design.md`
  8. Architecture & Map Engineer → `map.md`
  9. QA & Design Reviewer → `review.md`
- **Input URL website referensi** di Generator — pilih mode **Contoh Desain / Contoh Sistem / Desain + Sistem**.
- **Auto `https://`** — URL tanpa protocol otomatis ditambahkan `https://` (di client & server `/api/fetch-url`).
- **Fallback manual** (opsional) per role — model cadangan dengan provider & model bebas.
- **Smart Fallback** (default aktif) — saat model kena rate-limit/unavailable, otomatis mencoba model lain yang tersedia (prioritas: `openrouter/auto` → model gratis).
- **Model `openrouter/auto`** — router otomatis OpenAI, disematkan paling atas di search engine OpenRouter.
- **Database model diperbarui (146 model, 8 provider)** — riset Agustus 2026: GPT-5.6 series & Cyber, Claude Opus 5 / Fable 5 / Sonnet 5, Gemini 3.7 Flash / 3.6 / 3.5, DeepSeek V4 Pro (0813), Grok 4.6, Mistral Small 4, GLM-5.2, Qwen3.6, MiniMax M3, Nemotron 3 Ultra, dll.
- **Pertanyaan pilihan (12 butir)** di Generator — bahasa output, bahasa UI, target pengguna, platform, gaya desain, fitur utama, skala proyek, warna aksen, mode tampilan, stack teknologi, isi konten, prioritas.
- **Bagan tree pipeline kotak lebar** — 9 role berupa kartu besar dengan ikon, label chain, indikator status; zona alur berwarna; kanvas panorama 3400px; responsive dengan swipe di layar kecil.

### Diperbaiki
- **Bug duplikat key `openrouter/auto`** di modal pencarian model (React warning "two children with the same key").
- **Overflow horizontal di HP** — semua grid diberi `grid-cols-1` agar kartu provider/role selebar layar (sebelumnya kartu melebar hingga 604px di viewport 390px).
- **Teks hint provider membungkus** (tinggi kartu tidak rata) — `truncate` di dalam flex diberi `min-w-0`.
- **Warning "Cross origin request detected"** di dev — `allowedDevOrigins` di `next.config.mjs`.
- **Input berubah putih saat autofill** — CSS `-webkit-autofill` mengikuti tema.

## [0.9.0] — 2026-08-19

### Diubah
- **Pipeline berjalan client-side** (streaming langsung dari browser ke provider AI) — tidak lagi lewat server, sehingga **tidak terputus oleh batas durasi function Vercel**.
- Provider dengan CORS (OpenRouter, Google, Groq, DeepSeek, Mistral, xAI, Custom) dipanggil langsung dari browser; OpenAI & Anthropic lewat proxy `/api/llm` per-role.

### Ditambahkan
- **Mode Ekspres (paralel)** di Generator — role berjalan serentak setelah Prompt Engineer (jauh lebih cepat).
- **Mode Rantai (kualitas)** — 8/9 role berurutan dengan konteks berantai.
- **Tombol Batal** pipeline.
- **Watchdog** — peringatan di log jika tidak ada respons AI dalam 40 detik.
- **Deteksi stream terputus** — status tidak lagi "COMPLETED" palsu; muncul log ⛔ dengan jumlah role yang selesai.

## [0.8.0] — 2026-08-19

### Ditambahkan
- **API key global per provider** — cukup isi 1 key per provider (OpenRouter, OpenAI, Anthropic, Google, Groq, DeepSeek, Mistral, xAI, + Custom), dipakai otomatis oleh semua role yang memilih provider tersebut.
- **Provider Custom (OpenAI-compatible)** — dengan Base URL manual (Ollama, vLLM, LM Studio, gateway sendiri).
- **Migrasi otomatis** config lama (key per role) ke format baru (key per provider).
- **Tombol Import / Ekspor JSON** konfigurasi.
- **Test koneksi** per provider & per role.

## [0.7.0] — 2026-08-06

### Ditambahkan
- **Search engine model** — database JSON (`lib/models.json`), pencarian fuzzy, diurutkan **terbaru → terlama**; custom model sebagai fallback.
- **Halaman "Atur AI"** — konfigurasi provider & model per role.

### Diperbaiki
- Berbagai penyempurnaan UI (full-rounded, dark mode, scroll animation).

## [0.6.0] — 2026-08-06

### Ditambahkan
- **Brand "NgodingDiAI"** — penggantian nama dari "Genera Studio" (navbar, metadata, footer, localStorage keys).
- Panduan deploy Vercel + troubleshooting 404 di README.

## [0.5.0] — 2026-08-06

### Ditambahkan
- **Pipeline AI 8 role** (awal): Prompt Engineer → PRD Analyst → UX Researcher → UI/UX Designer → Design System Engineer → Design Engineer → Architecture & Map Engineer → QA & Design Reviewer.
- **Output**: `prompt.md`, `prd.md`, `design.md`, `map.md`, `review.md`.
- **BYOK (Bring Your Own Key)** — API key tersimpan di browser (localStorage), dikirim langsung ke provider.
- **UI Pipeline** — tree dot putih dengan animasi mengalir di background gelap.
- **Mode demo** — tanpa API key, pipeline menghasilkan dokumen contoh.
- Stack: Next.js (App Router) + Tailwind CSS, TypeScript.

[1.0.0]: https://github.com/ngodingdiai/ngodingdiai/releases/tag/v1.0.0
[0.9.0]: https://github.com/ngodingdiai/ngodingdiai/releases/tag/v0.9.0
[0.8.0]: https://github.com/ngodingdiai/ngodingdiai/releases/tag/v0.8.0
[0.7.0]: https://github.com/ngodingdiai/ngodingdiai/releases/tag/v0.7.0
[0.6.0]: https://github.com/ngodingdiai/ngodingdiai/releases/tag/v0.6.0
[0.5.0]: https://github.com/ngodingdiai/ngodingdiai/releases/tag/v0.5.0
