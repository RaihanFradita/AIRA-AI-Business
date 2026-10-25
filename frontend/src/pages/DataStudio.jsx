import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, PageHeader, Select, toast } from "../components/ui";
import Icon from "../components/ui/Icon";
import { useData } from "../context/DataContext";
import { listSheets, readTable } from "../lib/excel";
import { FIELDS, TEMPLATE_CSV, buildRows, detectMapping, mappingIssue } from "../lib/schema";
import { date, pct, short } from "../utils/format";

function SourceCard({ active, icon, title, text, action, i }) {
  return <div className={`glass glow-hover reveal rounded-2xl p-4 ${active ? "border-accent/60 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent),0_16px_40px_-20px_var(--color-glow)]" : ""}`} style={{ "--i": i }}>
    <div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-brand-gradient text-accent-foreground" : "bg-surface-elevated text-text-secondary"}`}><Icon name={icon} /></span>
      <div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-sm font-semibold">{title}{active && <span className="rounded-md bg-positive-bg px-1.5 py-0.5 text-[10px] font-medium text-positive">Aktif</span>}</p><p className="mt-0.5 text-xs leading-5 text-text-secondary">{text}</p></div></div>
    {action && <div className="mt-3">{action}</div>}
  </div>;
}

export default function DataStudio() {
  const { mode, meta, A, rows, setExcel, useSample, loadDatabase, loading, error: dbError, to } = useData();
  const nav = useNavigate(), input = useRef(null);
  const [file, setFile] = useState(null), [sheets, setSheets] = useState([]), [sheet, setSheet] = useState(0);
  const [table, setTable] = useState(null), [mapping, setMapping] = useState(null), [perUnit, setPerUnit] = useState(false);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [drag, setDrag] = useState(false);

  const ingest = async (f, idx = 0) => {
    setBusy(true); setErr("");
    try {
      const names = idx === 0 ? await listSheets(f) : sheets;
      const t = await readTable(f, idx), d = detectMapping(t.headers, t.body);
      setFile(f); setSheets(names); setSheet(idx); setTable(t); setMapping(d.mapping); setPerUnit(d.costPerUnit);
    } catch (e) { setErr(e.message || "File tidak dapat dibaca."); setTable(null); }
    finally { setBusy(false); }
  };
  const onFile = (f) => { if (f) ingest(f, 0); };
  const built = useMemo(() => (table && mapping && !mappingIssue(mapping) ? buildRows(table.body, mapping, { costPerUnit: perUnit }) : null), [table, mapping, perUnit]);
  const issue = mapping ? mappingIssue(mapping) : null;
  const usable = built?.rows.length ?? 0;

  const apply = () => {
    setExcel(built.rows, { name: file.name, sheet: sheets[sheet], mapping });
    toast(`${usable.toLocaleString("id-ID")} baris berhasil diimpor`);
    nav(to(""));
  };
  const template = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`\uFEFF${TEMPLATE_CSV}`], { type: "text/csv" })); a.download = "template-aira.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  return <>
    <PageHeader title="Data Studio" desc="Hubungkan sumber data: unggah Excel/CSV, ambil dari database AIRA, atau pakai data contoh. AI & dashboard otomatis memakai data aktif." action={<Button variant="ghost" onClick={template}><Icon name="download" />Unduh template</Button>} />
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <SourceCard i={0} icon="upload" title="Excel / CSV" active={meta?.source === "excel"} text={meta?.source === "excel" ? `${meta.name}${meta.sheet ? ` · ${meta.sheet}` : ""}` : "Unggah file .xlsx atau .csv berisi transaksi penjualan."} />
        {mode === "app" && <SourceCard i={1} icon="db" title="Database AIRA" active={meta?.source === "database"} text="Penjualan, produk, dan HPP dari modul operasional." action={<Button variant="ghost" onClick={async () => { await loadDatabase(); toast("Data database dimuat"); }} disabled={loading}>{loading ? "Memuat…" : "Gunakan database"}</Button>} />}
        <SourceCard i={2} icon="sparkle" title="Data contoh" active={meta?.source === "sample"} text="18 bulan transaksi UMKM kopi & lifestyle untuk mencoba semua fitur." action={<Button variant="ghost" onClick={() => { useSample(); toast("Data contoh dimuat"); }}>Gunakan data contoh</Button>} />
      </div>
      {dbError && <p className="rounded-xl border border-negative/30 bg-negative-bg px-4 py-2.5 text-xs text-negative" role="alert">Database: {dbError}</p>}

      <Card title="1 · Unggah file" className="reveal">
        <div className="p-5">
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }} onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()} aria-label="Pilih atau jatuhkan file Excel"
            className={`group relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${drag ? "scale-[1.01] border-accent bg-accent/10" : "border-border hover:border-accent/60 hover:bg-accent/5"}`}>
            <span className="scanline" />
            <div className="relative"><span className="float mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-accent-foreground glow-accent"><Icon name="upload" className="h-6 w-6" /></span>
              <p className="mt-4 font-display text-base font-semibold">{busy ? "Membaca file…" : file ? file.name : "Jatuhkan file di sini, atau klik untuk memilih"}</p>
              <p className="mt-1 text-xs text-text-secondary">.xlsx atau .csv · maks 12 MB · diproses di browser Anda, tidak diunggah ke server</p></div>
            <input ref={input} type="file" accept=".xlsx,.csv,.txt" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {err && <p className="mt-3 rounded-xl border border-negative/30 bg-negative-bg px-4 py-2.5 text-xs text-negative" role="alert">{err}</p>}
        </div>
      </Card>

      {table && mapping && <Card title="2 · Petakan kolom" className="reveal" action={sheets.length > 1 && <label className="flex items-center gap-2 text-xs text-text-secondary">Sheet<Select className="h-8 w-40" value={sheet} onChange={(e) => ingest(file, +e.target.value)}>{sheets.map((s, i) => <option key={s} value={i}>{s}</option>)}</Select></label>}>
        <div className="p-5">
          <p className="mb-4 text-xs text-text-secondary">Kolom dikenali otomatis dari header ({table.headers.length} kolom, {table.body.length.toLocaleString("id-ID")} baris). Periksa dan ubah bila perlu.</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{FIELDS.map((f, i) => <label key={f.key} className="reveal block space-y-1.5" style={{ "--i": i }}>
            <span className="flex items-center justify-between text-xs font-medium text-text-secondary"><span>{f.label}{f.required && <span className="text-negative"> *</span>}</span>{mapping[f.key] >= 0 && <Icon name="check" className="h-3.5 w-3.5 text-positive" />}</span>
            <Select value={mapping[f.key]} onChange={(e) => setMapping({ ...mapping, [f.key]: +e.target.value })}><option value={-1}>— tidak ada —</option>{table.headers.map((h, ci) => <option key={ci} value={ci}>{h}</option>)}</Select>
            <span className="block text-[11px] text-text-muted">{f.hint}</span></label>)}</div>
          {mapping.cost >= 0 && <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={perUnit} onChange={(e) => setPerUnit(e.target.checked)} className="accent-[var(--color-accent)]" />HPP adalah <b className="text-text-primary">per unit</b> (kalikan dengan Kuantitas)</label>}
          {issue && <p className="mt-4 rounded-xl border border-warning/30 bg-warning-bg px-4 py-2.5 text-xs text-warning" role="alert">{issue}</p>}
        </div>
      </Card>}

      {built && <Card title="3 · Pratinjau & impor" className="reveal">
        <div className="p-5">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-positive-bg px-2.5 py-1 font-medium text-positive">{usable.toLocaleString("id-ID")} baris valid</span>
            {built.skipped.noDate > 0 && <span className="rounded-lg bg-warning-bg px-2.5 py-1 text-warning">{built.skipped.noDate.toLocaleString("id-ID")} dilewati: tanggal tidak terbaca</span>}
            {built.skipped.noAmount > 0 && <span className="rounded-lg bg-warning-bg px-2.5 py-1 text-warning">{built.skipped.noAmount.toLocaleString("id-ID")} dilewati: nominal tidak terbaca</span>}
            {mapping.cost < 0 && <span className="rounded-lg bg-accent-subtle px-2.5 py-1 text-accent">Tanpa HPP: margin tidak tersedia</span>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-xs"><thead className="bg-surface-elevated/60"><tr>{["Tanggal", "Produk", "Kategori", "Pelanggan", "Qty", "Pendapatan", "HPP", "Beban"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>)}</tr></thead>
            <tbody>{built.rows.slice(0, 6).map((r, i) => <tr key={i} className="border-t border-border-subtle"><td className="px-3 py-2 tabular-nums">{r.date}</td><td className="max-w-[180px] truncate px-3 py-2">{r.product}</td><td className="px-3 py-2">{r.category}</td><td className="max-w-[140px] truncate px-3 py-2">{r.customer}</td><td className="px-3 py-2 tabular-nums">{r.qty}</td><td className="px-3 py-2 tabular-nums">{short(r.revenue)}</td><td className="px-3 py-2 tabular-nums">{short(r.cost)}</td><td className="px-3 py-2 tabular-nums">{short(r.expense)}</td></tr>)}</tbody></table></div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setTable(null); setFile(null); }}>Batal</Button>
            <Button onClick={apply} disabled={!usable}><Icon name="check" />Gunakan dataset ({usable.toLocaleString("id-ID")} baris)</Button>
          </div>
        </div>
      </Card>}

      {A && <Card title="Kualitas dataset aktif" className="reveal">
        <div className="grid gap-3 p-5 text-xs sm:grid-cols-2 xl:grid-cols-4">
          {[["Transaksi", A.rows.toLocaleString("id-ID"), true], ["Periode", `${date(A.range.min)} – ${date(A.range.max)}`, A.range.days >= 120], ["HPP / margin", A.hasCost ? `Tersedia · ${pct(A.totals.margin)}` : "Belum ada kolom HPP", A.hasCost], ["Beban operasional", A.hasExpense ? "Tersedia" : "Belum ada (opsional)", A.hasExpense], ["Pelanggan", A.byCustomer.length ? `${A.byCustomer.length} unik` : "Belum dipetakan", A.byCustomer.length > 0], ["Kategori", `${A.byCategory.length} kategori`, A.byCategory.length > 1], ["Produk", `${A.byProduct.length} item`, true], ["Proyeksi", A.forecast ? "Siap (≥4 bulan)" : "Perlu ≥4 bulan data", !!A.forecast]].map(([k, v, ok]) => <div key={k} className="flex items-center gap-3 rounded-xl bg-surface-primary/50 p-3"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${ok ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"}`}><Icon name={ok ? "check" : "warn"} className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="text-text-muted">{k}</p><p className="truncate font-medium text-text-primary">{v}</p></div></div>)}
        </div>
        <p className="border-t border-border/70 px-5 py-3 text-xs text-text-secondary">Siap bertanya? <Link to={to("/assistant")} className="font-medium text-accent hover:underline">Buka AI Assistant →</Link></p>
      </Card>}
    </div>
  </>;
}
