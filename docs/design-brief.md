# AIRA Business — Deep Space / Daylight Lab

## Arah visual
Command center keuangan futuristik untuk enterprise. Dark-first ("Deep Space": #050912, aksen cyan #38D6FF → violet #8B6CFF) dengan tema terang ("Daylight Lab"). Permukaan glassmorphism (blur + border tipis), grid halus & aurora di latar, glow hanya pada aksi/aktif.

## Token
Semua warna adalah CSS variable di `src/index.css` (`--color-*`), berganti lewat class `.dark`. Warna status (positif/negatif/peringatan) selalu disertai ikon/label. Grafik memakai `--color-chart-1..6`.

## Tipografi
Sora (judul/angka KPI), Inter (isi), JetBrains Mono (kbd/kode). Angka memakai tabular figures.

## Motion
Count-up KPI, reveal berurutan (`.reveal --i`), spotlight mengikuti kursor pada kartu, animasi gambar grafik Recharts, gauge, heatmap bertahap, orb AI berputar, efek ketik pada jawaban AI, scroll-reveal di landing, marquee metrik. Semua dimatikan oleh `prefers-reduced-motion`.

## Integrasi
Dataset aktif (Excel / database / contoh) di `DataContext` menjadi satu-satunya sumber untuk dashboard, analisis, laba rugi, dan AI.
