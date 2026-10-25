import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { reportService } from "../services/api";
import { Async, Button, Card, Field, Input, PageHeader, Select, Table, Td } from "../components/ui";
import { date, rp } from "../utils/format";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const monthStart = () => `${today().slice(0, 8)}01`;
const titles = { sales: "Laporan penjualan", inventory: "Laporan persediaan", customers: "Laporan pelanggan", monthly: "Ringkasan bulanan" };
const metrics = {
  sales: [["Total penjualan", "sales", rp], ["Transaksi", "transactions", Number], ["Unit terjual", "items_sold", Number], ["Pelanggan", "customers", Number]],
  inventory: [["Produk", "products", Number], ["Unit dalam stok", "units_in_stock", Number], ["Stok rendah", "low_stock", Number], ["Nilai stok", "stock_value", rp]],
  customers: [["Pelanggan", "customers", Number], ["Pelanggan baru", "new_customers", Number], ["Pelanggan bertransaksi", "purchasing_customers", Number], ["Penjualan dalam periode", "sales", rp]],
  monthly: [["Total penjualan", "sales", rp], ["Transaksi", "transactions", Number], ["Unit terjual", "items_sold", Number], ["Pelanggan", "customers", Number]],
};
const columns = {
  sales: [["id", "No. transaksi"], ["sold_at", "Tanggal"], ["product", "Produk"], ["sku", "SKU"], ["customer", "Pelanggan"], ["quantity", "Unit"], ["sales", "Penjualan"], ["sold_by", "Dicatat oleh"]],
  inventory: [["product", "Produk"], ["sku", "SKU"], ["category", "Kategori"], ["price", "Harga satuan"], ["stock", "Unit dalam stok"], ["status", "Status"], ["stock_value", "Nilai stok"]],
  customers: [["name", "Pelanggan"], ["email", "Email"], ["phone", "Telepon"], ["created_at", "Terdaftar"], ["transactions", "Transaksi"], ["sales", "Penjualan"]],
  monthly: [["month", "Bulan"], ["sales", "Penjualan"], ["transactions", "Transaksi"], ["items_sold", "Unit terjual"], ["customers", "Pelanggan"]],
};
const moneyKeys = new Set(["sales", "price", "stock_value"]);
const dateKeys = new Set(["sold_at", "created_at", "month"]);

function cell(key, value) {
  if (value == null) return "";
  if (moneyKeys.has(key)) return rp(value);
  if (dateKeys.has(key)) return date(value);
  return String(value);
}
function exportExcel(type, rows) {
  const cols = columns[type];
  const xml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const makeRow = (values) => `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`).join("")}</Row>`;
  const table = [makeRow(cols.map(([, label]) => label)), ...rows.map((row) => makeRow(cols.map(([key]) => cell(key, row[key]))))].join("");
  const content = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${titles[type]}"><Table>${table}</Table></Worksheet></Workbook>`;
  const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aira-${type}-laporan-${today()}.xls`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Reports() {
  const [filters, setFilters] = useState({ type: "sales", from: monthStart(), to: today() });
  const api = useApi(() => reportService.get(filters.type, { from: filters.from, to: filters.to }), [filters.type, filters.from, filters.to]);
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  return <>
    <PageHeader title="Laporan" desc="Tinjau dan ekspor laporan operasional berdasarkan tanggal." action={<Button variant="ghost" disabled={!api.data?.rows?.length} onClick={() => exportExcel(filters.type, api.data.rows)}>Ekspor Excel</Button>} />
    <Card className="mb-4 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Jenis laporan"><Select value={filters.type} onChange={update("type")}>{Object.entries(titles).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</Select></Field>
        <Field label="Dari tanggal"><Input type="date" value={filters.from} onChange={update("from")} /></Field>
        <Field label="Sampai tanggal"><Input type="date" value={filters.to} onChange={update("to")} /></Field>
      </div>
    </Card>
    <Async {...api} empty="Tidak ada baris laporan pada periode ini.">
      {(report) => <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics[filters.type].map(([label, key, format]) => <Card key={key} className="p-4"><div className="text-xs text-text-secondary">{label}</div><div className="mt-1 text-xl font-semibold tabular-nums">{format(report.summary[key] ?? 0).toLocaleString?.("id-ID") ?? format(report.summary[key] ?? 0)}</div></Card>)}
        </div>
        <Card title={titles[filters.type]}>
          <Table heads={columns[filters.type].map(([, label]) => label)} label={titles[filters.type]}>
            {report.rows.map((row, i) => <tr key={row.id ?? i}>{columns[filters.type].map(([key]) => <Td key={key}>{cell(key, row[key])}</Td>)}</tr>)}
          </Table>
          {filters.type === "sales" && report.rows.length === 5000 && <p className="px-4 py-3 text-xs text-warning">Menampilkan 5.000 transaksi terbaru. Total ringkasan menghitung seluruh periode.</p>}
        </Card>
      </div>}
    </Async>
  </>;
}
