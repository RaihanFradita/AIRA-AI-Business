const getLocale = () => {
  try { return localStorage.getItem("aira_language") === "en-US" ? "en-US" : "id-ID"; }
  catch { return "id-ID"; }
};
export const rp = (n) => `${n < 0 ? "−" : ""}Rp ${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(Math.abs(n ?? 0))}`;
export const compact = (n = 0) => `${n < 0 ? "−" : ""}Rp ${new Intl.NumberFormat(getLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(n))}`;
export const date = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString(getLocale(), { day: "2-digit", month: "short", year: "numeric" });
};
export const number = (n) => new Intl.NumberFormat(getLocale()).format(n ?? 0);

/** Human-friendly rupiah: "Rp 1,2 jt", "Rp 3,4 M". Deterministic (no ICU dependency). */
export const short = (n = 0, prefix = "Rp ") => {
  const a = Math.abs(n), s = n < 0 ? "−" : "";
  const english = getLocale() === "en-US";
  const f = (v, u) => `${s}${prefix}${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: v >= 100 ? 0 : 1 }).format(v)} ${u}`;
  if (a >= 1e12) return f(a / 1e12, "T");
  if (a >= 1e9) return f(a / 1e9, english ? "B" : "M");
  if (a >= 1e6) return f(a / 1e6, english ? "M" : "jt");
  if (a >= 1e3) return f(a / 1e3, english ? "K" : "rb");
  return `${s}${prefix}${Math.round(a)}`;
};
export const pct = (n, d = 1) => (n == null || !Number.isFinite(n) ? "—" : `${new Intl.NumberFormat(getLocale(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)}%`);
export const signed = (n, d = 1) => (n == null || !Number.isFinite(n) ? "—" : `${n >= 0 ? "+" : "−"}${new Intl.NumberFormat(getLocale(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(Math.abs(n))}%`);
