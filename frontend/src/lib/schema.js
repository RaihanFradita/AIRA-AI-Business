/** Column detection + normalisation for uploaded finance sheets (Indonesian & English headers). */

export const FIELDS = [
  { key: "date", label: "Tanggal", type: "date", required: true, hint: "Tanggal transaksi", aliases: ["tanggal", "tgl", "date", "waktu", "periode", "tanggaltransaksi", "transactiondate", "invoicedate", "tanggalfaktur", "bulan"] },
  { key: "revenue", label: "Pendapatan", type: "number", required: true, hint: "Total penjualan per baris", aliases: ["pendapatan", "revenue", "penjualan", "omzet", "sales", "totalpenjualan", "totalharga", "total", "amount", "nilai", "subtotal", "grandtotal", "income", "jumlahharga", "jumlahrp", "nilaipenjualan"], avoid: ["hpp", "cogs", "modal", "biaya", "cost", "beban", "qty", "satuan"] },
  { key: "cost", label: "HPP / Biaya pokok", type: "number", hint: "Untuk menghitung margin", aliases: ["hpp", "cogs", "costofgoods", "costofgoodssold", "biayapokok", "modal", "cost", "hargapokok", "hargamodal", "biayabarang", "totalhpp"] },
  { key: "qty", label: "Kuantitas", type: "number", hint: "Jumlah unit terjual", aliases: ["qty", "quantity", "jumlah", "kuantitas", "unit", "units", "terjual", "jml", "banyaknya"] },
  { key: "product", label: "Produk", type: "text", hint: "Nama produk / layanan", aliases: ["produk", "product", "item", "barang", "namabarang", "namaproduk", "layanan", "sku", "deskripsi", "description"] },
  { key: "category", label: "Kategori", type: "text", hint: "Kelompok produk", aliases: ["kategori", "category", "jenis", "kelompok", "group", "segmen", "tipe"] },
  { key: "customer", label: "Pelanggan", type: "text", hint: "Nama pelanggan", aliases: ["pelanggan", "customer", "klien", "client", "pembeli", "konsumen"] },
  { key: "channel", label: "Channel / Cabang", type: "text", hint: "Saluran atau lokasi penjualan", aliases: ["channel", "saluran", "cabang", "wilayah", "region", "outlet", "toko", "kota", "platform"] },
  { key: "expense", label: "Beban operasional", type: "number", hint: "Opsional, untuk laba operasional", aliases: ["beban", "opex", "biayaoperasional", "expense", "expenses", "pengeluaran", "operatingexpense", "biaya", "bebanoperasional"] },
  { key: "price", label: "Harga satuan", type: "number", hint: "Dipakai bila Pendapatan kosong", aliases: ["harga", "price", "hargasatuan", "unitprice", "hargajual"] },
];

const MONTHS = { jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3, mei: 4, may: 4, jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agt: 7, agustus: 7, aug: 7, sep: 8, sept: 8, september: 8, okt: 9, oktober: 9, oct: 9, nov: 10, november: 10, des: 11, desember: 11, dec: 11 };

const norm = (h) => String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const pad = (n) => String(n).padStart(2, "0");
const validYMD = (y, m, d) => y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

export function parseNumber(v) {
  if (v == null || v === "") return NaN;
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  let s = String(v).trim();
  if (!s) return NaN;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  s = s.replace(/rp\.?|idr|usd|\$|\s/gi, "");
  if (s.startsWith("-") || s.startsWith("−")) { neg = !neg; s = s.slice(1); }
  if (!/^[\d.,]+$/.test(s)) return NaN;
  const dots = (s.match(/\./g) || []).length, commas = (s.match(/,/g) || []).length;
  if (dots && commas) {
    const dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    s = dec === "." ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  } else if (dots > 1 || (dots === 1 && /^\d{1,3}\.\d{3}$/.test(s))) s = s.replace(/\./g, "");
  else if (commas > 1 || (commas === 1 && /^\d{1,3},\d{3}$/.test(s))) s = s.replace(/,/g, "");
  else if (commas === 1) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : NaN;
}

/** Returns "YYYY-MM-DD" or null. Date objects from Excel are UTC midnight → use UTC getters. */
export function parseDate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  if (typeof v === "number") {
    if (v < 20000 || v > 70000) return null; // Excel serial (≈1954–2091)
    return parseDate(new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000));
  }
  const s = String(v).trim().toLowerCase();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m && validYMD(+m[1], +m[2], +m[3])) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/); // day-first (Indonesia); swap if impossible
  if (m) {
    let [d, mo, y] = [+m[1], +m[2], +m[3]];
    if (y < 100) y += 2000;
    if (mo > 12 && d <= 12) [d, mo] = [mo, d];
    if (validYMD(y, mo, d)) return `${y}-${pad(mo)}-${pad(d)}`;
  }
  m = s.match(/^(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{2,4})/);
  if (m && MONTHS[m[2]] != null) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; if (validYMD(y, MONTHS[m[2]] + 1, +m[1])) return `${y}-${pad(MONTHS[m[2]] + 1)}-${pad(+m[1])}`; }
  m = s.match(/^([a-z]{3,9})[\s\-/.]+(\d{2,4})$/); // "Mar 2026" / "Mar-26" → first of month
  if (m && MONTHS[m[1]] != null) { const y = +m[2] < 100 ? 2000 + +m[2] : +m[2]; return `${y}-${pad(MONTHS[m[1]] + 1)}-01`; }
  return null;
}

const nonEmpty = (vals) => vals.filter((x) => x != null && String(x).trim() !== "");
function typeScore(type, vals) {
  const v = nonEmpty(vals);
  if (!v.length) return 0;
  const ok = v.filter((x) => (type === "date" ? parseDate(x) != null : !Number.isNaN(parseNumber(x)))).length / v.length;
  if (type === "date") return ok;
  if (type === "number") return ok;
  return 1 - ok * 0.9; // text columns should not be mostly numeric
}

export function detectMapping(headers, body) {
  const sample = body.slice(0, 80);
  const cands = [];
  headers.forEach((h, i) => {
    const n = norm(h);
    if (!n) return;
    const col = sample.map((r) => r[i]);
    for (const f of FIELDS) {
      if (f.avoid?.some((a) => n.includes(a))) continue;
      let s = 0;
      for (const a of f.aliases) {
        if (n === a) s = Math.max(s, 3);
        else if (n.startsWith(a) || (a.startsWith(n) && n.length >= 3)) s = Math.max(s, 2);
        else if (a.length >= 3 && n.includes(a)) s = Math.max(s, 1);
      }
      if (!s) continue;
      const t = typeScore(f.type, col);
      if (t < 0.6) continue;
      cands.push({ key: f.key, i, score: s + t });
    }
  });
  cands.sort((a, b) => b.score - a.score);
  const mapping = Object.fromEntries(FIELDS.map((f) => [f.key, -1]));
  const used = new Set();
  for (const c of cands) if (mapping[c.key] < 0 && !used.has(c.i)) { mapping[c.key] = c.i; used.add(c.i); }
  const perUnit = (k) => mapping[k] >= 0 && /satuan|unit|per ?(pcs|item)|each/i.test(String(headers[mapping[k]]));
  return { mapping, costPerUnit: perUnit("cost") };
}

export const mappingIssue = (m) => {
  if (m.date < 0) return "Kolom Tanggal belum dipilih.";
  if (m.revenue < 0 && !(m.price >= 0 && m.qty >= 0)) return "Pilih kolom Pendapatan, atau kolom Harga satuan + Kuantitas.";
  return null;
};

/** Normalise raw rows → [{date, product, category, customer, channel, qty, revenue, cost, expense}] */
export function buildRows(body, mapping, { costPerUnit = false } = {}) {
  const get = (r, k) => (mapping[k] >= 0 ? r[mapping[k]] : undefined);
  const text = (v, d) => { const s = v == null ? "" : String(v).trim(); return s ? s.slice(0, 80) : d; };
  const rows = []; const skipped = { noDate: 0, noAmount: 0, empty: 0 };
  for (const r of body) {
    if (!r || !nonEmpty(r).length) { skipped.empty++; continue; }
    const date = parseDate(get(r, "date"));
    if (!date) { skipped.noDate++; continue; }
    let qty = parseNumber(get(r, "qty")); if (!Number.isFinite(qty) || qty <= 0) qty = 1;
    let revenue = parseNumber(get(r, "revenue"));
    if (!Number.isFinite(revenue) && mapping.price >= 0) revenue = parseNumber(get(r, "price")) * qty;
    if (!Number.isFinite(revenue)) { skipped.noAmount++; continue; }
    let cost = parseNumber(get(r, "cost")); cost = Number.isFinite(cost) ? (costPerUnit ? cost * qty : cost) : 0;
    const expense = parseNumber(get(r, "expense"));
    rows.push({
      date, qty, revenue, cost, expense: Number.isFinite(expense) ? expense : 0,
      product: text(get(r, "product"), "Tanpa nama"), category: text(get(r, "category"), "Tidak dikategorikan"),
      customer: text(get(r, "customer"), "—"), channel: text(get(r, "channel"), "—"),
    });
  }
  return { rows, skipped };
}

export const TEMPLATE_CSV = [
  "Tanggal,Produk,Kategori,Pelanggan,Channel,Qty,Pendapatan,HPP,Beban Operasional",
  "2026-01-03,Kopi Arabika 250g,Kopi,PT Maju Jaya,Online,12,1020000,530000,90000",
  "2026-01-03,Teh Melati 100g,Minuman,Toko Sumber Rezeki,Toko,30,1140000,684000,95000",
  "2026-01-04,Grinder Manual,Peralatan,CV Bintang,Marketplace,2,900000,700000,70000",
].join("\n");
