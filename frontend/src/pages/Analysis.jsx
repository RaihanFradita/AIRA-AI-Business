import { Card, EmptyState, PageHeader, Table, Td } from "../components/ui";
import { Donut, ForecastChart, HBars, ParetoChart, ProductMatrix } from "../components/charts";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { forecastData, monthName } from "../lib/analytics";
import { pct, rp, signed } from "../utils/format";

const Stat = ({ label, value, sub }) => <div className="rounded-xl bg-surface-primary/50 p-3.5"><p className="text-xs text-text-muted">{label}</p><p className="mt-0.5 font-display text-xl font-semibold tabular-nums">{value}</p>{sub && <p className="mt-0.5 text-[11px] text-text-secondary">{sub}</p>}</div>;

export default function Analysis() {
  const { A, to } = useData();
  if (!A) return <EmptyState icon="∅" title="Belum ada data" description="Unggah data di Data Studio." action={<Link className="text-accent underline" to={to("/data")}>Buka Data Studio</Link>} />;
  const n80 = A.pareto.findIndex((p) => p.cum >= 80) + 1, F = A.forecast;
  return <>
    <PageHeader title="Analisis mendalam" desc="Konsentrasi pendapatan, profitabilitas produk, tren bulanan, dan proyeksi." />
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Analisis Pareto produk" className="reveal xl:col-span-2"><div className="p-4"><ParetoChart data={A.pareto} /></div></Card>
        <Card title="Konsentrasi" className="reveal"><div className="grid gap-3 p-4">
          <Stat label="Porsi 20% produk teratas" value={pct(A.paretoTop20, 0)} sub={A.paretoTop20 >= 70 ? "Sangat terkonsentrasi" : "Relatif tersebar"} />
          <Stat label="Produk untuk capai 80% pendapatan" value={`${n80} dari ${A.byProduct.length}`} />
          <Stat label="Produk terbesar" value={pct(A.byProduct[0].share)} sub={A.byProduct[0].name} />
        </div></Card>
      </div>

      {A.hasCost && <Card title="Matriks produk: pendapatan × margin" className="reveal" action={<span className="text-xs text-text-muted">ukuran gelembung = kuantitas</span>}>
        <div className="p-4"><ProductMatrix products={A.byProduct} avgMargin={A.totals.margin} /><p className="mt-2 text-xs text-text-secondary"><span className="font-medium text-positive">Hijau</span> = margin di atas rata-rata ({pct(A.totals.margin)}), <span className="font-medium text-negative">merah</span> = di bawah. Produk merah di kanan (pendapatan besar) adalah kandidat utama penyesuaian harga.</p></div>
      </Card>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={A.byChannel.length ? "Pendapatan per channel" : "Pendapatan per kategori"} className="reveal"><div className="p-5"><Donut data={(A.byChannel.length ? A.byChannel : A.byCategory).map((c) => ({ name: c.name, value: c.revenue }))} height={190} /></div></Card>
        <Card title="Pelanggan teratas" className="reveal">{A.byCustomer.length ? <div className="p-4 pr-2"><HBars data={A.byCustomer.slice(0, 8).map((c) => ({ name: c.name, revenue: c.revenue }))} dataKey="revenue" color={3} /></div> : <p className="px-5 py-16 text-center text-sm text-text-secondary">Kolom Pelanggan belum dipetakan.</p>}</Card>
      </div>

      <Card title="Proyeksi 3 bulan" className="reveal">{F ? <div className="grid gap-4 p-4 xl:grid-cols-[1fr_320px]"><ForecastChart data={forecastData(A)} height={280} />
        <div className="space-y-2.5 text-xs">{F.points.map((p) => <div key={p.month} className="rounded-xl bg-surface-primary/50 p-3"><p className="font-medium">{monthName(p.month)}</p><p className="font-display text-base font-semibold tabular-nums">{rp(Math.round(p.value))}</p><p className="text-text-muted">rentang {rp(Math.round(p.low))} – {rp(Math.round(p.high))}</p></div>)}
          <p className="text-text-secondary">Regresi linear dari {F.basedOn} bulan lengkap · tren {signed(F.slopePct)}/bln · R² {F.r2.toFixed(2).replace(".", ",")}. Indikasi kasar, bukan jaminan.</p></div></div> : <p className="px-5 py-14 text-center text-sm text-text-secondary">Perlu minimal 4 bulan data lengkap.</p>}</Card>

      <Card title="Profitabilitas per produk" className="reveal">
        <Table label="Profitabilitas produk" heads={["Produk", "Pendapatan", "Qty", ...(A.hasCost ? ["Laba kotor", "Margin"] : []), "Porsi"]}>
          {A.byProduct.map((p) => <tr key={p.name}><Td className="max-w-[260px] truncate font-medium">{p.name}</Td><Td>{rp(p.revenue)}</Td><Td>{p.qty.toLocaleString("id-ID")}</Td>
            {A.hasCost && <><Td>{rp(p.gross)}</Td><Td><span className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, p.margin))}%`, background: p.margin >= A.totals.margin ? "var(--color-positive)" : "var(--color-negative)" }} /></span>{pct(p.margin)}</span></Td></>}
            <Td>{pct(p.share)}</Td></tr>)}
        </Table>
      </Card>

      <Card title="Pertumbuhan bulanan" className="reveal">
        <Table label="Pertumbuhan bulanan" heads={["Bulan", "Pendapatan", "MoM", ...(A.hasCost ? ["Laba kotor", "Margin"] : []), "Transaksi"]}>
          {[...A.monthly].reverse().map((m) => <tr key={m.month}><Td className="font-medium">{monthName(m.month)}{m.partial && <span className="ml-2 text-[10px] text-text-muted">(berjalan)</span>}</Td><Td>{rp(m.revenue)}</Td><Td className={m.mom == null ? "" : m.mom >= 0 ? "financial-positive" : "financial-negative"}>{m.mom == null ? "—" : signed(m.mom)}</Td>{A.hasCost && <><Td>{rp(m.gross)}</Td><Td>{pct(m.margin)}</Td></>}<Td>{m.orders.toLocaleString("id-ID")}</Td></tr>)}
        </Table>
      </Card>
    </div>
  </>;
}
