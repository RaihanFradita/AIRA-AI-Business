import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi, useForm } from "../hooks/useApi";
import { customerService } from "../services/api";
import { Async, Button, Card, Field, FormModal, Input, Modal, PageHeader, Table, Td, confirmDelete, toast } from "../components/ui";
import { date, rp } from "../utils/format";

function CustomerForm({ item, onClose, onDone }) {
  const [v, bind] = useForm(item ?? {});
  const save = async () => {
    const body = { name: v.name, email: v.email || undefined, phone: v.phone || undefined };
    if (item) await customerService.update(item.id, body); else await customerService.create(body);
    toast(item ? "Pelanggan berhasil diperbarui" : "Pelanggan berhasil ditambahkan"); onDone();
  };
  return (
    <FormModal title={item ? "Ubah pelanggan" : "Tambah pelanggan"} onClose={onClose} onSubmit={save}>
      <Field label="Nama"><Input required {...bind("name")} /></Field>
      <Field label="Email"><Input type="email" {...bind("email")} /></Field>
      <Field label="Nomor telepon"><Input {...bind("phone")} /></Field>
    </FormModal>
  );
}

function Detail({ id, onClose }) {
  const api = useApi(() => customerService.get(id));
  return (
    <Modal title="Detail pelanggan" onClose={onClose}>
      <Async {...api}>
        {(c) => (
          <div className="space-y-4 text-sm">
            <div><div className="font-medium">{c.name}</div><div className="text-text-muted">{c.email ?? "—"} · {c.phone ?? "—"}</div></div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-xs text-text-muted">Transaksi</div><b>{c.total_orders}</b></div>
              <div><div className="text-xs text-text-muted">Total belanja</div><b>{rp(c.total_spending)}</b></div>
              <div><div className="text-xs text-text-muted">Pembelian terakhir</div><b>{date(c.last_purchase)}</b></div>
            </div>
            <ul className="max-h-60 divide-y divide-zinc-100 overflow-y-auto dark:divide-white/10">
              {c.history.length === 0 && <li className="py-3 text-text-muted">Belum ada pembelian.</li>}
              {c.history.map((h) => <li key={h.id} className="flex justify-between gap-2 py-2"><span className="truncate">{h.quantity}× {h.product_name}</span><span className="shrink-0 text-text-secondary">{rp(h.total)}</span></li>)}
            </ul>
          </div>
        )}
      </Async>
    </Modal>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [view, setView] = useState(null);
  const api = useApi(() => customerService.list({ q }), [q]);
  const remove = async (c) => {
    if (!confirmDelete(c.name)) return;
    try { await customerService.remove(c.id); toast("Customer deleted"); api.reload(); } catch (e) { toast(e.message, "err"); }
  };
  return (
    <>
      <PageHeader title="Pelanggan" desc="Kelola data dan riwayat pembelian pelanggan." action={<Button onClick={() => setModal({})}>Tambah pelanggan</Button>} />
      <Card>
        <div className="p-4"><Input aria-label="Cari pelanggan" placeholder="Cari nama atau email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Async {...api} empty="Pelanggan tidak ditemukan. Coba kata kunci lain.">
          {(rows) => (
            <Table heads={["Nama", "Email", "Telepon", "Transaksi", "Total belanja", "Aksi"]} label="Daftar pelanggan">
              {rows.map((c) => (
                <tr key={c.id}>
                  <Td><button className="font-medium underline-offset-2 hover:underline" onClick={() => setView(c.id)}>{c.name}</button></Td>
                  <Td>{c.email ?? "—"}</Td><Td>{c.phone ?? "—"}</Td><Td>{c.total_orders}</Td><Td>{rp(c.total_spending)}</Td>
                  <Td className="space-x-2 text-right"><Button variant="ghost" onClick={() => setModal({ item: c })}>Ubah</Button>{user.role === "admin" && <Button variant="danger" onClick={() => remove(c)}>Hapus</Button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Async>
      </Card>
      {modal && <CustomerForm item={modal.item} onClose={() => setModal(null)} onDone={api.reload} />}
      {view && <Detail id={view} onClose={() => setView(null)} />}
    </>
  );
}
