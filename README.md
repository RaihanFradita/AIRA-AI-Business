# AIRA Business — Intelijen Keuangan berbasis AI

Dashboard keuangan modern untuk perusahaan & UMKM: grafik revenue/margin, **AI Chat**, dan **impor Excel/CSV**.

## Stack
Bun · Elysia · PostgreSQL — React 19 · Vite · Tailwind 4 · Recharts

## Fitur utama
| Halaman | Fungsi |
|---|---|
| **Command Center** `/app` | KPI (pendapatan, laba kotor, margin, laba operasional, transaksi, AOV), grafik pendapatan-laba-margin, donut kategori, produk teratas, gauge margin, waterfall laba, pola hari, anomali, proyeksi 3 bulan, heatmap harian, AI Insights otomatis |
| **AI Assistant** `/assistant` | Chat dalam bahasa Indonesia atau English (US): “margin bulan lalu?”, “pendapatan Q1 2026”, “forecast”, “any anomalies?”. Jawaban + grafik/tabel di dalam chat. Drawer global: **Ctrl/⌘ J** |
| **Data Studio** `/data` | Unggah `.xlsx`/`.csv`, deteksi kolom otomatis (header Indonesia/Inggris, format `Rp 1.250.000`, tanggal `dd/mm/yyyy`), pemetaan manual, pratinjau; atau pakai database / data contoh |
| **Analisis mendalam** `/analysis` | Pareto, matriks produk (pendapatan × margin), proyeksi, profitabilitas per produk, pertumbuhan bulanan |
| **Laba rugi** `/income-statement` | Laporan bulanan + jembatan laba + unduh CSV |
| Operasional | Transaksi, persediaan, produk (kini dengan **HPP**), pelanggan, laporan — tema baru |
| **Demo** `/demo` | Fitur finance dengan data contoh tanpa login/database; chat LLM opsional memerlukan backend |

## Menjalankan
```bash
cp .env.example .env            # isi DATABASE_URL & JWT_SECRET (JWT_SECRET panjang & acak)
createdb aira_business
cd backend && bun install && bun run db:setup     # menambah kolom products.cost (HPP)
psql "$DATABASE_URL" -f ../database/seed.sql      # DEV: admin@nova.test/admin123 — 12 bulan riwayat + HPP
bun run dev                                       # http://localhost:3000/api/health

cd ../frontend && npm install && npm run dev      # http://localhost:5173  (coba juga /demo)
```
> Database lama: `bun run db:setup` aman dijalankan ulang (`ADD COLUMN IF NOT EXISTS`) dan membuat tabel profil perusahaan. Isi HPP produk lewat halaman Produk.

## Pengaturan
- Halaman **Pengaturan** menyimpan nama, industri, email, telepon, situs web, alamat, dan ID pajak perusahaan di database. Administrator dapat mengubah profil; pengguna lain hanya dapat melihatnya.
- Pilihan bahasa antarmuka **Indonesia** / **English (US)** dan kepadatan tampilan disimpan di browser yang sedang digunakan.
- Mode demo menyediakan halaman **Pengaturan** untuk mengganti bahasa antarmuka Indonesia / English (US), tanpa perlu login.

## AI: cara kerja & konfigurasi
1. **Mesin analisis lokal** (default, tanpa API key): memahami perintah, menghitung dari dataset, dan mengembalikan teks + grafik. Angka selalu dihitung deterministik.
2. **Opsional — LLM** (narasi lebih kaya): set di `.env`
   - `ANTHROPIC_API_KEY=...` (model via `ANTHROPIC_MODEL`), atau
   - `AI_PROVIDER=ollama` + `OLLAMA_URL=http://localhost:11434` + `OLLAMA_MODEL=gemma3:4b` untuk memilih Ollama secara eksplisit (data tetap lokal). `auto` memilih Anthropic lebih dulu jika `ANTHROPIC_API_KEY` tersedia.

   `AI_DEMO_ENABLED=true` mengaktifkan chat LLM di halaman demo; endpoint demo membatasi 20 permintaan per menit dan membatasi ukuran konteks. Nonaktifkan endpoint demo pada deployment publik yang tidak memerlukan chat anonim. Browser mengambil fakta keuangan terhitung secara lokal dan hanya mengirim ringkasan relevan + hasil hitung ke backend; tidak mengirim seluruh baris transaksi. Ini retrieval deterministik atas agregat terstruktur (bukan vector database). Teks dari sel Excel diperlakukan sebagai data tidak tepercaya. Bila penyedia gagal, UI kembali ke jawaban lokal; pertanyaan di luar konteks bisnis dijawab dengan abstain.

## API tambahan
`GET /api/finance/transactions?days=` (admin) · `GET /api/company-profile/` (authenticated) · `PUT /api/company-profile/` (admin) · `GET /api/ai/status` · `POST /api/ai/chat` — plus semua endpoint lama.

## Format Excel yang disarankan
Kolom: `Tanggal, Produk, Kategori, Pelanggan, Channel, Qty, Pendapatan, HPP, Beban Operasional` (unduh template di Data Studio). Wajib: Tanggal + Pendapatan (atau Harga satuan + Qty). HPP membuka margin; Beban membuka laba operasional. Format `.xls` lama: simpan ulang sebagai `.xlsx`/`.csv`.

## Catatan
- File Excel diproses **di browser**; dataset terakhir disimpan di localStorage (jika < 4 MB).
- Proyeksi = regresi linear (rentang 80%), indikasi kasar. Anomali = robust z-score.
- `AI-Business-Operations-Agent/` (agen Python/Ollama eksperimen) tidak diubah.
