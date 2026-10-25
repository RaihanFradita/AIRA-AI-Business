import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Donut, KpiCard, RevenueProfitChart } from "../components/charts";
import Icon from "../components/ui/Icon";
import { useScrollReveal } from "../hooks/useMotion";
import { useTheme } from "../hooks/useTheme";
import { analyze } from "../lib/analytics";
import { makeSample } from "../lib/sample";
import { Md } from "../components/ai/ChatPanel";
import { pct, short } from "../utils/format";

const FEATURES = [
  ["chat", "AI Assistant berbahasa Indonesia", "Tanya “margin bulan lalu?” atau “produk paling untung?” — jawaban, angka, dan grafik muncul seketika."],
  ["upload", "Impor Excel & CSV", "Unggah laporan penjualan Anda. Kolom dikenali otomatis, diproses di browser, tanpa setup rumit."],
  ["chart", "Dashboard keuangan real-time", "Pendapatan, laba kotor, margin, arus transaksi, dan kesehatan bisnis dalam satu layar."],
  ["target", "Proyeksi & deteksi anomali", "Prediksi 3 bulan ke depan dengan rentang keyakinan, plus peringatan lonjakan atau penurunan tak wajar."],
  ["statement", "Laba rugi otomatis", "Laporan bulanan dari pendapatan hingga laba operasional, siap diunduh sebagai CSV."],
  ["db", "Terhubung ke operasional", "Gabungkan dengan modul penjualan, stok, dan produk AIRA — HPP menghitung margin tiap transaksi."],
];
const STEPS = [["01", "Unggah data", "Excel atau CSV dari kasir, akuntansi, atau marketplace."], ["02", "Petakan kolom", "AIRA mendeteksi Tanggal, Pendapatan, HPP, Produk secara otomatis."], ["03", "Tanya & putuskan", "Dapatkan insight, grafik, dan rekomendasi tindakan."]];

export default function Landing() {
  const [theme, toggle] = useTheme();
  const root = useScrollReveal();
  const A = useMemo(() => analyze(makeSample(14)), []);
  const data = A.monthly.map((m) => ({ label: m.label, revenue: m.revenue, gross: m.gross, margin: +m.margin.toFixed(1) }));
  const md = A.cmp.delta.margin, cm = A.byCategory.filter((c) => c.margin != null).sort((a, b) => b.margin - a.margin), pp = (v) => `${Math.abs(v).toFixed(1).replace(".", ",")} poin`;
  const ticker = [["Pendapatan 30 hr", short(A.cmp.cur.revenue)], ["Margin kotor", pct(A.totals.margin)], ["Transaksi", A.totals.orders.toLocaleString("id-ID")], ["Produk", A.byProduct.length], ["Anomali terdeteksi", A.anomalies.length], ["Proyeksi bulan depan", short(A.forecast.points[0].value)]];

  return <div ref={root} className="relative min-h-screen overflow-x-hidden bg-surface-primary text-text-primary">
    <div className="app-bg" aria-hidden="true" />
    <header className="glass-strong sticky top-0 z-40 border-x-0 border-t-0"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
      <Link to="/" className="flex items-center gap-2.5" aria-label="AIRA Business"><span className="orb grid h-9 w-9 place-items-center rounded-xl p-[2px]"><span className="grid h-full w-full place-items-center rounded-[10px] bg-surface-secondary font-display text-sm font-bold text-gradient">A</span></span><span className="font-display font-semibold">AIRA <span className="font-normal text-text-muted">Business</span></span></Link>
      <nav className="flex items-center gap-2 text-sm"><a href="#fitur" className="hidden px-3 py-2 text-text-secondary transition-colors hover:text-text-primary sm:block">Fitur</a><a href="#cara-kerja" className="hidden px-3 py-2 text-text-secondary transition-colors hover:text-text-primary sm:block">Cara kerja</a>
        <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-xl border border-border text-text-secondary hover:border-accent/50" aria-label="Ganti tema"><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
        <Link to="/login" className="rounded-xl px-3 py-2 text-text-secondary hover:text-text-primary">Masuk</Link>
        <Link to="/demo" className="rounded-xl bg-brand-gradient px-4 py-2 font-semibold text-accent-foreground shadow-[0_0_24px_-8px_var(--color-glow)] transition-all hover:brightness-110">Coba demo</Link></nav>
    </div></header>

    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-16 lg:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="reveal inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary/50 px-3.5 py-1.5 text-xs text-text-secondary"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-positive text-positive" />Intelijen keuangan berbasis AI untuk perusahaan & UMKM</p>
        <h1 className="reveal mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl" style={{ "--i": 1 }}>Ubah laporan Excel jadi <span className="text-gradient">keputusan keuangan</span> dalam hitungan detik</h1>
        <p className="reveal mx-auto mt-5 max-w-2xl text-base leading-7 text-text-secondary" style={{ "--i": 2 }}>Unggah data penjualan, lihat revenue dan margin secara visual, lalu minta AI menjelaskan, memprediksi, dan merekomendasikan — semua dalam Bahasa Indonesia.</p>
        <div className="reveal mt-8 flex flex-wrap justify-center gap-3" style={{ "--i": 3 }}>
          <Link to="/demo" className="group inline-flex h-12 items-center gap-2 rounded-xl bg-brand-gradient px-6 font-semibold text-accent-foreground shadow-[0_0_36px_-8px_var(--color-glow)] transition-all hover:brightness-110 active:scale-[.98]">Lihat demo langsung<Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          <Link to="/register" className="glow-hover inline-flex h-12 items-center rounded-xl border border-border bg-surface-secondary/50 px-6 font-medium">Buat akun</Link>
        </div>
      </div>

      <div className="reveal relative mx-auto mt-14 max-w-5xl" style={{ "--i": 4 }}>
        <div className="absolute -inset-6 -z-10 rounded-[40px] bg-brand-gradient opacity-20 blur-3xl" />
        <div className="glass grad-border overflow-hidden rounded-[22px] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-1.5">{["#ff6b81", "#ffc24d", "#34e0a1"].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}<span className="ml-3 rounded-md bg-surface-primary/60 px-3 py-0.5 text-[11px] text-text-muted">aira.business/app — Command Center</span></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Pendapatan" value={A.totals.revenue} delta={A.cmp.delta.revenue} hint="30 hr vs sblm" icon="chart" spark={A.monthly.slice(-12).map((m) => ({ v: m.revenue }))} />
            <KpiCard i={1} label="Laba kotor" value={A.totals.gross} delta={A.cmp.delta.gross} hint="30 hr vs sblm" icon="bolt" color="var(--color-chart-2)" spark={A.monthly.slice(-12).map((m) => ({ v: m.gross }))} />
            <KpiCard i={2} label="Margin kotor" value={A.totals.margin} format={(v) => pct(v)} delta={A.cmp.delta.margin} pp hint="30 hr vs sblm" icon="target" color="var(--color-chart-3)" spark={A.monthly.slice(-12).map((m) => ({ v: m.margin }))} />
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-surface-primary/40 p-3 lg:col-span-2"><p className="mb-1 text-xs font-medium text-text-secondary">Pendapatan, laba kotor & margin</p><RevenueProfitChart data={data} hasCost height={230} /></div>
            <div className="rounded-2xl border border-border/80 bg-surface-primary/40 p-3"><p className="mb-2 text-xs font-medium text-text-secondary">Per kategori</p><Donut data={A.byCategory.map((c) => ({ name: c.name, value: c.revenue }))} height={120} /></div>
          </div>
        </div>
        <div className="glass float absolute -left-3 top-1/3 hidden rounded-2xl p-3 text-xs shadow-2xl lg:block"><p className={`flex items-center gap-1.5 font-semibold ${md >= 0 ? "text-positive" : "text-negative"}`}><Icon name={md >= 0 ? "up" : "down"} className="h-3.5 w-3.5" />{md >= 0 ? "Margin membaik" : "Margin menurun"}</p><p className="mt-0.5 text-text-secondary">{md >= 0 ? "+" : "−"}{pp(md)} vs 30 hari sebelumnya</p></div>
        <div className="glass float-slow absolute -right-3 bottom-16 hidden max-w-[220px] rounded-2xl p-3 text-xs shadow-2xl lg:block"><p className="flex items-center gap-1.5 font-semibold text-accent"><Icon name="sparkle" className="h-3.5 w-3.5" />AIRA</p><p className="mt-0.5 text-text-secondary">Proyeksi bulan depan {short(A.forecast.points[0].value)} (+{A.forecast.slopePct.toFixed(1).replace(".", ",")}%/bln)</p></div>
      </div>
    </section>

    <div className="relative z-10 overflow-hidden border-y border-border/70 bg-surface-secondary/30 py-4" aria-hidden="true"><div className="marquee">{[...ticker, ...ticker, ...ticker, ...ticker].map(([k, v], i) => <span key={i} className="mx-8 flex items-baseline gap-2 whitespace-nowrap text-sm"><span className="text-text-muted">{k}</span><b className="font-display tabular-nums text-accent">{v}</b><span className="text-border">◆</span></span>)}</div></div>

    <section id="fitur" className="relative z-10 mx-auto max-w-7xl px-5 py-24">
      <div data-reveal className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-accent">Fitur</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Semua yang dibutuhkan tim finance</h2></div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map(([icon, t, d], i) => <div key={t} data-reveal style={{ "--i": i % 3 }} className="glass spot glow-hover lift rounded-2xl p-6" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`); }}><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-accent-foreground glow-accent"><Icon name={icon} className="h-5 w-5" /></span><h3 className="mt-4 font-display text-base font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{d}</p></div>)}</div>
    </section>

    <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 lg:grid-cols-2">
      <div data-reveal><p className="text-xs font-semibold uppercase tracking-[.2em] text-accent">AI Chat</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Cukup beri perintah. AIRA yang menghitung.</h2><p className="mt-4 leading-7 text-text-secondary">Tidak perlu rumus pivot. Angka dihitung langsung dari data Anda, lalu dijelaskan dengan bahasa yang mudah dipahami — lengkap dengan grafik. Opsional: hubungkan ke Claude atau Ollama lokal untuk narasi yang lebih kaya.</p></div>
      <div data-reveal style={{ "--i": 1 }} className="glass grad-border rounded-[22px] p-5"><div className="space-y-3">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-gradient px-3.5 py-2 text-sm font-medium text-accent-foreground">Bagaimana margin 30 hari terakhir dibanding sebelumnya?</p>
        <div className="flex gap-2.5"><span className="orb grid h-7 w-7 shrink-0 place-items-center rounded-full p-[2px]"><span className="h-full w-full rounded-full bg-surface-secondary" /></span><div className="glass rounded-2xl rounded-tl-md px-3.5 py-2.5"><Md text={`Margin kotor **${pct(A.cmp.cur.margin)}**, ${md >= 0 ? "naik" : "turun"} **${pp(md)}** dibanding periode sebelumnya.\n\n- Tertinggi: **${cm[0].name}** (${pct(cm[0].margin)})\n- Terendah: **${cm.at(-1).name}** (${pct(cm.at(-1).margin)})\n- Aksi: tinjau harga & HPP kategori ${cm.at(-1).name}`} /></div></div>
      </div></div>
    </section>

    <section id="cara-kerja" className="relative z-10 mx-auto max-w-7xl px-5 pb-24"><div data-reveal className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-accent">Cara kerja</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Dari file ke insight dalam 3 langkah</h2></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{STEPS.map(([n, t, d], i) => <div key={n} data-reveal style={{ "--i": i }} className="glass rounded-2xl p-6"><span className="font-display text-4xl font-bold text-gradient">{n}</span><h3 className="mt-3 font-display font-semibold">{t}</h3><p className="mt-1.5 text-sm leading-6 text-text-secondary">{d}</p></div>)}</div></section>

    <section className="relative z-10 mx-auto max-w-5xl px-5 pb-24"><div data-reveal className="glass grad-border relative overflow-hidden rounded-[28px] px-6 py-14 text-center"><span className="scanline" /><h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">Siap melihat bisnis Anda dengan jernih?</h2><p className="relative mx-auto mt-3 max-w-xl text-text-secondary">Coba demo dengan data contoh — tanpa daftar, tanpa kartu kredit.</p><Link to="/demo" className="relative mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-gradient px-7 font-semibold text-accent-foreground shadow-[0_0_36px_-8px_var(--color-glow)] transition-all hover:brightness-110">Buka demo<Icon name="arrow" className="h-4 w-4" /></Link></div></section>
    <footer className="relative z-10 border-t border-border/70 py-8 text-center text-xs text-text-muted">© {new Date().getFullYear()} AIRA Business · Analitik keuangan bukan pengganti nasihat akuntan atau pajak profesional.</footer>
  </div>;
}
