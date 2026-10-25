import { Link } from "react-router-dom";
import ChatPanel from "../components/ai/ChatPanel";
import { Card, PageHeader } from "../components/ui";
import Icon from "../components/ui/Icon";
import { useChat } from "../context/ChatContext";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { pct, short } from "../utils/format";

const GROUPS = [
  ["Ringkasan", ["Ringkas kondisi keuangan saya", "Apa insight terpenting minggu ini?"]],
  ["Pendapatan & margin", ["Pendapatan 30 hari terakhir", "Bagaimana margin bulan ini dibanding bulan lalu?", "Laba kotor Q1 2026"]],
  ["Produk & pelanggan", ["Produk mana yang paling menguntungkan?", "Produk dengan margin terendah", "Siapa pelanggan terbesar?"]],
  ["Prediksi & deteksi", ["Prediksi pendapatan 3 bulan ke depan", "Apakah ada anomali di penjualan?", "Hari apa paling ramai?"]],
  ["Aksi", ["Beri rekomendasi untuk menaikkan profit", "Analisis beban operasional"]],
];

export default function Assistant() {
  const { t, locale } = useLanguage();
  const { A, meta, to } = useData();
  const { send, busy, provider } = useChat();
  return <>
    <PageHeader title="AIRA Assistant" desc="Berikan perintah dalam bahasa natural — AIRA menghitung langsung dari data Anda dan menampilkan grafiknya." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="glass reveal grad-border h-[calc(100vh-13rem)] min-h-[520px] overflow-hidden rounded-[18px]"><ChatPanel /></div>
      <div className="space-y-5">
        <Card title="Data aktif" className="reveal" action={<Link to={to("/data")} className="text-xs text-accent hover:underline">Ganti</Link>}>
          <div className="space-y-2 p-4 text-xs">{A ? <>
            <p className="flex items-center gap-2 font-medium text-text-primary"><Icon name="file" className="h-4 w-4 text-accent" /><span className="truncate">{meta?.name}</span></p>
            <div className="grid grid-cols-2 gap-2">{[["Transaksi", A.rows.toLocaleString(locale)], ["Pendapatan", short(A.totals.revenue)], ["Margin", A.hasCost ? pct(A.totals.margin) : "—"], ["Periode", `${A.range.days} ${t("hari")}`]].map(([k, v]) => <div key={k} className="rounded-lg bg-surface-primary/50 p-2.5"><p className="text-text-muted">{t(k)}</p><p className="font-display text-sm font-semibold tabular-nums">{v}</p></div>)}</div>
          </> : <p className="text-text-secondary">{t("Belum ada data.")} <Link className="text-accent underline" to={to("/data")}>{t("Unggah Excel")}</Link></p>}
          <p className="pt-1 text-text-muted">{t("Mode: ")}{provider.provider === "none" ? t("mesin analisis lokal (tanpa kunci API)") : `${provider.provider} · ${provider.model}`}</p></div>
        </Card>
        <Card title="Contoh perintah" className="reveal">
          <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">{GROUPS.map(([g, qs]) => <div key={g}><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{t(g)}</p><div className="space-y-1">{qs.map((q) => <button key={q} disabled={busy || !A} onClick={() => send(language === "en-US" ? t(q) : q)} className="group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-xs text-text-secondary transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-text-primary disabled:opacity-40">{t(q)}<Icon name="arrow" className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" /></button>)}</div></div>)}</div>
        </Card>
      </div>
    </div>
  </>;
}
