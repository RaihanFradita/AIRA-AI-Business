/**
 * Local analysis engine: understands Indonesian/English finance questions, computes the answer from the
 * dataset (deterministic — numbers never come from a language model) and returns text + visual blocks.
 * When a cloud/local LLM is connected, this result is passed to it as grounded facts for richer narration.
 */
import { analyze, addDays, filterRows, monthName, monthLabel } from "./analytics";
import { short, pct, signed } from "../utils/format";

const MONTH_IDX = { januari: 1, jan: 1, februari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4, mei: 5, juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, agt: 8, september: 9, sep: 9, oktober: 10, okt: 10, november: 11, nov: 11, desember: 12, des: 12 };
const pad = (n) => String(n).padStart(2, "0");
const lastDom = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const SUGGESTIONS = [
  "Ringkas kondisi keuangan saya",
  "Bagaimana margin bulan ini dibanding bulan lalu?",
  "Produk mana yang paling menguntungkan?",
  "Prediksi pendapatan 3 bulan ke depan",
  "Apakah ada anomali di penjualan?",
  "Beri rekomendasi untuk menaikkan profit",
];

export function parsePeriod(q, range) {
  const max = range.max, y = +max.slice(0, 4), m = +max.slice(5, 7), mk = (yy, mm) => ({ from: `${yy}-${pad(mm)}-01`, to: `${yy}-${pad(mm)}-${pad(lastDom(yy, mm))}` });
  let r = null;
  const nd = q.match(/(\d{1,3})\s*(hari|day|minggu|week|bulan|month)/);
  if (nd) { const days = +nd[1] * (/hari|day/.test(nd[2]) ? 1 : /minggu|week/.test(nd[2]) ? 7 : 30); r = { from: addDays(max, -(days - 1)), to: max, label: `${nd[1]} ${nd[2]} terakhir` }; }
  else if (/bulan ini|this month/.test(q)) r = { ...mk(y, m), to: max, label: `bulan ini (${monthName(`${y}-${pad(m)}`)})` };
  else if (/bulan lalu|bulan kemarin|last month/.test(q)) { const [yy, mm] = m === 1 ? [y - 1, 12] : [y, m - 1]; r = { ...mk(yy, mm), label: monthName(`${yy}-${pad(mm)}`) }; }
  else if (/minggu ini|this week/.test(q)) r = { from: addDays(max, -6), to: max, label: "7 hari terakhir" };
  else if (/minggu lalu|last week/.test(q)) r = { from: addDays(max, -13), to: addDays(max, -7), label: "minggu lalu" };
  else if (/hari ini|today/.test(q)) r = { from: max, to: max, label: `hari terakhir data (${max})` };
  else if (/kemarin|yesterday/.test(q)) r = { from: addDays(max, -1), to: addDays(max, -1), label: "kemarin" };
  else {
    const qq = q.match(/\b(?:kuartal|quarter|q)\s*([1-4])\b(?:\s*(20\d\d))?/);
    const mn = q.match(/\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|agt|sep|okt|nov|des)\b(?:\s*(20\d\d))?/);
    if (qq) { const yy = +(qq[2] ?? y), s = (+qq[1] - 1) * 3 + 1; r = { from: `${yy}-${pad(s)}-01`, to: `${yy}-${pad(s + 2)}-${pad(lastDom(yy, s + 2))}`, label: `Q${qq[1]} ${yy}` }; }
    else if (mn) { const mm = MONTH_IDX[mn[1]]; const yy = +(mn[2] ?? (mm <= m ? y : y - 1)); r = { ...mk(yy, mm), label: monthName(`${yy}-${pad(mm)}`) }; }
    else if (/tahun ini|ytd|this year/.test(q)) r = { from: `${y}-01-01`, to: max, label: `tahun ${y} (YTD)` };
    else if (/tahun lalu|last year/.test(q)) r = { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, label: `tahun ${y - 1}` };
  }
  return r;
}

const INTENTS = [
  ["help", /bantuan|help|bisa apa|fitur|apa saja yang bisa/],
  ["greet", /^\s*(halo|hai|hi|hello|selamat|pagi|siang|sore|malam|terima kasih|makasih|thanks)\b/],
  ["promotion", /diskon|discount|promo|promosi/],
  ["forecast", /prediksi|proyeksi|forecast|ramal|bulan depan|ke depan|kedepan|akan datang|target/],
  ["anomaly", /anomali|aneh|janggal|lonjakan|outlier|tidak wajar|turun tajam|mencurigakan|fraud/],
  ["recommend", /saran|rekomendasi|recommend|strategi|apa yang harus|tingkatkan|meningkatkan|menaikkan|naikkan|optimal|improve|increase profit/],
  ["expense", /beban|opex|biaya operasional|pengeluaran|efisiensi|laba operasional|operating/],
  ["customer", /pelanggan|customer|klien|pembeli|konsumen/],
  ["channel", /channel|saluran|cabang|wilayah|outlet|marketplace/],
  ["category", /kategori|category|segmen|kelompok/],
  ["weekday", /hari apa|weekday|akhir pekan|weekend|per hari dalam minggu|hari terbaik|hari tersibuk|busiest day/],
  ["worst", /terburuk|terendah|paling sedikit|paling rendah|kurang laku|slow|tidak laku|rugi|margin rendah|margin terendah|lowest.{0,20}(margin|revenue|sales|product)|products? with (?:the )?lowest|bottom|lemah/],
  ["products", /produk|product|barang|item|terlaris|terbaik|top|paling laku|paling untung|menguntungkan|best/],
  ["margin", /margin|laba kotor|gross|profit|laba|untung|hpp|cogs|profitabilitas/],
  ["trend", /tren|trend|pertumbuhan|growth|naik|turun|mom|yoy|bulanan|per bulan|perkembangan/],
  ["revenue", /revenue|pendapatan|omzet|penjualan|sales|pemasukan|income|transaksi/],
  ["summary", /ringkas|ringkasan|summariz|financial performance|summary|overview|kondisi|performa|gambaran|rangkum|kesehatan|status|insight|wawasan|analisa|analisis/],
];
export const detectIntent = (q) => INTENTS.find(([, re]) => re.test(q))?.[0] ?? "unsupported";

const kpi = (label, value, delta, tone) => ({ label, value, delta, tone });
const bold = (s) => `**${s}**`;
const moneyAxis = true;

function kpiBlock(A, label = "") {
  const T = A.totals, d = A.cmp?.delta;
  return { type: "kpis", items: [
    kpi("Pendapatan", short(T.revenue), d?.revenue), kpi(A.hasCost ? "Laba kotor" : "Transaksi", A.hasCost ? short(T.gross) : T.orders.toLocaleString("id-ID"), A.hasCost ? d?.gross : d?.orders),
    kpi(A.hasCost ? "Margin kotor" : "Rata-rata transaksi", A.hasCost ? pct(T.margin) : short(T.aov), A.hasCost ? d?.margin : d?.aov, A.hasCost ? "pp" : undefined), kpi("Transaksi", T.orders.toLocaleString("id-ID"), d?.orders),
  ].slice(0, 4), caption: label };
}

const needCost = () => ({ text: "Untuk menghitung **margin dan laba kotor**, data perlu kolom **HPP / biaya pokok**. Data yang aktif saat ini belum memilikinya.\n\n- Buka **Data Studio**, unggah ulang file dengan kolom HPP\n- Atau petakan kolom HPP bila sudah ada dengan nama berbeda", blocks: [] });

const monthlyChart = (A, n = 12, extra = {}) => ({ type: "chart", kind: "composed", title: "Pendapatan & margin per bulan", xKey: "label", money: moneyAxis, data: A.monthly.slice(-n).map((m) => ({ label: m.label, revenue: m.revenue, gross: A.hasCost ? m.gross : undefined, margin: A.hasCost && m.margin != null ? +m.margin.toFixed(1) : undefined })), series: [{ key: "revenue", label: "Pendapatan", kind: "bar" }, ...(A.hasCost ? [{ key: "gross", label: "Laba kotor", kind: "bar" }, { key: "margin", label: "Margin %", kind: "line", axis: "right" }] : [])], ...extra });

const tableProducts = (list, A, title) => ({ type: "table", title, columns: ["Nama", "Pendapatan", "Qty", ...(A.hasCost ? ["Laba kotor", "Margin"] : []), "Porsi"], rows: list.map((p) => [p.name, short(p.revenue), p.qty.toLocaleString("id-ID"), ...(A.hasCost ? [short(p.gross), pct(p.margin)] : []), pct(p.share)]) });

function prevPeriod(rows, per) {
  let from, to;
  if (per.from.endsWith("-01") && per.from.slice(0, 7) === per.to.slice(0, 7)) { // same days of the previous month
    const y = +per.from.slice(0, 4), m = +per.from.slice(5, 7), [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1];
    from = `${py}-${pad(pm)}-01`; to = `${py}-${pad(pm)}-${pad(Math.min(+per.to.slice(8, 10), lastDom(py, pm)))}`;
  } else {
    const days = Math.round((Date.parse(per.to) - Date.parse(per.from)) / 86400000) + 1;
    to = addDays(per.from, -1); from = addDays(per.from, -days);
  }
  const pr = filterRows(rows, from, to);
  return pr.length ? analyze(pr) : null;
}

const H = {
  summary(A) {
    const T = A.totals, ins = A.insights;
    return { text: `Berikut ringkasan keuangan dari **${A.rows.toLocaleString("id-ID")} transaksi** (${A.range.min} → ${A.range.max}):\n\n- Pendapatan total ${bold(short(T.revenue))}${A.hasCost ? `, laba kotor ${bold(short(T.gross))} (margin ${bold(pct(T.margin))})` : ""}\n- Rata-rata nilai transaksi ${bold(short(T.aov))}\n${A.cmp ? `- ${A.cmp.window} hari terakhir: pendapatan ${bold(signed(A.cmp.delta.revenue))} vs periode sebelumnya\n` : ""}\n**Sorotan:**\n${ins.slice(0, 4).map((i) => `- ${bold(i.title)} — ${i.text}`).join("\n")}`, blocks: [kpiBlock(A), monthlyChart(A)] };
  },
  revenue(A, c) {
    const T = A.totals, per = c.period, prev = per ? prevPeriod(c.rows, per) : null;
    const dl = prev ? ((T.revenue - prev.totals.revenue) / prev.totals.revenue) * 100 : A.cmp?.delta.revenue;
    const best = [...A.daily].sort((a, b) => b.revenue - a.revenue)[0];
    const useDaily = A.range.days <= 62;
    return { text: `Pendapatan ${per ? per.label : "seluruh periode"}: ${bold(short(T.revenue))} dari ${T.orders.toLocaleString("id-ID")} transaksi (rata-rata ${short(T.aov)}).\n${dl != null ? `\nDibanding periode sebelumnya: ${bold(signed(dl))}${prev ? ` (${short(prev.totals.revenue)})` : ""}.` : ""}\n${best ? `\nHari terbaik: ${bold(best.date)} dengan ${short(best.revenue)}.` : ""}`, blocks: [kpiBlock(A), useDaily ? { type: "chart", kind: "area", title: "Pendapatan harian", xKey: "date", money: moneyAxis, data: A.daily.map((d) => ({ date: d.date.slice(5), revenue: d.revenue })), series: [{ key: "revenue", label: "Pendapatan" }] } : { type: "chart", kind: "area", title: "Pendapatan per bulan", xKey: "label", money: moneyAxis, data: A.monthly.slice(-14).map((m) => ({ label: m.label, revenue: m.revenue })), series: [{ key: "revenue", label: "Pendapatan" }] }] };
  },
  margin(A, c) {
    if (!A.hasCost) return needCost();
    const T = A.totals, per = c.period, prev = per ? prevPeriod(c.rows, per) : null;
    const pp = prev ? T.margin - prev.totals.margin : A.cmp?.delta.margin;
    const cats = A.byCategory.filter((x) => x.margin != null), bestC = [...cats].sort((a, b) => b.margin - a.margin)[0], worstC = [...cats].sort((a, b) => a.margin - b.margin)[0];
    const ppTxt = pp != null ? `${pp >= 0 ? "naik" : "turun"} ${bold(Math.abs(pp).toFixed(1).replace(".", ",") + " poin")} dibanding periode sebelumnya` : "";
    return { text: `Margin kotor ${per ? per.label : "keseluruhan"}: ${bold(pct(T.margin))} (laba kotor ${bold(short(T.gross))} dari pendapatan ${short(T.revenue)}), ${ppTxt}.\n\n${cats.length > 1 ? `- Margin tertinggi: ${bold(bestC.name)} (${pct(bestC.margin)})\n- Margin terendah: ${bold(worstC.name)} (${pct(worstC.margin)})\n` : ""}${T.margin < 25 ? "\n⚠ Margin di bawah 25% tergolong tipis; kenaikan HPP kecil saja bisa menghapus laba." : ""}`, blocks: [kpiBlock(A), monthlyChart(A, 12), cats.length > 1 && { type: "chart", kind: "hbar", title: "Margin per kategori (%)", xKey: "name", data: cats.map((x) => ({ name: x.name, margin: +x.margin.toFixed(1) })), series: [{ key: "margin", label: "Margin %" }], suffix: "%" }].filter(Boolean) };
  },
  products(A, c) {
    const byProfit = /untung|profit|laba|margin|menguntungkan/.test(c.q) && A.hasCost;
    const list = [...A.byProduct].sort((a, b) => (byProfit ? b.gross - a.gross : b.revenue - a.revenue)).slice(0, 8);
    const f = list[0], key = byProfit ? "gross" : "revenue";
    return { text: `${byProfit ? "Produk paling menguntungkan" : "Produk terlaris berdasarkan pendapatan"}${c.period ? ` (${c.period.label})` : ""}:\n\n${list.slice(0, 5).map((p, i) => `${i + 1}. ${bold(p.name)} — ${short(byProfit ? p.gross : p.revenue)}${p.margin != null ? `, margin ${pct(p.margin)}` : ""}`).join("\n")}\n\n${f ? `${bold(f.name)} memimpin dengan porsi ${pct(f.share)} dari pendapatan.` : ""} Top 20% produk menyumbang ${bold(pct(A.paretoTop20, 0))} pendapatan.`, blocks: [{ type: "chart", kind: "hbar", title: byProfit ? "Laba kotor per produk" : "Pendapatan per produk", xKey: "name", money: moneyAxis, data: list.map((p) => ({ name: p.name, [key]: byProfit ? p.gross : p.revenue })), series: [{ key, label: byProfit ? "Laba kotor" : "Pendapatan" }] }, tableProducts(list, A, "Detail produk")] };
  },
  worst(A) {
    const pool = A.byProduct.filter((p) => p.orders >= 2), list = (A.hasCost ? [...pool].sort((a, b) => a.margin - b.margin) : [...pool].sort((a, b) => a.revenue - b.revenue)).slice(0, 6);
    return { text: `${A.hasCost ? "Produk dengan margin terendah" : "Produk dengan pendapatan terendah"}:\n\n${list.map((p) => `- ${bold(p.name)} — ${A.hasCost ? `margin ${pct(p.margin)}, ` : ""}pendapatan ${short(p.revenue)}`).join("\n")}\n\n${A.hasCost ? "Pertimbangkan menaikkan harga, renegosiasi HPP pemasok, atau mengurangi diskon pada produk-produk ini." : "Evaluasi apakah perlu promosi, bundling, atau dihentikan."}`, blocks: [tableProducts(list, A, "Produk berkinerja rendah")] };
  },
  category(A) {
    const L = A.byCategory;
    return { text: `Pendapatan terbagi ke ${bold(L.length + " kategori")}. ${bold(L[0].name)} terbesar (${pct(L[0].share)}, ${short(L[0].revenue)})${L[0].margin != null ? ` dengan margin ${pct(L[0].margin)}` : ""}.\n\n${L.slice(0, 5).map((x) => `- ${x.name}: ${short(x.revenue)} (${pct(x.share)})${x.margin != null ? ` · margin ${pct(x.margin)}` : ""}`).join("\n")}`, blocks: [{ type: "chart", kind: "donut", title: "Porsi pendapatan per kategori", xKey: "name", money: moneyAxis, data: L.slice(0, 7).map((x) => ({ name: x.name, value: x.revenue })), series: [{ key: "value" }] }, tableProducts(L.slice(0, 8), A, "Rincian kategori")] };
  },
  customer(A) {
    const L = A.byCustomer;
    if (!L.length) return { text: "Data aktif belum memiliki kolom **Pelanggan**, sehingga analisis pelanggan belum bisa dibuat. Petakan kolomnya di **Data Studio**.", blocks: [] };
    const top3 = L.slice(0, 3).reduce((s, x) => s + x.share, 0);
    return { text: `Ada ${bold(L.length + " pelanggan")}. Tiga terbesar menyumbang ${bold(pct(top3))} pendapatan; teratas ${bold(L[0].name)} (${short(L[0].revenue)}, ${pct(L[0].share)}).\n${L[0].share > 25 ? "\n⚠ Konsentrasi tinggi pada satu pelanggan — risiko arus kas." : "\nKonsentrasi pelanggan relatif sehat."}`, blocks: [{ type: "chart", kind: "hbar", title: "Pelanggan teratas", xKey: "name", money: moneyAxis, data: L.slice(0, 8).map((x) => ({ name: x.name, revenue: x.revenue })), series: [{ key: "revenue", label: "Pendapatan" }] }, tableProducts(L.slice(0, 8), A, "Detail pelanggan")] };
  },
  channel(A) {
    const L = A.byChannel;
    if (!L.length) return { text: "Data aktif belum memiliki kolom **Channel/Cabang**. Petakan kolomnya di **Data Studio**.", blocks: [] };
    return { text: `Channel terbesar: ${bold(L[0].name)} (${pct(L[0].share)}, ${short(L[0].revenue)}).\n\n${L.map((x) => `- ${x.name}: ${short(x.revenue)}${x.margin != null ? ` · margin ${pct(x.margin)}` : ""}`).join("\n")}`, blocks: [{ type: "chart", kind: "donut", title: "Pendapatan per channel", xKey: "name", money: moneyAxis, data: L.map((x) => ({ name: x.name, value: x.revenue })), series: [{ key: "value" }] }] };
  },
  weekday(A) {
    const W = [...A.weekday].sort((a, b) => b.avg - a.avg);
    return { text: `Rata-rata pendapatan harian tertinggi pada hari ${bold(W[0].name)} (${short(W[0].avg)}), terendah ${bold(W.at(-1).name)} (${short(W.at(-1).avg)}). Atur stok, staf, dan promosi mengikuti pola ini.`, blocks: [{ type: "chart", kind: "bar", title: "Rata-rata pendapatan per hari dalam seminggu", xKey: "short", money: moneyAxis, data: A.weekday, series: [{ key: "avg", label: "Rata-rata" }] }] };
  },
  trend(A) {
    const M = A.monthly.filter((m) => !m.partial), last = M.at(-1), prev = M.at(-2);
    if (M.length < 2) return { text: "Data belum cukup untuk analisis tren (minimal 2 bulan lengkap).", blocks: [monthlyChart(A)] };
    const best = [...M].sort((a, b) => b.revenue - a.revenue)[0], worst = [...M].sort((a, b) => a.revenue - b.revenue)[0];
    return { text: `Bulan lengkap terakhir (${bold(monthName(last.month))}): ${bold(short(last.revenue))}, ${bold(signed(last.mom ?? ((last.revenue - prev.revenue) / prev.revenue) * 100))} dari bulan sebelumnya.\n\n- Bulan terbaik: ${bold(monthName(best.month))} (${short(best.revenue)})\n- Bulan terlemah: ${bold(monthName(worst.month))} (${short(worst.revenue)})${A.forecast ? `\n- Tren linear: ${bold(signed(A.forecast.slopePct))} per bulan` : ""}`, blocks: [monthlyChart(A, 14), { type: "table", title: "Pertumbuhan bulanan", columns: ["Bulan", "Pendapatan", "MoM", ...(A.hasCost ? ["Margin"] : [])], rows: M.slice(-8).map((m) => [monthName(m.month), short(m.revenue), m.mom == null ? "—" : signed(m.mom), ...(A.hasCost ? [pct(m.margin)] : [])]) }] };
  },
  forecast(A) {
    const F = A.forecast;
    if (!F) return { text: "Proyeksi membutuhkan minimal **4 bulan lengkap** data. Unggah data historis yang lebih panjang di **Data Studio**.", blocks: [] };
    const hist = A.monthly.filter((m) => !m.partial).slice(-9).map((m) => ({ label: m.label, actual: m.revenue })), last = hist.at(-1);
    const data = [...hist.slice(0, -1), { ...last, forecast: last.actual, low: last.actual, high: last.actual }, ...F.points.map((p) => ({ label: p.label, forecast: p.value, low: p.low, high: p.high }))];
    const tot = F.points.reduce((s, p) => s + p.value, 0);
    return { text: `Proyeksi pendapatan 3 bulan ke depan (regresi linear dari ${F.basedOn} bulan terakhir):\n\n${F.points.map((p) => `- ${bold(p.label)}: ${short(p.value)} (rentang 80%: ${short(p.low)} – ${short(p.high)})`).join("\n")}\n\nTotal ±${bold(short(tot))}. Tren ${bold(signed(F.slopePct))}/bulan, R² ${F.r2.toFixed(2).replace(".", ",")}${F.r2 < 0.4 ? " — pola kurang konsisten, anggap sebagai indikasi kasar" : ""}.${F.partialExcluded ? "\n\nBulan berjalan yang belum lengkap tidak dihitung." : ""}${F.points[0].gross != null ? `\n\nDengan margin 3 bulan terakhir, laba kotor bulan depan diperkirakan ${bold(short(F.points[0].gross))}.` : ""}`, blocks: [{ type: "chart", kind: "forecast", title: "Aktual vs proyeksi", xKey: "label", money: moneyAxis, data, series: [{ key: "actual", label: "Aktual" }, { key: "forecast", label: "Proyeksi", dashed: true }] }] };
  },
  anomaly(A) {
    if (!A.anomalies.length) return { text: "Tidak ditemukan **anomali signifikan** pada pendapatan harian — pola penjualan tergolong konsisten.", blocks: [] };
    return { text: `Ditemukan ${bold(A.anomalies.length + " hari tidak biasa")} (deteksi robust z-score ≥ 3,5):\n\n${A.anomalies.map((a) => `- ${bold(a.date)}: ${short(a.revenue)} vs kebiasaan ${short(a.expected)} (${a.dir === "high" ? "lonjakan" : "penurunan"} ${signed(((a.revenue - a.expected) / a.expected) * 100, 0)})`).join("\n")}\n\nVerifikasi apakah karena promo, gangguan operasional/sistem, atau kesalahan input data.`, blocks: [{ type: "table", title: "Hari anomali", columns: ["Tanggal", "Pendapatan", "Normal", "Selisih", "Jenis"], rows: A.anomalies.map((a) => [a.date, short(a.revenue), short(a.expected), signed(((a.revenue - a.expected) / a.expected) * 100, 0), a.dir === "high" ? "Lonjakan" : "Penurunan"]) }] };
  },
  expense(A) {
    if (!A.hasExpense) return { text: "Data aktif belum memiliki kolom **Beban operasional**. Tambahkan/petakan kolom tersebut di **Data Studio** untuk melihat laba operasional dan rasio efisiensi.", blocks: [] };
    const T = A.totals;
    return { text: `Beban operasional ${bold(short(T.expense))} (${bold(pct((T.expense / T.revenue) * 100))} dari pendapatan). Laba operasional ${bold(short(T.op))}${T.opMargin != null ? `, margin operasional ${bold(pct(T.opMargin))}` : ""}.${A.cmp?.delta.expense != null ? `\n\nBeban ${A.cmp.window} hari terakhir ${bold(signed(A.cmp.delta.expense))} vs periode sebelumnya.` : ""}`, blocks: [{ type: "chart", kind: "composed", title: "Laba kotor vs beban operasional", xKey: "label", money: moneyAxis, data: A.monthly.slice(-12).map((m) => ({ label: m.label, gross: m.gross, expense: m.expense, op: m.op })), series: [{ key: "gross", label: "Laba kotor", kind: "bar" }, { key: "expense", label: "Beban", kind: "bar" }, { key: "op", label: "Laba operasional", kind: "line" }] }] };
  },
  recommend(A) {
    const T = A.totals, acts = [], lowM = A.hasCost ? A.byProduct.slice(0, 8).filter((p) => p.margin < T.margin - 8) : [], top = A.byProduct[0];
    if (lowM[0]) acts.push(`**Perbaiki margin ${lowM[0].name}** (${pct(lowM[0].margin)} vs rata-rata ${pct(T.margin)}). Menaikkan harga 5% pada produk ini kira-kira menambah laba kotor ${short(lowM[0].revenue * 0.05)}.`);
    if (A.hasCost) { const hi = [...A.byProduct].filter((p) => p.margin > T.margin + 8 && p.orders >= 3).sort((a, b) => b.margin - a.margin)[0]; if (hi) acts.push(`**Dorong ${hi.name}** — margin ${pct(hi.margin)} jauh di atas rata-rata; prioritaskan di promosi dan penempatan.`); }
    if (top && top.share > 30) acts.push(`**Kurangi ketergantungan pada ${top.name}** (${pct(top.share)} pendapatan) lewat bundling dengan produk lain.`);
    const w = [...A.weekday].sort((a, b) => a.avg - b.avg)[0]; if (w && A.weekday.some((x) => x.orders)) acts.push(`**Hidupkan hari ${w.name}** (rata-rata terendah ${short(w.avg)}) dengan promo khusus atau jadwal pengiriman.`);
    if (A.cmp?.delta.revenue < -5) acts.push(`**Selidiki penurunan ${signed(A.cmp.delta.revenue)}** pada ${A.cmp.window} hari terakhir — cek pelanggan yang berhenti dan produk yang melemah.`);
    const cu = A.byCustomer[0]; if (cu && cu.share > 25) acts.push(`**Diversifikasi pelanggan** — ${cu.name} = ${pct(cu.share)} pendapatan.`);
    if (!A.hasCost) acts.push("**Catat HPP per transaksi** agar margin dan profitabilitas produk dapat dianalisis.");
    if (!acts.length) acts.push("Kinerja relatif seimbang. Fokus pada **menaikkan nilai rata-rata transaksi** lewat bundling/upselling dan uji kenaikan harga kecil pada produk laris.");
    return { text: `Rekomendasi berbasis data Anda:\n\n${acts.slice(0, 5).map((a, i) => `${i + 1}. ${a}`).join("\n")}`, blocks: [kpiBlock(A)] };
  },
  promotion(A, c) {
    const discountMatch = c.q.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
    const discount = discountMatch ? Number(discountMatch[1].replace(",", ".")) : null;
    if (discount != null && (discount < 0 || discount > 100))
      return { text: "Persentase diskon harus berada di antara 0% dan 100%.", blocks: [] };
    if (!A.hasCost) {
      return { text: "Saya belum bisa menilai dampak diskon terhadap laba karena data aktif tidak memiliki HPP. Data ini juga tidak mencatat riwayat eksperimen promo atau perubahan volume akibat diskon. Tambahkan HPP, lalu uji promo terbatas dengan membandingkan laba—bukan hanya omzet—terhadap periode tanpa promo.", blocks: [] };
    }

    const margin = A.totals.margin;
    const marginText = pct(margin);
    if (discount == null) {
      return { text: `Data menunjukkan margin kotor rata-rata **${marginText}** untuk ${A.rows.toLocaleString("id-ID")} transaksi (${A.range.min} s/d ${A.range.max}). Dataset ini tidak mencatat eksperimen promo atau sensitivitas pelanggan terhadap diskon, jadi saya tidak dapat memastikan diskon akan menaikkan laba. Uji pada sebagian produk/pelanggan dan bandingkan laba kotor serta jumlah transaksi dengan kelompok tanpa promo. Margin rata-rata ini bukan batas aman untuk setiap produk; cek HPP per produk sebelum menetapkan diskon.`, blocks: [kpiBlock(A)] };
    }

    const warning = discount >= margin
      ? `Diskon **${discount}%** setara atau melebihi margin kotor rata-rata **${marginText}**. Dengan bauran produk yang sama, ini berisiko membuat laba kotor negatif; jangan terapkan ke semua produk tanpa memeriksa margin tiap produk.`
      : `Diskon **${discount}%** masih di bawah margin kotor rata-rata **${marginText}**, tetapi tetap mengurangi laba per unit. Dengan asumsi harga dan bauran produk tetap, volume penjualan perlu naik sekitar **${pct((margin / (margin - discount) - 1) * 100)}** hanya untuk menyamai laba kotor sebelum diskon.`;
    return { text: `${warning}\n\nData historis ini tidak memuat uji promo atau sensitivitas harga, jadi dampak nyata terhadap permintaan belum diketahui. Mulai dengan uji terbatas dan kelompok pembanding; evaluasi laba kotor, bukan omzet saja.`, blocks: [kpiBlock(A)] };
  },
  unsupported() {
    return { text: "Saya belum dapat mengaitkan pertanyaan ini dengan data keuangan yang tersedia. Saya bisa membantu menganalisis pendapatan, margin/HPP, produk, pelanggan, tren, prediksi, anomali, atau dampak promo. Jika pertanyaannya terkait bisnis, coba jelaskan metrik atau periode yang ingin dibandingkan.", blocks: [] };
  },
  help() {
    return { text: "Saya **AIRA**, analis keuangan Anda. Saya menghitung langsung dari data yang aktif. Coba tanyakan:\n\n- **Ringkasan**: \"ringkas kondisi keuangan\"\n- **Pendapatan & margin**: \"margin bulan lalu\", \"pendapatan Q1 2026\", \"30 hari terakhir\"\n- **Produk & pelanggan**: \"produk paling untung\", \"pelanggan terbesar\"\n- **Prediksi**: \"proyeksi 3 bulan ke depan\"\n- **Deteksi**: \"ada anomali?\", \"hari apa paling ramai?\"\n- **Aksi**: \"rekomendasi menaikkan profit\"", blocks: [] };
  },
  greet(A) {
    return { text: `Halo! Saya AIRA. Data aktif berisi **${A.rows.toLocaleString("id-ID")} transaksi** (${A.range.min} → ${A.range.max}). Apa yang ingin Anda ketahui?`, blocks: [] };
  },
};

/** Main entry. rows = raw normalised rows, A0 = analysis of the full dataset. */
export function answerLocal(question, rows, A0, language = "id-ID") {
  const q = ` ${question.toLowerCase().replace(/[^a-z0-9%\s/\-]/g, " ")} `.replace(/\s+/g, " ");
  const intent = detectIntent(q.trim());
  if (!A0) return { intent, text: language === "en-US" ? "There is no active dataset. Upload a file in **Data Studio** or use the sample data." : "Belum ada data aktif. Unggah file Excel di **Data Studio** atau gunakan data contoh.", blocks: [] };
  if (intent === "unsupported") return { intent, text: language === "en-US" ? "I can't connect this question to the available financial data. I can analyze revenue, margin/COGS, products, customers, trends, forecasts, anomalies, or promotions. If this is a business question, tell me which metric or period you want to compare." : H.unsupported().text, blocks: [] };
  if (intent === "greet" && language === "en-US") return { intent, text: `Hello! I'm AIRA. The active dataset contains **${A0.rows.toLocaleString("en-US")} transactions** (${A0.range.min} → ${A0.range.max}). What would you like to know?`, blocks: [] };
  if (intent === "help" && language === "en-US") return { intent, text: "I'm **AIRA**, your financial analyst. I calculate from your active data. Ask about revenue, gross margin, products, customers, forecasts, anomalies, or recommendations.", blocks: [] };
  const period = ["help", "greet", "forecast", "recommend"].includes(intent) ? null : parsePeriod(q, A0.range);
  let A = A0;
  if (period) {
    const sub = filterRows(rows, period.from, period.to);
    if (!sub.length) return { intent, period, text: `Tidak ada transaksi pada ${bold(period.label)}. Data tersedia dari ${bold(A0.range.min)} sampai ${bold(A0.range.max)}.`, blocks: [] };
    A = analyze(sub);
  }
  const res = H[intent](A, { q, period, rows, A0 });
  return { intent, period, ...res, blocks: res.blocks.filter(Boolean), analysis: A };
}

/** Retrieve only the structured financial facts relevant to this question for LLM grounding. */
export function buildContext(A, local, meta = {}) {
  const T = A.totals, L = [];
  L.push(`Sumber data: ${meta.name ?? "dataset"} | ${A.rows} transaksi | ${A.range.min} s/d ${A.range.max} | mata uang Rp`);
  L.push(`TOTAL: pendapatan=${Math.round(T.revenue)}; hpp=${Math.round(T.cost)}; laba_kotor=${Math.round(T.gross)}; margin_kotor=${T.margin != null ? T.margin.toFixed(2) + "%" : "n/a (tanpa HPP)"}; beban_operasional=${Math.round(T.expense)}; laba_operasional=${A.hasExpense ? Math.round(T.op) : "n/a"}; transaksi=${T.orders}; rata2_transaksi=${Math.round(T.aov)}`);
  const dim = (t, a, n) => L.push(`${t} (nama|pendapatan|laba_kotor|margin%|qty):\n` + a.slice(0, n).map((x) => `${x.name}|${Math.round(x.revenue)}|${Math.round(x.gross)}|${x.margin != null ? x.margin.toFixed(1) : "-"}|${x.qty}`).join("\n"));
  const intent = local?.intent;
  if (["promotion", "recommend", "products", "worst"].includes(intent)) dim("PRODUK_TOP", A.byProduct, 15);
  if (["recommend", "category"].includes(intent)) dim("KATEGORI", A.byCategory, 10);
  if (intent === "customer" && A.byCustomer.length) dim("PELANGGAN_TOP", A.byCustomer, 8);
  if (intent === "channel" && A.byChannel.length) dim("CHANNEL", A.byChannel, 8);
  if (A.cmp && ["summary", "revenue", "margin", "trend", "recommend"].includes(intent)) L.push(`PERBANDINGAN ${A.cmp.window} hari terakhir vs sebelumnya: pendapatan ${Math.round(A.cmp.cur.revenue)} vs ${Math.round(A.cmp.prev.revenue)} (${A.cmp.delta.revenue?.toFixed(1)}%)${A.cmp.delta.margin != null ? `; margin ${A.cmp.cur.margin.toFixed(1)}% vs ${A.cmp.prev.margin.toFixed(1)}%` : ""}`);
  if (["summary", "revenue", "trend"].includes(intent)) L.push("BULANAN (bulan|pendapatan|laba_kotor|margin%):\n" + A.monthly.slice(-12).map((m) => `${m.month}${m.partial ? "*" : ""}|${Math.round(m.revenue)}|${Math.round(m.gross)}|${m.margin != null ? m.margin.toFixed(1) : "-"}`).join("\n"));
  if (intent === "forecast" && A.forecast) L.push("PROYEKSI: " + A.forecast.points.map((p) => `${p.month}=${Math.round(p.value)} (${Math.round(p.low)}-${Math.round(p.high)})`).join("; "));
  if (intent === "anomaly" && A.anomalies.length) L.push("ANOMALI: " + A.anomalies.map((a) => `${a.date}=${Math.round(a.revenue)} (normal ${Math.round(a.expected)})`).join("; "));
  if (local) L.push(`HASIL PERHITUNGAN MESIN UNTUK PERTANYAAN INI (benar secara matematis, jadikan acuan):\n${local.text}${local.period ? `\nPeriode terfilter: ${local.period.from} s/d ${local.period.to}` : ""}`);
  return L.join("\n\n").slice(0, 38000);
}
