import { Link } from "react-router-dom";
import { Button, Card, EmptyState, PageHeader } from "../components/ui";
import Icon from "../components/ui/Icon";
import { Waterfall } from "../components/charts";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line } from "recharts";
import { Tip } from "../components/charts";
import { useData } from "../context/DataContext";
import { monthLabel } from "../lib/analytics";
import { pct, rp, short } from "../utils/format";

const ROWS = (A) => [
  ["Pendapatan", "revenue", "money", "font-semibold"],
  ...(A.hasCost ? [["Harga pokok penjualan (HPP)", "cost", "neg"], ["Laba kotor", "gross", "money", "font-semibold border-t border-border"], ["Margin kotor", "margin", "pct", "text-text-muted"]] : []),
  ...(A.hasExpense ? [["Beban operasional", "expense", "neg"], ["Laba operasional", "op", "money", "font-semibold border-t border-border"], ["Margin operasional", "opMargin", "pct", "text-text-muted"]] : []),
];

export default function IncomeStatement() {
  const { A, to } = useData();
  if (!A) return <EmptyState icon="∅" title="Belum ada data" description="Unggah data di Data Studio." action={<Link className="text-accent underline" to={to("/data")}>Buka Data Studio</Link>} />;
  const months = A.monthly.slice(-12), rows = ROWS(A);
  const cell = (r, t) => (t == null ? "—" : r[2] === "pct" ? pct(t) : r[2] === "neg" ? `(${rp(t)})` : rp(t));
  const tot = { ...A.totals, opMargin: A.totals.opMargin };
  const exportCsv = () => {
    const head = ["Pos", ...months.map((m) => m.label), "Total"], body = rows.map((r) => [r[0], ...months.map((m) => Math.round((m[r[1]] ?? 0) * 100) / 100), Math.round((tot[r[1]] ?? 0) * 100) / 100]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`\uFEFF${[head, ...body].map((l) => l.join(",")).join("\n")}`], { type: "text/csv" })); a.download = "laba-rugi.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  return <>
    <PageHeader title="Laba rugi" desc="Laporan laba rugi bulanan yang disusun otomatis dari data aktif." action={<Button variant="ghost" onClick={exportCsv}><Icon name="download" />Unduh CSV</Button>} />
    {!A.hasCost && <p className="reveal mb-5 rounded-xl border border-warning/30 bg-warning-bg px-4 py-2.5 text-xs text-warning">Data belum memiliki kolom HPP, sehingga hanya pendapatan yang dapat ditampilkan. <Link className="font-semibold underline" to={to("/data")}>Petakan kolom HPP →</Link></p>}
    <div className="space-y-5">
      {A.hasCost && <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Jembatan laba (seluruh periode)" className="reveal"><div className="p-4"><Waterfall totals={A.totals} hasExpense={A.hasExpense} /></div></Card>
        <Card title="Struktur biaya & laba per bulan" className="reveal xl:col-span-2"><div className="p-4"><ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={months.map((m) => ({ label: m.label, cost: m.cost, gross: m.gross, expense: A.hasExpense ? m.expense : undefined, margin: m.margin != null ? +m.margin.toFixed(1) : undefined }))} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" strokeDasharray="3 5" /><XAxis dataKey="label" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis yAxisId="l" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => short(v, "")} width={52} /><YAxis yAxisId="r" orientation="right" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
            <Tooltip cursor={{ fill: "var(--color-accent)", fillOpacity: 0.07 }} content={<Tip formats={{ margin: (v) => pct(v) }} />} />
            <Bar yAxisId="l" dataKey="cost" name="HPP" stackId="s" fill="var(--color-chart-5)" animationDuration={1300} />{A.hasExpense && <Bar yAxisId="l" dataKey="expense" name="Beban" stackId="s" fill="var(--color-chart-3)" animationDuration={1300} />}<Bar yAxisId="l" dataKey="gross" name="Laba kotor" stackId="s" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} animationDuration={1300} />
            <Line yAxisId="r" type="monotone" dataKey="margin" name="Margin" stroke="var(--color-chart-1)" strokeWidth={2.2} dot={false} animationDuration={1300} />
          </ComposedChart></ResponsiveContainer></div></Card>
      </div>}
      <Card title="Laporan laba rugi bulanan" className="reveal">
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm" aria-label="Laba rugi bulanan">
          <thead><tr className="border-b border-border"><th className="sticky left-0 z-10 bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Pos</th>{months.map((m) => <th key={m.month} className="whitespace-nowrap px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">{m.label}{m.partial ? "*" : ""}</th>)}<th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-accent">Total</th></tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={r[0]} className={`reveal transition-colors hover:bg-accent/[.06] ${r[3] ?? ""}`} style={{ "--i": ri }}>
            <td className="sticky left-0 whitespace-nowrap bg-surface-secondary px-5 py-2.5">{r[0]}</td>
            {months.map((m) => <td key={m.month} className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${r[2] === "neg" ? "text-negative" : ""} ${r[1] === "op" && m.op < 0 ? "text-negative" : ""}`}>{cell(r, m[r[1]])}</td>)}
            <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-accent">{cell(r, tot[r[1]])}</td></tr>)}</tbody>
        </table></div>
        <p className="border-t border-border/70 px-5 py-3 text-xs text-text-muted">* bulan berjalan (belum lengkap). Nilai dalam parentheses = pengurang. HPP mengikuti data sumber; laporan ini bukan pengganti laporan keuangan audit.</p>
      </Card>
    </div>
  </>;
}
