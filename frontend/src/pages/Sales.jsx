import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi, useForm } from "../hooks/useApi";
import { customerService, productService, salesService } from "../services/api";
import { Async, Button, Card, Field, FormModal, Input, PageHeader, Select, Table, Td, toast } from "../components/ui";
import { date, rp } from "../utils/format";

function SaleForm({ onClose, onDone }) {
  const lists = useApi(() => Promise.all([productService.list(), customerService.list()]));
  const [v, bind] = useForm({ quantity: 1 });
  const [products, customers] = lists.data ?? [[], []];
  const save = async () => {
    await salesService.create({ productId: Number(v.productId), customerId: Number(v.customerId), quantity: Number(v.quantity) });
    toast("Penjualan berhasil dicatat"); onDone();
  };
  return (
    <FormModal title="Catat penjualan" onClose={onClose} onSubmit={save} label="Simpan penjualan">
      <Field label="Produk"><Select required {...bind("productId")}><option value="">Pilih produk</option>{products.map((p) => <option key={p.id} value={p.id} disabled={p.stock < 1}>{p.name} — stok {p.stock}</option>)}</Select></Field>
      <Field label="Pelanggan"><Select required {...bind("customerId")}><option value="">Pilih pelanggan</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Jumlah"><Input type="number" min="1" step="1" required {...bind("quantity")} /></Field>
      <p className="text-xs leading-5 text-text-muted">Total dihitung oleh server dari harga produk dan stok diperbarui setelah transaksi berhasil.</p>
    </FormModal>
  );
}

export default function Sales() {
  const [searchParams] = useSearchParams();
  const [f, setF] = useState({ q: searchParams.get("q") ?? "", from: "", to: "" });
  useEffect(() => { setF((current) => ({ ...current, q: searchParams.get("q") ?? "" })); }, [searchParams]);
  const [open, setOpen] = useState(false);
  const api = useApi(() => salesService.list(f), [f.q, f.from, f.to]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <PageHeader title="Transaksi" desc="Penjualan yang sudah tercatat." action={<Button onClick={() => setOpen(true)}>Catat penjualan</Button>} />
      <Card>
        <div className="grid gap-2 p-4 sm:grid-cols-3">
          <Input placeholder="Cari produk atau pelanggan" aria-label="Cari produk atau pelanggan" value={f.q} onChange={set("q")} />
          <Input type="date" aria-label="Dari tanggal" value={f.from} onChange={set("from")} />
          <Input type="date" aria-label="Sampai tanggal" value={f.to} onChange={set("to")} />
        </div>
        <Async {...api} empty="Tidak ada transaksi pada rentang dan pencarian ini.">
          {(rows) => (
            <Table heads={["No.", "Produk", "Pelanggan", "Jumlah", "Total", "Tanggal"]} label="Daftar transaksi">
              {rows.map((s) => <tr key={s.id}><Td>{s.id}</Td><Td className="font-medium">{s.product_name}</Td><Td>{s.customer_name}</Td><Td>{s.quantity}</Td><Td>{rp(s.total)}</Td><Td>{date(s.sold_at)}</Td></tr>)}
            </Table>
          )}
        </Async>
      </Card>
      {open && <SaleForm onClose={() => setOpen(false)} onDone={api.reload} />}
    </>
  );
}
