import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi, useForm } from "../hooks/useApi";
import { productService } from "../services/api";
import { Async, Button, Card, Field, FormModal, Input, PageHeader, Select, Table, Td, confirmDelete, toast } from "../components/ui";
import { rp } from "../utils/format";

function ProductForm({ item, onClose, onDone }) {
  const [v, bind] = useForm(item ?? { stock: 0 });
  const save = async () => {
    const body = { name: v.name, sku: v.sku, category: v.category, price: Number(v.price), cost: Number(v.cost ?? 0) };
    if (item) await productService.update(item.id, body);
    else await productService.create({ ...body, stock: Number(v.stock) });
    toast(item ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan");
    onDone();
  };
  return (
    <FormModal title={item ? "Ubah produk" : "Tambah produk"} onClose={onClose} onSubmit={save}>
      <Field label="Nama produk"><Input required {...bind("name")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU"><Input required {...bind("sku")} /></Field>
        <Field label="Kategori"><Input required {...bind("category")} /></Field>
        <Field label="Harga jual (Rp)"><Input type="number" min="0" step="1" required {...bind("price")} /></Field>
        <Field label="HPP / modal (Rp)"><Input type="number" min="0" step="1" {...bind("cost")} /></Field>
        {!item && <Field label="Stok awal"><Input type="number" min="0" step="1" {...bind("stock")} /></Field>}
      </div>
    </FormModal>
  );
}

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const api = useApi(() => productService.list());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [modal, setModal] = useState(null); // {} = new, {item} = edit
  const cats = [...new Set((api.data ?? []).map((p) => p.category))].sort();
  const rows = (api.data ?? []).filter((p) => (!cat || p.category === cat) && `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));
  const remove = async (p) => {
    if (!confirmDelete(p.name)) return;
    try { await productService.remove(p.id); toast("Produk berhasil dihapus"); api.reload(); } catch (e) { toast(e.message, "err"); }
  };
  return (
    <>
      <PageHeader title="Produk" desc={isAdmin ? "Kelola katalog, harga, dan jumlah stok." : "Lihat katalog dan jumlah stok."} action={isAdmin && <Button onClick={() => setModal({})}>Tambah produk</Button>} />
      <Card>
        <div className="flex flex-col gap-2 p-4 sm:flex-row">
          <Input placeholder="Cari nama atau SKU" aria-label="Cari produk" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="sm:w-48"><Select aria-label="Filter kategori" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Semua kategori</option>{cats.map((c) => <option key={c}>{c}</option>)}</Select></div>
        </div>
        <Async {...api} data={api.data && rows} empty="Produk tidak ditemukan. Coba ubah kata kunci atau kategori.">
          {() => (
            <Table heads={["Nama", "SKU", "Kategori", "Harga", "HPP", "Margin", "Stok", "Aksi"]} label="Katalog produk">
              {rows.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">{p.name}</Td><Td>{p.sku}</Td><Td>{p.category}</Td><Td>{rp(p.price)}</Td><Td>{rp(p.cost ?? 0)}</Td><Td>{p.price && p.cost ? `${(((p.price - p.cost) / p.price) * 100).toFixed(1).replace(".", ",")}%` : "—"}</Td><Td>{p.stock}</Td>
                  <Td className="space-x-2 text-right">{isAdmin && <><Button variant="ghost" onClick={() => setModal({ item: p })}>Ubah</Button><Button variant="danger" onClick={() => remove(p)}>Hapus</Button></>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Async>
      </Card>
      {modal && <ProductForm item={modal.item} onClose={() => setModal(null)} onDone={api.reload} />}
    </>
  );
}
