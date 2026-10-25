/** Deterministic sample dataset (≈18 months of UMKM coffee & lifestyle sales) for demo mode. */
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const P = [
  ["Kopi Arabika Gayo 250g", "Kopi", 85000, 0.52, 9], ["Kopi Robusta Lampung 250g", "Kopi", 55000, 0.56, 8], ["Espresso Blend 500g", "Kopi", 140000, 0.5, 6], ["Kopi Susu Botol 1L", "Kopi", 68000, 0.58, 7],
  ["Teh Melati Premium 100g", "Minuman", 38000, 0.6, 5], ["Matcha Latte 150g", "Minuman", 92000, 0.55, 4], ["Cokelat Bubuk 500g", "Minuman", 72000, 0.62, 3], ["Sirup Gula Aren 500ml", "Minuman", 32000, 0.5, 6],
  ["Keripik Tempe Original", "Makanan", 18000, 0.6, 8], ["Sambal Roa 200g", "Makanan", 42000, 0.55, 5], ["Madu Hutan 350ml", "Makanan", 95000, 0.64, 3], ["Beras Organik 5kg", "Makanan", 89000, 0.8, 5], ["Minyak Kelapa 500ml", "Makanan", 65000, 0.72, 3],
  ["Totebag Kanvas", "Merchandise", 45000, 0.46, 4], ["Kaos Katun Combed", "Merchandise", 99000, 0.5, 3], ["Tumbler Stainless 500ml", "Merchandise", 125000, 0.6, 3], ["Topi Baseball", "Merchandise", 68000, 0.55, 2],
  ["Dripper V60", "Peralatan", 110000, 0.72, 2], ["Grinder Manual", "Peralatan", 450000, 0.78, 1.2], ["Timbangan Kopi", "Peralatan", 280000, 0.75, 1.3], ["French Press 600ml", "Peralatan", 175000, 0.68, 1.6],
];
const CUST = ["PT Maju Jaya", "Kafe Senja", "Toko Sumber Rezeki", "CV Bintang Timur", "Warung Kopi Nusantara", "Hotel Melati Indah", "Katering Bu Ratna", "Resto Laut Biru", "Koperasi Sejahtera", "Bakery Roti Kita", "Co-working Hub", "Kantor Notaris Adi", "Sekolah Cendekia", "Klinik Sehat", "Butik Anggun", "Toko Oleh-oleh Sari", "Studio Foto Lumen", "Gym Prima", "Salon Cantika", "Pelanggan Umum"];
const CH = [["Toko", 0.38], ["Online", 0.27], ["Marketplace", 0.22], ["Reseller", 0.13]];

export function makeSample(months = 18) {
  const rnd = mulberry(20260101);
  const end = new Date(); end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end); start.setUTCMonth(start.getUTCMonth() - months); start.setUTCDate(1);
  const days = Math.round((end - start) / 86400000) + 1;
  const wP = P.reduce((s, p) => s + p[4], 0), wC = CUST.map((_, i) => 1 / (i + 1.4)), sC = wC.reduce((a, b) => a + b, 0);
  const pick = (ws, tot) => { let r = rnd() * tot; for (let i = 0; i < ws.length; i++) if ((r -= ws[i]) <= 0) return i; return ws.length - 1; };
  const rows = [], wdF = [0.85, 0.9, 0.95, 1, 1.15, 1.3, 1.1];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000), p = i / days;
    let n = (6 + 8 * p) * wdF[(d.getUTCDay() + 6) % 7] * (1 + 0.12 * Math.sin((d.getUTCMonth() / 12) * 2 * Math.PI + 1)) * (0.75 + rnd() * 0.5);
    if (i === Math.floor(days * 0.6)) n *= 2.8; // promo spike
    if (i === Math.floor(days * 0.82)) n *= 0.12; // outage
    for (let k = 0, c = Math.round(n); k < c; k++) {
      let r = rnd() * wP, pi = 0; for (; pi < P.length - 1; pi++) if ((r -= P[pi][4]) <= 0) break;
      const [name, cat, price, cr] = P[pi], qty = 1 + Math.floor(rnd() ** 2 * 5), disc = rnd() < 0.2 ? 0.05 + rnd() * 0.05 : 0;
      const revenue = Math.round((price * qty * (1 - disc)) / 500) * 500, cost = Math.round((price * cr * qty * (1 + 0.05 * p)) / 100) * 100;
      rows.push({ date: d.toISOString().slice(0, 10), product: name, category: cat, customer: CUST[pick(wC, sC)], channel: CH[pick(CH.map((c) => c[1]), 1)][0], qty, revenue, cost, expense: Math.round(revenue * (0.1 + rnd() * 0.04)) });
    }
  }
  return rows;
}
