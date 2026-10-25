/** Finance analytics engine — pure functions over normalised rows. No network, no side effects. */
import { short, pct, signed } from "../utils/format";

const MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const monthLabel = (ym) => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(2, 4)}`;
export const monthName = (ym) => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const t = (s) => Date.parse(`${s}T00:00:00Z`);
const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (s, n) => ymd(t(s) + n * MS);
const sum = (a, f) => a.reduce((x, r) => x + f(r), 0);
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const grow = (cur, prev) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);

function totals(rows, hasCost) {
  const revenue = sum(rows, (r) => r.revenue), cost = sum(rows, (r) => r.cost), expense = sum(rows, (r) => r.expense);
  const gross = revenue - cost, orders = rows.length;
  return {
    revenue, cost, gross, expense, orders, qty: sum(rows, (r) => r.qty),
    margin: hasCost && revenue ? (gross / revenue) * 100 : null,
    aov: orders ? revenue / orders : 0,
    op: gross - expense, opMargin: hasCost && revenue ? ((gross - expense) / revenue) * 100 : null,
  };
}

function group(rows, keyFn, hasCost, total) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r); let g = m.get(k);
    if (!g) m.set(k, (g = { name: k, revenue: 0, cost: 0, expense: 0, qty: 0, orders: 0 }));
    g.revenue += r.revenue; g.cost += r.cost; g.expense += r.expense; g.qty += r.qty; g.orders++;
  }
  return [...m.values()].map((g) => ({ ...g, gross: g.revenue - g.cost, margin: hasCost && g.revenue ? ((g.revenue - g.cost) / g.revenue) * 100 : null, share: total ? (g.revenue / total) * 100 : 0 })).sort((a, b) => b.revenue - a.revenue);
}

function linreg(ys) {
  const n = ys.length, xs = ys.map((_, i) => i), mx = (n - 1) / 2, my = sum(ys, (y) => y) / n;
  const sxx = sum(xs, (x) => (x - mx) ** 2) || 1, sxy = sum(xs, (x) => (x - mx) * (ys[x] - my));
  const slope = sxy / sxx, icpt = my - slope * mx;
  const res = ys.map((y, i) => y - (icpt + slope * i)), sse = sum(res, (e) => e * e);
  const sst = sum(ys, (y) => (y - my) ** 2) || 1;
  return { slope, icpt, n, mx, sxx, s: Math.sqrt(sse / Math.max(1, n - 2)), r2: 1 - sse / sst, mean: my };
}

export function analyze(rows) {
  if (!rows?.length) return null;
  const hasCost = rows.some((r) => r.cost > 0), hasExpense = rows.some((r) => r.expense > 0);
  let min = rows[0].date, max = rows[0].date;
  for (const r of rows) { if (r.date < min) min = r.date; if (r.date > max) max = r.date; }
  const spanDays = Math.round((t(max) - t(min)) / MS) + 1;
  const tot = totals(rows, hasCost);

  // ── comparison window (last N days vs the N days before) ──
  const win = spanDays >= 60 ? 30 : Math.max(1, Math.floor(spanDays / 2));
  const curFrom = addDays(max, -(win - 1)), prevFrom = addDays(max, -(2 * win - 1)), prevTo = addDays(max, -win);
  const curRows = rows.filter((r) => r.date >= curFrom), prevRows = rows.filter((r) => r.date >= prevFrom && r.date <= prevTo);
  let cmp = null;
  if (prevRows.length && spanDays >= 2) {
    const c = totals(curRows, hasCost), p = totals(prevRows, hasCost);
    cmp = { window: win, cur: c, prev: p, delta: { revenue: grow(c.revenue, p.revenue), gross: grow(c.gross, p.gross), orders: grow(c.orders, p.orders), aov: grow(c.aov, p.aov), expense: grow(c.expense, p.expense), margin: c.margin != null && p.margin != null ? c.margin - p.margin : null } };
  }

  // ── monthly (zero-filled) ──
  const byM = new Map();
  for (const r of rows) { const k = r.date.slice(0, 7); (byM.get(k) ?? byM.set(k, []).get(k)).push(r); }
  const months = []; let [y, mo] = [+min.slice(0, 4), +min.slice(5, 7)]; const [ey, em] = [+max.slice(0, 4), +max.slice(5, 7)];
  while (y < ey || (y === ey && mo <= em)) { months.push(`${y}-${String(mo).padStart(2, "0")}`); if (++mo > 12) { mo = 1; y++; } }
  const lastDayOfMax = new Date(Date.UTC(+max.slice(0, 4), +max.slice(5, 7), 0)).getUTCDate();
  const monthly = months.map((k, i) => {
    const tt = totals(byM.get(k) ?? [], hasCost);
    return { month: k, label: monthLabel(k), ...tt, partial: i === months.length - 1 && +max.slice(8, 10) < lastDayOfMax };
  });
  monthly.forEach((m, i) => { const p = monthly[i - 1]; m.mom = p && !p.partial && !m.partial ? grow(m.revenue, p.revenue) : null; });

  // ── daily (zero-filled up to ~3y) ──
  const byD = new Map();
  for (const r of rows) { const g = byD.get(r.date) ?? byD.set(r.date, { revenue: 0, gross: 0, orders: 0 }).get(r.date); g.revenue += r.revenue; g.gross += r.revenue - r.cost; g.orders++; }
  const daily = [];
  if (spanDays <= 1100) for (let i = 0; i < spanDays; i++) { const d = addDays(min, i); daily.push({ date: d, ...(byD.get(d) ?? { revenue: 0, gross: 0, orders: 0 }) }); }
  else [...byD.entries()].sort().forEach(([d, v]) => daily.push({ date: d, ...v }));

  // ── dimensions ──
  const byCategory = group(rows, (r) => r.category, hasCost, tot.revenue);
  const byProduct = group(rows, (r) => r.product, hasCost, tot.revenue);
  const byCustomer = group(rows, (r) => r.customer, hasCost, tot.revenue).filter((c) => c.name !== "—");
  const byChannel = group(rows, (r) => r.channel, hasCost, tot.revenue).filter((c) => c.name !== "—");

  // ── weekday ──
  const wd = WEEKDAYS.map((name) => ({ name, revenue: 0, orders: 0, days: new Set() }));
  for (const r of rows) { const i = (new Date(t(r.date)).getUTCDay() + 6) % 7; wd[i].revenue += r.revenue; wd[i].orders++; wd[i].days.add(r.date); }
  const weekday = wd.map((w) => ({ name: w.name, short: w.name.slice(0, 3), revenue: w.revenue, orders: w.orders, avg: w.days.size ? w.revenue / w.days.size : 0 }));

  // ── pareto ──
  let acc = 0;
  const pareto = byProduct.map((p) => { acc += p.revenue; return { name: p.name, revenue: p.revenue, cum: tot.revenue ? (acc / tot.revenue) * 100 : 0 }; });
  const top20n = Math.max(1, Math.ceil(byProduct.length * 0.2));
  const paretoTop20 = tot.revenue ? (sum(byProduct.slice(0, top20n), (p) => p.revenue) / tot.revenue) * 100 : 0;

  // ── forecast (OLS on last ≤12 complete months, 80% band) ──
  let forecast = null;
  const done = monthly.filter((m) => !m.partial);
  if (done.length >= 4) {
    const base = done.slice(-12), lr = linreg(base.map((m) => m.revenue));
    const recentMargin = hasCost ? (() => { const l = base.slice(-3); const r = sum(l, (m) => m.revenue); return r ? sum(l, (m) => m.gross) / r : 0; })() : null;
    const last = base.at(-1).month; const pts = [];
    for (let k = 1; k <= 3; k++) {
      const x = lr.n - 1 + k, v = Math.max(0, lr.icpt + lr.slope * x);
      const band = 1.28 * lr.s * Math.sqrt(1 + 1 / lr.n + (x - lr.mx) ** 2 / lr.sxx);
      let yy = +last.slice(0, 4), mm = +last.slice(5, 7) + k; while (mm > 12) { mm -= 12; yy++; }
      const key = `${yy}-${String(mm).padStart(2, "0")}`;
      pts.push({ month: key, label: monthLabel(key), value: v, low: Math.max(0, v - band), high: v + band, gross: recentMargin != null ? v * recentMargin : null });
    }
    forecast = { points: pts, slope: lr.slope, slopePct: lr.mean ? (lr.slope / lr.mean) * 100 : 0, r2: lr.r2, basedOn: base.length, partialExcluded: monthly.at(-1)?.partial ?? false };
  }

  // ── anomalies (modified z-score on active days) ──
  const act = daily.filter((d) => d.orders > 0);
  let anomalies = [];
  if (act.length >= 14) {
    const vals = act.map((d) => d.revenue), med = median(vals), mad = median(vals.map((v) => Math.abs(v - med)));
    const sd = Math.sqrt(sum(vals, (v) => (v - med) ** 2) / vals.length) || 1;
    anomalies = act.map((d) => ({ date: d.date, revenue: d.revenue, expected: med, z: mad ? (0.6745 * (d.revenue - med)) / mad : (d.revenue - med) / sd, dir: d.revenue >= med ? "high" : "low" }))
      .filter((a) => Math.abs(a.z) >= 3.5).sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 6);
  }

  const A = { rows: rows.length, range: { min, max, days: spanDays }, hasCost, hasExpense, totals: tot, cmp, monthly, daily, byCategory, byProduct, byCustomer, byChannel, weekday, pareto, paretoTop20, forecast, anomalies };
  A.insights = insights(A);
  return A;
}

export function insights(A) {
  const out = [], T = A.totals, c = A.cmp, top = A.byProduct[0], cat = A.byCategory[0];
  if (c?.delta.revenue != null) {
    const d = c.delta.revenue;
    out.push(Math.abs(d) < 3 ? { tone: "info", title: "Pendapatan stabil", text: `Pendapatan ${c.window} hari terakhir ${short(c.cur.revenue)}, nyaris sama dengan periode sebelumnya (${signed(d)}).` }
      : { tone: d > 0 ? "positive" : "negative", title: d > 0 ? "Pendapatan bertumbuh" : "Pendapatan menurun", text: `${c.window} hari terakhir ${short(c.cur.revenue)} (${signed(d)} dibanding ${short(c.prev.revenue)} periode sebelumnya).` });
  }
  if (A.hasCost) {
    const md = c?.delta.margin;
    if (md != null && Math.abs(md) >= 1) out.push({ tone: md > 0 ? "positive" : "warning", title: md > 0 ? "Margin membaik" : "Margin tergerus", text: `Margin kotor ${pct(c.cur.margin)} (${md > 0 ? "+" : "−"}${Math.abs(md).toFixed(1).replace(".", ",")} poin). ${md < 0 ? "Periksa kenaikan HPP atau diskon yang terlalu dalam." : "Pertahankan struktur harga & bauran produk saat ini."}` });
    else if (T.margin < 20) out.push({ tone: "warning", title: "Margin tipis", text: `Margin kotor keseluruhan hanya ${pct(T.margin)}. Evaluasi harga jual dan negosiasi HPP.` });
    const weak = A.byProduct.slice(0, 10).filter((p) => p.margin != null && p.margin < T.margin - 8 && p.share >= 5)[0];
    if (weak) out.push({ tone: "warning", title: "Produk laris, margin rendah", text: `${weak.name} menyumbang ${pct(weak.share)} pendapatan tetapi marginnya ${pct(weak.margin)} (rata-rata ${pct(T.margin)}). Pertimbangkan penyesuaian harga.` });
  } else out.push({ tone: "info", title: "Aktifkan analisis margin", text: "Tambahkan kolom HPP/biaya pokok pada data Anda untuk membuka margin, laba kotor, dan analisis profitabilitas produk." });
  if (top && A.byProduct.length > 1) out.push(top.share > 30 ? { tone: "warning", title: "Ketergantungan satu produk", text: `${top.name} = ${pct(top.share)} dari pendapatan. Diversifikasi untuk menekan risiko.` } : { tone: "info", title: "Produk unggulan", text: `${top.name} memimpin dengan ${short(top.revenue)} (${pct(top.share)} dari total).` });
  if (A.forecast) { const f = A.forecast.points[0]; out.push({ tone: A.forecast.slopePct >= 0 ? "positive" : "warning", title: "Proyeksi pendapatan", text: `${f.label}: sekitar ${short(f.value)} (rentang ${short(f.low)} – ${short(f.high)}), tren ${signed(A.forecast.slopePct)} per bulan.` }); }
  const an = A.anomalies[0];
  if (an) out.push({ tone: an.dir === "high" ? "info" : "negative", title: an.dir === "high" ? "Lonjakan tak biasa" : "Penurunan tajam", text: `${an.date}: pendapatan ${short(an.revenue)} vs kebiasaan ${short(an.expected)}. Cek promo, gangguan operasional, atau salah input.` });
  if (cat && A.byCategory.length > 1) out.push({ tone: "info", title: "Kategori terkuat", text: `${cat.name} menyumbang ${pct(cat.share)} pendapatan${cat.margin != null ? ` dengan margin ${pct(cat.margin)}` : ""}.` });
  const cu = A.byCustomer[0];
  if (cu && A.byCustomer.length > 3 && cu.share > 25) out.push({ tone: "warning", title: "Konsentrasi pelanggan", text: `${cu.name} berkontribusi ${pct(cu.share)} pendapatan — risiko arus kas bila pelanggan ini berhenti.` });
  const rank = { negative: 0, warning: 1, positive: 2, info: 3 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 6);
}

export const filterRows = (rows, from, to) => rows.filter((r) => r.date >= from && r.date <= to);

/** Chart rows: last `n` complete months (actual) + forecast points with 80% band. */
export function forecastData(A, n = 9) {
  if (!A?.forecast) return [];
  const hist = A.monthly.filter((m) => !m.partial).slice(-n).map((m) => ({ label: m.label, actual: m.revenue })), last = hist.at(-1);
  return [...hist.slice(0, -1), { ...last, forecast: last.actual, low: last.actual, high: last.actual }, ...A.forecast.points.map((p) => ({ label: p.label, forecast: p.value, low: p.low, high: p.high }))];
}
