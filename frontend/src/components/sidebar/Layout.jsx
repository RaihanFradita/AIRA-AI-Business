import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ChatProvider, useChat } from "../../context/ChatContext";
import { DataProvider, useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../hooks/useTheme";
import { DensityContext, Toaster } from "../ui";
import Icon from "../ui/Icon";
import ChatDrawer from "../ai/ChatDrawer";

const GROUPS = (demo) => [
  { title: "Command center", items: [["/", "Dashboard", "dashboard", true], ["/assistant", "AI Assistant", "chat", true], ["/data", "Data Studio", "upload", true]] },
  { title: "Analitik", items: [["/analysis", "Analisis mendalam", "chart", true], ["/income-statement", "Laba rugi", "statement", true], ...(demo ? [] : [["/reports", "Laporan", "file", true]])] },
  ...(demo ? [] : [{ title: "Operasional", items: [["/sales", "Transaksi", "cart"], ["/inventory", "Persediaan", "box"], ["/products", "Produk", "tag"], ["/customers", "Pelanggan", "users"]] }]),
  { title: "Preferensi", items: [["/settings", "Tampilan", "settings"]] },
];

function Brand({ collapsed, to }) {
  return <Link to={to} className="flex items-center gap-2.5 px-1" aria-label="AIRA Business">
    <span className="orb grid h-9 w-9 shrink-0 place-items-center rounded-xl p-[2px] glow-accent"><span className="grid h-full w-full place-items-center rounded-[10px] bg-surface-secondary font-display text-sm font-bold text-gradient">A</span></span>
    <span className={`font-display text-[15px] font-semibold tracking-tight ${collapsed ? "lg:sr-only" : ""}`}>AIRA <span className="font-normal text-text-muted">Business</span></span>
  </Link>;
}

function Shell({ demo }) {
  const { t, locale } = useLanguage();
  const { user, logout } = useAuth() ?? {};
  const { A, meta, to, loading } = useData();
  const { openDrawer, provider } = useChat();
  const [theme, toggle] = useTheme();
  const [open, setOpen] = useState(false), [collapsed, setCollapsed] = useState(false);
  const [density, setDensity] = useState(() => { try { return localStorage.getItem("aira_density") ?? "standard"; } catch { return "standard"; } });
  const [palette, setPalette] = useState(false), [pq, setPq] = useState(""), [account, setAccount] = useState(false);
  const loc = useLocation(), navigate = useNavigate();
  const isAdmin = demo || user?.role === "admin";
  const groups = useMemo(() => GROUPS(demo), [demo]);
  const pages = useMemo(() => groups.flatMap((g) => g.items.filter((i) => isAdmin || !i[3]).map(([p, label]) => ({ to: to(p === "/" ? "" : p), title: t(label), group: t("Halaman") }))), [groups, isAdmin, to, t]);
  const current = pages.find((p) => p.to === loc.pathname)?.title ?? t("Workspace");
  const items = useMemo(() => [
    ...pages, { act: "ask", title: pq.trim() ? `${t("Tanya AIRA")}: “${pq.trim()}”` : t("Buka AIRA Assistant"), group: "AI" },
    { to: to("/data"), title: t("Unggah data Excel"), group: t("Tindakan") },
  ].filter((i) => i.act || i.title.toLowerCase().includes(pq.toLowerCase())), [pages, pq, to, t]);
  const run = (i) => { setPalette(false); if (i.act === "ask") openDrawer(pq.trim() || null); else navigate(i.to); };
  const initials = (user?.name ?? "Demo").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const setDens = (v) => { try { localStorage.setItem("aira_density", v); } catch { /* ignore */ } setDensity(v); };

  useEffect(() => {
    const k = (e) => {
      const mod = e.metaKey || e.ctrlKey, key = e.key.toLowerCase();
      if (mod && key === "k") { e.preventDefault(); setPalette((v) => !v); setPq(""); }
      if (mod && key === "j") { e.preventDefault(); openDrawer(); }
      if (e.key === "Escape") { setPalette(false); setAccount(false); setOpen(false); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [openDrawer]);
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const link = ({ isActive }) => `group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] transition-all duration-200 ${isActive ? "bg-accent/10 font-medium text-text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_30%,transparent)]" : "text-text-secondary hover:bg-surface-elevated/70 hover:text-text-primary"}`;
  const srcLabel = t(({ sample: "Data contoh", excel: "Excel", database: "Database" })[meta?.source] ?? "Belum ada data");

  return <div className="relative min-h-screen bg-surface-primary text-text-primary lg:flex">
    <div className="app-bg" aria-hidden="true" />
    <header className="glass-strong sticky top-0 z-30 flex h-14 items-center justify-between px-4 lg:hidden">
      <button className="flex h-10 items-center gap-2" aria-label={t("Buka navigasi")} aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" className="h-5 w-5" /><span className="font-display text-sm font-semibold">AIRA</span></button>
      <span className="text-sm text-text-secondary">{current}</span>
    </header>
    {open && <button className="motion-overlay fixed inset-0 z-40 bg-[#02060f]/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-label={t("Tutup navigasi")} />}

    <aside className={`glass-strong fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col px-3 py-4 transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[76px]" : "lg:w-[256px]"}`}>
      <div className="mb-5 flex h-10 items-center justify-between"><Brand collapsed={collapsed} to={to("")} />
        <button className="hidden h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary lg:flex" onClick={() => setCollapsed((v) => !v)} aria-label={t(collapsed ? "Perluas sidebar" : "Ciutkan sidebar")}><Icon name="panel" /></button></div>
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto" aria-label={t("Navigasi aplikasi")}>
        {groups.map((g) => <section key={g.title}>
          <h2 className={`mb-1.5 px-3 font-sans text-[10px] font-semibold uppercase tracking-[.14em] text-text-muted ${collapsed ? "lg:sr-only" : ""}`}>{t(g.title)}</h2>
          <div className="space-y-0.5">{g.items.filter((i) => isAdmin || !i[3]).map(([p, label, icon]) => <NavLink key={p} to={to(p === "/" ? "" : p)} end={p === "/"} className={`${link} ${collapsed ? "lg:justify-center lg:px-0" : ""}`} title={collapsed ? t(label) : undefined}>
            {({ isActive }) => <><span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand-gradient transition-all ${isActive ? "opacity-100" : "scale-y-0 opacity-0"}`} /><Icon name={icon} className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-accent" : ""}`} /><span className={collapsed ? "lg:sr-only" : ""}>{t(label)}</span></>}
          </NavLink>)}</div>
        </section>)}
      </nav>
      <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
        <button onClick={() => openDrawer()} className={`glass glow-hover relative w-full overflow-hidden rounded-xl p-3 text-left ${collapsed ? "lg:hidden" : ""}`}><span className="scanline" /><p className="flex items-center gap-2 text-xs font-medium"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-positive text-positive" />{t("AIRA Engine online")}</p><p className="mt-1 truncate text-[11px] text-text-muted">{demo ? t("Mesin analisis lokal") : provider.provider === "none" ? t("Mesin analisis lokal") : `${provider.provider} · ${provider.model}`}</p><p className="mt-1.5 text-[10px] text-accent">{t("Tanya AI · Ctrl J")}</p></button>
        <div className={`flex items-center gap-2.5 px-1 ${collapsed ? "lg:justify-center" : ""}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-accent-foreground">{initials}</span><div className={collapsed ? "lg:sr-only" : "min-w-0 flex-1"}><p className="truncate text-xs font-semibold">{user?.name ?? t("Mode Demo")}</p><p className="text-[10px] text-text-muted">{demo ? t("Data contoh") : user.role === "admin" ? t("Administrator") : t("Staff")}</p></div></div>
      </div>
    </aside>

    <main className="relative z-10 min-w-0 flex-1">
      <div className="glass-strong sticky top-14 z-20 border-x-0 border-t-0 lg:top-0">
        <div className="mx-auto flex min-h-14 max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <div className="hidden md:block"><p className="text-[10px] uppercase tracking-[.14em] text-text-muted">AIRA Business / {demo ? t("Demo") : t("Workspace")}</p><h1 className="mt-0.5 font-display text-lg font-semibold tracking-tight">{current}</h1></div>
          <div className="ml-auto flex items-center gap-2">
            <Link to={to("/data")} className="glow-hover hidden h-9 items-center gap-2 rounded-xl border border-border bg-surface-secondary/40 px-3 text-xs sm:flex" title={meta?.name}><Icon name={meta?.source === "database" ? "db" : "file"} className="h-3.5 w-3.5 text-accent" /><span className="max-w-[180px] truncate">{loading ? t("Memuat…") : srcLabel}{A ? ` · ${A.rows.toLocaleString(locale)} ${t("baris")}` : ""}</span></Link>
            <button onClick={() => { setPalette(true); setPq(""); }} className="hidden h-9 min-w-40 items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary/40 px-3 text-xs text-text-secondary transition-colors hover:border-accent/50 md:flex" aria-keyshortcuts="Control+K Meta+K"><span className="flex items-center gap-2"><Icon name="search" className="h-3.5 w-3.5" />{t("Cari…")}</span><kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd></button>
            <button onClick={() => { setPalette(true); setPq(""); }} className="grid h-9 w-9 place-items-center rounded-xl border border-border md:hidden" aria-label={t("Cari")}><Icon name="search" /></button>
            <button onClick={() => openDrawer()} className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-xs font-semibold text-accent-foreground shadow-[0_0_24px_-8px_var(--color-glow)] transition-all hover:brightness-110 active:scale-95"><Icon name="sparkle" />{t("Tanya AI")}</button>
            <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-xl border border-border text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary" aria-label={t(theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap")}><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
            {demo ? <Link to="/" className="h-9 rounded-xl border border-border px-3 text-xs leading-9 text-text-secondary hover:border-accent/50">{t("Keluar demo")}</Link> :
              <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAccount(false); }}>
                <button onClick={() => setAccount((v) => !v)} className="flex h-9 items-center gap-2 rounded-xl px-1.5 hover:bg-surface-elevated" aria-haspopup="menu" aria-expanded={account} aria-label={t("Menu akun")}><span className="grid h-8 w-8 place-items-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">{initials}</span></button>
                {account && <div role="menu" className="glass-strong absolute right-0 top-11 z-40 w-52 rounded-xl p-1 shadow-2xl"><div className="border-b border-border px-3 py-2"><p className="truncate text-xs font-medium">{user.name}</p><p className="text-xs capitalize text-text-secondary">{user.role}</p></div><Link role="menuitem" to="/settings" onClick={() => setAccount(false)} className="block rounded-lg px-3 py-2 text-xs hover:bg-surface-elevated">{t("Preferensi tampilan")}</Link><button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-negative hover:bg-negative-bg"><Icon name="logout" className="h-3.5 w-3.5" />{t("Keluar akun")}</button></div>}
              </div>}
          </div>
        </div>
      </div>
      <DensityContext.Provider value={density}>
        <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8"><div key={loc.pathname} className="motion-page"><Outlet context={{ density, setDensity: setDens }} /></div></div>
      </DensityContext.Provider>
    </main>

    {!loc.pathname.endsWith("/assistant") && <button onClick={() => openDrawer()} className="orb glow-accent fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full p-[2.5px] transition-transform hover:scale-110 active:scale-95 lg:bottom-7 lg:right-7" aria-label={t("Buka AIRA Assistant")}><span className="pulse-dot grid h-full w-full place-items-center rounded-full bg-surface-secondary text-accent"><Icon name="sparkle" className="h-6 w-6" /></span></button>}
    <ChatDrawer />
    {palette && <div className="motion-overlay fixed inset-0 z-[70] flex items-start justify-center bg-[#02060f]/60 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setPalette(false); }}>
      <section role="dialog" aria-modal="true" aria-label="Command palette" className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
        <label className="flex items-center gap-3 border-b border-border px-4"><Icon name="search" className="text-text-muted" /><input autoFocus value={pq} onChange={(e) => setPq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && items[0]) run(items.find((i) => i.title.toLowerCase() === pq.toLowerCase()) ?? items[0]); }} placeholder="Cari halaman atau tanyakan sesuatu ke AIRA…" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted" /></label>
        <div className="max-h-[50vh] overflow-y-auto p-1.5">{items.length ? items.map((i) => <button key={`${i.to}-${i.title}`} onClick={() => run(i)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/10"><span className="truncate">{i.title}</span><span className="ml-3 shrink-0 text-xs text-text-muted">{i.group}</span></button>) : <p className="px-3 py-8 text-center text-sm text-text-secondary">Tidak ada hasil.</p>}</div>
        <div className="border-t border-border px-4 py-2 text-[11px] text-text-muted">Enter buka · Ctrl/⌘ K palette · Ctrl/⌘ J asisten · Esc tutup</div>
      </section></div>}
    <Toaster />
  </div>;
}

export default function Layout({ demo = false }) {
  return <DataProvider mode={demo ? "demo" : "app"}><ChatProvider><Shell demo={demo} /></ChatProvider></DataProvider>;
}
