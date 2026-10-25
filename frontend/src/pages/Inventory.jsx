import { useState } from "react";
import { useApi, useForm } from "../hooks/useApi";
import { inventoryService } from "../services/api";
import { Async, Badge, Button, Card, Field, FormModal, Input, PageHeader, Select, Table, Td, toast } from "../components/ui";
import { date } from "../utils/format";

function AdjustForm({ item, onClose, onDone }) {
  const [v, bind] = useForm({ type: "IN", quantity: "" });
  const save = async () => {
    await inventoryService.adjust({ productId: item.id, type: v.type, quantity: Number(v.quantity), note: v.note || undefined });
    toast("Persediaan berhasil diperbarui"); onDone();
  };
  return (
    <FormModal title={`Ubah stok · ${item.name}`} onClose={onClose} onSubmit={save}>
      <Field label="Jenis perubahan"><Select {...bind("type")}><option value="IN">Barang masuk (tambah)</option><option value="ADJUSTMENT">Penyesuaian (+/−)</option></Select></Field>
      <Field label={v.type === "IN" ? "Jumlah" : "Jumlah (negatif untuk mengurangi)"}><Input type="number" step="1" required {...bind("quantity")} /></Field>
      <Field label="Catatan"><Input maxLength={200} {...bind("note")} /></Field>
    </FormModal>
  );
}

export default function Inventory() {
  const [tab, setTab] = useState("stock");
  const [status, setStatus] = useState("");
  const [item, setItem] = useState(null);
  const stock = useApi(() => inventoryService.list({ status }), [status]);
  const logs = useApi(() => inventoryService.logs(), []);
  const reload = () => { stock.reload(); logs.reload(); };
  const tabBtn = (id, label) => <Button variant={tab === id ? "primary" : "ghost"} onClick={() => setTab(id)}>{label}</Button>;
  return (
    <>
      <PageHeader title="Persediaan" desc="Jumlah stok dan riwayat perubahannya." />
      <Card>
        <div className="flex flex-wrap items-center gap-2 p-4">
          {tabBtn("stock", "Stok")}{tabBtn("logs", "Riwayat")}
          {tab === "stock" && <div className="ml-auto w-full sm:w-44"><Select aria-label="Filter status stok" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua status</option><option value="In Stock">Tersedia</option><option value="Low Stock">Stok rendah</option><option value="Out of Stock">Habis</option></Select></div>}
        </div>
        {tab === "stock" ? (
          <Async {...stock} empty="Tidak ada produk yang sesuai dengan filter ini.">
            {(rows) => (
              <Table heads={["Produk", "Stok saat ini", "Status", "Pembaruan terakhir", "Aksi"]} label="Daftar persediaan">
                {rows.map((r) => <tr key={r.id}><Td className="font-medium">{r.name}</Td><Td>{r.stock}</Td><Td><Badge>{r.status === "In Stock" ? "Tersedia" : r.status === "Low Stock" ? "Stok rendah" : "Habis"}</Badge></Td><Td>{date(r.last_update)}</Td><Td className="text-right"><Button variant="ghost" onClick={() => setItem(r)}>Ubah stok</Button></Td></tr>)}
              </Table>
            )}
          </Async>
        ) : (
          <Async {...logs} empty="Belum ada aktivitas persediaan.">
            {(rows) => (
              <Table heads={["Tanggal", "Produk", "Jenis", "Jumlah", "Catatan"]} label="Riwayat perubahan stok">
                {rows.map((l) => <tr key={l.id}><Td>{date(l.created_at)}</Td><Td>{l.product_name}</Td><Td><Badge>{l.type === "IN" ? "Masuk" : l.type === "OUT" ? "Keluar" : "Penyesuaian"}</Badge></Td><Td>{l.quantity}</Td><Td className="text-text-muted">{l.note ?? "—"}</Td></tr>)}
              </Table>
            )}
          </Async>
        )}
      </Card>
      {item && <AdjustForm item={item} onClose={() => setItem(null)} onDone={reload} />}
    </>
  );
}
