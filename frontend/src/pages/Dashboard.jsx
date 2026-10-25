import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, EmptyState, PageHeader } from "../components/ui";
import Icon from "../components/ui/Icon";
import { Donut, ForecastChart, Gauge, HBars, Heatmap, InsightCard, KpiCard, MarginArea, RevenueProfitChart, Waterfall, Columns } from "../components/charts";
import { useChat } from "../context/ChatContext";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { addDays, analyze, forecastData } from "../lib/analytics";
import { date, pct, short, signed } from "../utils/format";

const RANGES = [["all", "Semua", 0], ["12", "12 bln", 365], ["6", "6 bln", 183], ["3", "3 bln", 92], ["30", "30 hr", 30]];

export default function Dashboard() {
  const { language, locale, t } = useLanguage();
  const { rows, A: full, meta, to, loading } = useData();
  const { openDrawer } = useChat();
  const [range, setRange] = useState("all"), [gran, setGran] = useState("bulan");
  const A = useMemo(() => {
    if (!full) return null;
    const days = RANGES.find((r) => r[0] === range)[2];
    return days ? analyze(rows.filter((r) => r.date >= addDays(full.range.max, -(days - 1)))) ?? full : full;
  }, [rows, full, range]);

  if (loading && !A) return <div className="space-y-4" role="status"><div className="skeleton h-10 w-64" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32" />)}</div><div className="skeleton h-80" /></div>;
  if (!A) return <EmptyState icon="∅" title="Belum ada data keuangan" description="Unggah file Excel/CSV di Data Studio atau gunakan data contoh untuk melihat dashboard." action={<Link to={to("/data")} className="inline-flex h-9 items-center rounded-lg bg-brand-gradient px-4 text-sm font-medium text-accent-foreground">{t("Buka Data Studio")}</Link>} />;

  const T = A.totals, d = A.cmp?.delta ?? {}, win = A.cmp ? `${A.cmp.window} hr vs sblm` : "";
  const sp = (k) => A.monthly.slice(-12).map((m) => ({ v: m[k] ?? 0 }));
  const kpis = [
    { label: t("Pendapatan"), value: T.revenue, delta: d.revenue, hint: win, spark: sp("revenue"), icon: "chart" },
    A.hasCost && { label: t("Laba kotor"), value: T.gross, delta: d.gross, hint: win, spark: sp("gross"), icon: "bolt", color: "var(--color-chart-2)" },
    A.hasCost && { label: t("Margin kotor"), value: T.margin, format: (v) => pct(v), delta: d.margin, pp: true, hint: win, spark: A.monthly.slice(-12).map((m) => ({ v: m.margin ?? 0 })), icon: "target", color: "var(--color-chart-3)" },
    A.hasExpense && { label: t("Laba operasional"), value: T.op, delta: null, hint: `${t("Margin")} ${pct(T.opMargin)}`, spark: sp("op"), icon: "statement", color: "var(--color-chart-4)" },
    { label: t("Transaksi"), value: T.orders, format: (v) => v.toLocaleString(locale), delta: d.orders, hint: win, icon: "cart" },
    { label: t("Rata-rata transaksi"), value: T.aov, delta: d.aov, hint: win, icon: "tag", color: "var(--color-chart-6)" },
  ].filter(Boolean);

  const main = gran === "bulan"
    ? A.monthly.map((m) => ({ label: m.label, revenue: m.revenue, gross: A.hasCost ? m.gross : undefined, margin: m.margin != null ? +m.margin.toFixed(1) : undefined }))
    : A.daily.slice(-60).map((x) => ({ label: x.date.slice(5), revenue: x.revenue, gross: A.hasCost ? x.gross : undefined }));
  const topP = A.byProduct.slice(0, 7).map((p) => ({ name: p.name, revenue: p.revenue }));
  const fc = forecastData(A);
  const toggle = <div className="flex rounded-lg border border-border bg-surface-primary/50 p-0.5 text-xs">{["bulan", "hari"].map((g) => <button key={g} onClick={() => setGran(g)} className={`rounded-md px-2.5 py-1 capitalize transition-all ${gran === g ? "bg-brand-gradient font-semibold text-accent-foreground" : "text-text-secondary hover:text-text-primary"}`}>{t(g === "bulan" ? "Bulanan" : "Harian")}</button>)}</div>;

  return <>
    <PageHeader title="Command Center" desc={`${meta?.name ?? "Dataset"} · ${date(A.range.min)} – ${date(A.range.max)}`}
      action={<div className="flex rounded-xl border border-border bg-surface-secondary/50 p-1 text-xs" role="group" aria-label={t("Rentang data")}>{RANGES.map(([k, l]) => <button key={k} onClick={() => setRange(k)} aria-pressed={range === k} className={`rounded-lg px-3 py-1.5 transition-all ${range === k ? "bg-accent/15 font-semibold text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_40%,transparent)]" : "text-text-secondary hover:text-text-primary"}`}>{language === "en-US" ? ({ "12 bln": "12 mo", "6 bln": "6 mo", "3 bln": "3 mo", "30 hr": "30 days" }[l] ?? t(l)) : l}</button>)}</div>} />
    {meta?.source === "sample" && <div className="reveal mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning-bg px-4 py-2.5 text-xs text-warning"><Icon name="warn" />{t("Anda melihat")} <b>{t("data contoh")}</b>.{meta.note ? ` ${meta.note}` : ""} <Link to={to("/data")} className="ml-auto font-semibold underline">{t("Unggah data Anda →")}</Link></div>}
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">{kpis.map((k, i) => <KpiCard key={k.label} i={i} {...k} />)}</div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Pendapatan, laba kotor & margin" action={toggle} className="reveal xl:col-span-2" style={{ "--i": 3 }}><div className="p-4 pt-3"><RevenueProfitChart data={main} hasCost={A.hasCost} height={430} /></div></Card>
        <Card title="AI Insights" className="reveal" action={<button onClick={() => openDrawer("Ringkas kondisi keuangan saya")} className="flex items-center gap-1 text-xs text-accent hover:underline"><Icon name="sparkle" className="h-3.5 w-3.5" />{t("Tanya lebih lanjut")}</button>}>
          <div className="space-y-2.5 p-4">{A.insights.map((x, i) => <InsightCard key={x.title} i={i + 4} {...x} />)}</div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Pendapatan per kategori" className="reveal"><div className="p-5"><Donut data={A.byCategory.slice(0, 6).map((c) => ({ name: c.name, value: c.revenue }))} height={170} centerLabel="Total" /></div></Card>
        <Card title="Produk teratas" className="reveal"><div className="p-4 pr-2"><HBars data={topP} dataKey="revenue" height={250} /></div></Card>
        <Card title="Kesehatan margin" className="reveal lg:col-span-2 xl:col-span-1">
          <div className="p-5">{A.hasCost ? <><Gauge value={T.margin} label={t("Margin kotor")} sub={t("Margin kotor keseluruhan")} /><div className="mt-2"><MarginArea data={A.monthly.map((m) => ({ label: m.label, margin: m.margin != null ? +m.margin.toFixed(1) : null }))} avg={T.margin} height={110} /></div></> : <p className="py-10 text-center text-sm text-text-secondary">{t("Tambahkan kolom HPP untuk melihat margin.")}</p>}</div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card title={A.hasCost ? "Jembatan laba" : "Komposisi pendapatan"} className="reveal">{A.hasCost ? <div className="p-4"><Waterfall totals={T} hasExpense={A.hasExpense} /></div> : <div className="p-5"><Donut data={A.byChannel.length ? A.byChannel.map((c) => ({ name: c.name, value: c.revenue })) : A.byCategory.map((c) => ({ name: c.name, value: c.revenue }))} height={170} /></div>}</Card>
        <Card title="Pola per hari dalam seminggu" className="reveal"><div className="p-4"><Columns data={A.weekday} xKey="short" dataKey="avg" height={250} highlight={[...A.weekday].sort((a, b) => b.avg - a.avg)[0].short} /></div></Card>
        <Card title="Anomali terdeteksi" className="reveal lg:col-span-2 xl:col-span-1" action={<span className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary">{A.anomalies.length}</span>}>
          {A.anomalies.length ? <ul className="divide-y divide-border-subtle">{A.anomalies.map((a, i) => <li key={a.date} className="reveal flex items-center gap-3 px-5 py-3" style={{ "--i": i }}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.dir === "high" ? "bg-positive-bg text-positive" : "bg-negative-bg text-negative"}`}><Icon name={a.dir === "high" ? "up" : "down"} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{date(a.date)}</p><p className="text-xs text-text-muted">{t("normal")} {short(a.expected)}</p></div><div className="text-right"><p className="text-[13px] font-semibold tabular-nums">{short(a.revenue)}</p><p className={`text-xs ${a.dir === "high" ? "financial-positive" : "financial-negative"}`}>{signed(((a.revenue - a.expected) / a.expected) * 100, 0)}</p></div></li>)}</ul> : <p className="px-5 py-12 text-center text-sm text-text-secondary">Tidak ada lonjakan atau penurunan tak wajar. Pola penjualan konsisten ✓</p>}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Proyeksi pendapatan 3 bulan" className="reveal xl:col-span-2" action={A.forecast && <span className="text-xs text-text-muted">tren {signed(A.forecast.slopePct)}/bln · R² {A.forecast.r2.toFixed(2).replace(".", ",")}</span>}>
          <div className="p-4">{A.forecast ? <ForecastChart data={fc} height={270} /> : <p className="py-16 text-center text-sm text-text-secondary">Proyeksi memerlukan minimal 4 bulan data lengkap.</p>}</div>
        </Card>
        <Card title="Pelanggan teratas" className="reveal">{A.byCustomer.length ? <div className="p-4 pr-2"><HBars data={A.byCustomer.slice(0, 6).map((c) => ({ name: c.name, revenue: c.revenue }))} dataKey="revenue" color={3} height={250} /></div> : <p className="px-5 py-16 text-center text-sm text-text-secondary">Kolom Pelanggan belum dipetakan.</p>}</Card>
      </div>

      <Card title="Peta panas pendapatan harian (26 minggu)" className="reveal"><div className="p-5"><Heatmap daily={A.daily} /></div></Card>
    </div>
  </>;
}
