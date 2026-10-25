import { Children, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { spotlight } from "../../hooks/useMotion";
import { useLanguage } from "../../context/LanguageContext";

export const DensityContext = createContext("standard");

/* ─── VARIANTS ─── */
const variants = {
  primary: "bg-brand-gradient text-accent-foreground shadow-[0_0_24px_-8px_var(--color-glow)] hover:brightness-110 hover:shadow-[0_0_30px_-4px_var(--color-glow)] active:scale-[.98]",
  ghost: "border border-border bg-surface-secondary/40 text-text-primary hover:border-accent/50 hover:bg-surface-elevated active:scale-[.98]",
  danger: "border border-negative/30 text-negative hover:bg-negative-bg active:scale-[.98]",
  subtle: "text-text-secondary hover:text-text-primary hover:bg-surface-elevated",
};

export const Button = ({ variant = "primary", className = "", ...p }) => {
  const { t } = useLanguage();
  return <button className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`} {...p}>{typeof p.children === "string" ? t(p.children) : p.children}</button>;
};

/* ─── FORM ELEMENTS ─── */
const fieldStyle = "h-9 w-full rounded-lg border border-border bg-surface-primary/60 px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent focus:bg-surface-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_22%,transparent)]";

export const Input = ({ className = "", ...p }) => <input className={`${fieldStyle} ${className}`} {...p} />;
export const Textarea = ({ className = "", ...p }) => <textarea className={`${fieldStyle} h-auto resize-none py-2 ${className}`} {...p} />;
export const Select = ({ children, className = "", ...p }) => <select className={`${fieldStyle} cursor-pointer ${className}`} {...p}>{children}</select>;

export const Field = ({ label, children }) => {
  const { t } = useLanguage();
  return <label className="block space-y-1.5">
    <span className="text-xs font-medium text-text-secondary">{t(label)}</span>
    {children}
  </label>;
};

/* ─── CARD ─── */
export const Card = ({ title, action, children, className = "", ...rest }) => {
  const { t } = useLanguage();
  return (
  <section onMouseMove={spotlight} className={`glass spot rounded-[18px] ${className}`} {...rest}>
    {title && (
      <header className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-3.5">
        <h2 className="font-display text-[15px] font-semibold text-text-primary">{t(title)}</h2>
        {action}
      </header>
    )}
    {children}
  </section>
  );
};

/* ─── PAGE HEADER ─── */
export const PageHeader = ({ title, desc, action }) => {
  const { t } = useLanguage();
  return (
  <div className="reveal mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-text-primary">{t(title)}</h1>
      <span className="mt-1.5 block h-[2px] w-12 rounded bg-brand-gradient" />
      {desc && <p className="mt-2 text-sm text-text-secondary">{t(desc)}</p>}
    </div>
    {action}
  </div>
  );
};

/* ─── TABLE ─── */
export function Table({ heads, children, density: initialDensity, label }) {
  const { t } = useLanguage();
  const preference = useContext(DensityContext);
  const preferredDensity = initialDensity ?? (preference === "advanced" ? "compact" : "comfortable");
  const [density, setDensity] = useState(preferredDensity);
  const [page, setPage] = useState(0);
  const rows = Children.toArray(children);
  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => setDensity(preferredDensity), [preferredDensity]);
  useEffect(() => { setPage((value) => Math.min(value, pageCount - 1)); }, [pageCount]);
  const compact = density === "compact";
  return <div>
    <div className="flex justify-end border-b border-border px-3 py-1.5"><button type="button" className="rounded-md px-2 py-1 text-[10px] text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary" aria-pressed={compact} onClick={() => setDensity((value) => value === "compact" ? "comfortable" : "compact")}>{compact ? t("Tampilan ringkas · ubah") : t("Tampilan nyaman · ubah")}</button></div>
    <div className="max-h-[70vh] overflow-auto">
      <table aria-label={label} className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface-secondary/95 backdrop-blur">
          <tr className="border-b border-border">
            {heads.map((h) => <th key={h} scope="col" className={`whitespace-nowrap px-4 ${compact ? "py-1.5" : "py-2.5"} text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted`}>{t(h)}</th>)}
          </tr>
        </thead>
        <tbody className={`divide-y divide-border-subtle [&_tr]:transition-colors [&_tr:hover]:bg-accent/[.06] ${compact ? "[&_td]:py-1.5" : "[&_td]:py-2.5"}`}>{rows.slice(page * pageSize, (page + 1) * pageSize)}</tbody>
      </table>
    </div>
    {rows.length > pageSize && <nav aria-label={t("Navigasi halaman tabel")} className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-text-muted"><span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} {t("dari")} {rows.length} {t("baris")}</span><div className="flex gap-1"><button type="button" className="rounded border border-border px-2 py-1 hover:bg-surface-elevated disabled:opacity-40" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} aria-label={t("Halaman sebelumnya")}>{t("Sebelumnya")}</button><button type="button" className="rounded border border-border px-2 py-1 hover:bg-surface-elevated disabled:opacity-40" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={page >= pageCount - 1} aria-label={t("Halaman berikutnya")}>{t("Berikutnya")}</button></div></nav>}
  </div>;
}

export const Td = ({ className = "", ...p }) => (
  <td className={`whitespace-nowrap px-4 py-2.5 text-sm text-text-primary tabular-nums ${className}`} {...p} />
);

/* ─── BADGE ─── */
const tone = {
  "In Stock": "bg-positive-bg text-positive",
  Tersedia: "bg-positive-bg text-positive",
  "Low Stock": "bg-warning-bg text-warning",
  "Stok rendah": "bg-warning-bg text-warning",
  "Out of Stock": "bg-negative-bg text-negative",
  Habis: "bg-negative-bg text-negative",
  IN: "bg-positive-bg text-positive",
  OUT: "bg-surface-elevated text-text-secondary",
  ADJUSTMENT: "bg-warning-bg text-warning",
  Masuk: "bg-positive-bg text-positive",
  Keluar: "bg-surface-elevated text-text-secondary",
  Penyesuaian: "bg-warning-bg text-warning",
};
export const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tone[children] ?? "bg-surface-elevated text-text-secondary"} ${className}`}>
    {children}
  </span>
);

/* ─── ASYNC STATE HANDLER ─── */
export function Async({ loading, error, data, reload, empty = "No data available.", children }) {
  const { t } = useLanguage();
  const box = "flex flex-col items-center justify-center px-4 py-16 text-sm text-text-secondary";
  if (loading) return (
    <div className="space-y-3 py-8" role="status" aria-label={t("Memuat data")}>
      <div className="skeleton h-8 w-48" /><div className="skeleton h-24 w-full" /><div className="skeleton h-40 w-full" />
      <span className="sr-only">{t("Memuat data…")}</span>
    </div>
  );
  if (error) return (
    <div className={box} role="alert">
      <p className="mb-3 text-negative">{t("Data belum dapat dimuat: ")}{error}</p>
      <Button variant="ghost" onClick={reload}>Coba lagi</Button>
    </div>
  );
  if (Array.isArray(data) && !data.length) return <EmptyState title={t("Belum ada data")} description={t(empty)} />;
  return children(data);
}

/* ─── MODAL ─── */
export function Modal({ title, onClose, children }) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);
  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 160);
  }, [closing, onClose]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [requestClose]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center bg-[#02060f]/70 backdrop-blur-sm sm:items-center ${closing ? "motion-overlay-exit" : "motion-overlay"}`} onClick={requestClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`max-h-[85vh] w-full overflow-y-auto rounded-t-2xl glass-strong p-6 shadow-2xl sm:max-w-md sm:rounded-2xl ${closing ? "motion-dialog-exit" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-title" className="mb-4 font-display text-lg font-semibold text-text-primary">{title}</h3>
        {typeof children === "function" ? children(requestClose) : children}
      </div>
    </div>
  );
}

export function FormModal({ title, onClose, onSubmit, children, label = "Save" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = (close) => async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await onSubmit(); close(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose}>
      {(close) => <form onSubmit={go(close)} className="space-y-3">
        {children}
        {err && <p className="text-sm text-negative">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={close}>Batal</Button>
          <Button disabled={busy}>{busy ? "Menyimpan…" : label}</Button>
        </div>
      </form>}
    </Modal>
  );
}

/* ─── TOAST ─── */
export const toast = (msg, type = "ok") => window.dispatchEvent(new CustomEvent("nova:toast", { detail: { msg, type } }));

export function Toaster() {
  const [t, set] = useState(null);
  useEffect(() => {
    const h = (e) => { set(e.detail); setTimeout(() => set(null), 3000); };
    window.addEventListener("nova:toast", h);
    return () => window.removeEventListener("nova:toast", h);
  }, []);
  if (!t) return null;
  return (
    <div role="status" aria-live="polite" className={`motion-message glass-strong fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-2xl ${t.type === "ok" ? "border-accent/40 text-text-primary" : "border-negative/40 text-negative"}`}>
      {t.msg}
    </div>
  );
}

export const confirmDelete = (what) => window.confirm(`Hapus ${what}? Tindakan ini tidak dapat dibatalkan.`);

/* ─── EMPTY STATE ─── */
export const EmptyState = ({ icon, title, description, action }) => {
  const { t } = useLanguage();
  return <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
    {icon && <div className="mb-3 text-3xl text-text-muted">{icon}</div>}
    <h3 className="text-sm font-medium text-text-primary">{t(title)}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{t(description)}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
};

/* ─── DEVELOPMENT PLACEHOLDER ─── */
export const DevPlaceholder = ({ title, description }) => (
  <div className="glass flex flex-col items-center justify-center rounded-2xl border-dashed px-6 py-20 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-elevated text-xs font-semibold tracking-widest text-accent glow-accent">AIRA</div>
    <h3 className="text-base font-semibold text-text-primary">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-text-secondary">{description}</p>
    <span className="mt-4 inline-flex items-center rounded border border-border bg-accent-subtle px-3 py-1 text-xs font-medium text-accent">Segera hadir</span>
  </div>
);
