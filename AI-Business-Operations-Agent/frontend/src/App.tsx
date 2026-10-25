import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { checkApiHealth, sendChatMessage } from "./api";

type Theme = "light" | "dark";
type Density = "simple" | "standard" | "advanced";
type ApiState = "checking" | "online" | "offline";
type ChatMessage = { id: string; role: "user" | "assistant"; text: string; status?: "processing" | "error" };
type WorkspaceContext = {
  apiState: ApiState;
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  retryMessage: (message: string, id: string) => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  density: Density;
  setDensity: (density: Density) => void;
};

const navGroups = [
  { label: "WORKSPACE", links: [{ to: "/", label: "Dashboard", icon: "grid" }] },
  { label: "KEUANGAN", links: [
    { to: "/finance/income-statement", label: "Income statement", icon: "file", planned: true },
    { to: "/finance/balance-sheet", label: "Balance sheet", icon: "layers", planned: true },
    { to: "/finance/cash-flow", label: "Cash flow", icon: "activity", planned: true },
    { to: "/transactions", label: "Transactions", icon: "list", planned: true },
  ] },
  { label: "ANALISIS", links: [
    { to: "/analytics/sales", label: "Sales analytics", icon: "chart", planned: true },
    { to: "/reports", label: "Reports", icon: "file", planned: true },
  ] },
  { label: "AIRA", links: [{ to: "/chat", label: "AI Assistant", icon: "spark" }] },
  { label: "WORKSPACE", links: [
    { to: "/company", label: "Company profile", icon: "building", planned: true },
    { to: "/settings", label: "Preferences", icon: "settings" },
  ] },
];

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/chat": "AIRA Assistant",
  "/finance/income-statement": "Income statement",
  "/finance/balance-sheet": "Balance sheet",
  "/finance/cash-flow": "Cash flow",
  "/transactions": "Transactions",
  "/analytics/sales": "Sales analytics",
  "/reports": "Reports",
  "/company": "Company profile",
  "/settings": "Preferences",
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></>,
    file: <><path d="M13 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3.5V10h7M8 14h8M8 17h8"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></>,
    chart: <><path d="M4 19.5V4.5M4 19.5h16"/><path d="m7 15 4-4 3 2 5-6"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    building: <><rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M8 7.5h2M14 7.5h2M8 11.5h2M14 11.5h2M10 20v-4h4v4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  };
  return <svg {...common}>{paths[name] ?? paths.grid}</svg>;
}

function App() {
  const savedTheme = localStorage.getItem("aira-agent-theme") as Theme | null;
  const [theme, setThemeState] = useState<Theme>(savedTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [manualTheme, setManualTheme] = useState(savedTheme !== null);
  const [density, setDensityState] = useState<Density>((localStorage.getItem("aira-agent-density") as Density | null) ?? "standard");
  const [apiState, setApiState] = useState<ApiState>("checking");

  useEffect(() => {
    if (manualTheme) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const changeTheme = (event: MediaQueryListEvent) => setThemeState(event.matches ? "dark" : "light");
    media.addEventListener("change", changeTheme);
    return () => media.removeEventListener("change", changeTheme);
  }, [manualTheme]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const healthy = await checkApiHealth();
      if (active) setApiState(healthy ? "online" : "offline");
    };
    void check();
    const interval = window.setInterval(check, 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const setTheme = (next: Theme) => {
    localStorage.setItem("aira-agent-theme", next);
    setManualTheme(true);
    setThemeState(next);
  };
  const setDensity = (next: Density) => {
    localStorage.setItem("aira-agent-density", next);
    setDensityState(next);
  };

  return <div className="app-shell" data-theme={theme}>
    <Routes>
      <Route element={<Workspace apiState={apiState} theme={theme} setTheme={setTheme} density={density} setDensity={setDensity} />}>
        <Route index element={<Dashboard apiState={apiState} density={density} />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="finance/income-statement" element={<PlannedPage title="Income statement" detail="Belum tersedia: agent tidak memiliki data akun atau laporan laba rugi terstruktur." />} />
        <Route path="finance/balance-sheet" element={<PlannedPage title="Balance sheet" detail="Belum tersedia: tidak ada koneksi ke aset, liabilitas, atau ekuitas." />} />
        <Route path="finance/cash-flow" element={<PlannedPage title="Cash flow" detail="Belum tersedia: agent tidak mengakses saldo kas atau arus kas." />} />
        <Route path="transactions" element={<PlannedPage title="Transactions" detail="Belum ada endpoint transaksi. Analisis yang tersedia membaca dataset penjualan melalui chat agent." />} />
        <Route path="analytics/sales" element={<PlannedPage title="Sales analytics" detail="Analisis deterministic tersedia lewat AIRA Assistant. Dashboard chart menunggu API analitik terstruktur." />} />
        <Route path="reports" element={<PlannedPage title="Reports" detail="Belum tersedia: API belum menghasilkan laporan yang dapat diekspor." />} />
        <Route path="company" element={<PlannedPage title="Company profile" detail="Profil perusahaan dan multi-company belum diimplementasikan." />} />
        <Route path="settings" element={<SettingsPage density={density} setDensity={setDensity} theme={theme} setTheme={setTheme} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </div>;
}

function useWorkspace() {
  const context = useOutletContext<WorkspaceContext | undefined>();
  if (!context) throw new Error("Workspace context is missing");
  return context;
}

function Workspace({ apiState, theme, setTheme, density, setDensity }: Pick<WorkspaceContext, "apiState" | "theme" | "setTheme" | "density" | "setDensity">) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const requestAgent = async (message: string, assistantId: string) => {
    setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, status: "processing", text: "" } : item));
    try {
      const answer = await sendChatMessage(message);
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, text: answer, status: undefined } : item));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Asisten belum dapat menjawab. Coba lagi sebentar.";
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, text: detail, status: "error" } : item));
    }
  };
  const sendMessage = async (value: string) => {
    const message = value.trim();
    if (!message || messages.some((item) => item.status === "processing")) return;
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: message }, { id: assistantId, role: "assistant", text: "", status: "processing" }]);
    await requestAgent(message, assistantId);
  };
  const retryMessage = (message: string, id: string) => requestAgent(message, id);
  const context = useMemo(() => ({ apiState, messages, sendMessage, retryMessage, theme, setTheme, density, setDensity }), [apiState, messages, theme, density]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setCommandOpen((open) => !open); setCommandQuery("");
      }
      if (event.key === "Escape") { setCommandOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pageTitle = routeTitles[location.pathname] ?? "Workspace";
  const commandItems = navGroups.flatMap((group) => group.links).filter((item) => item.label.toLowerCase().includes(commandQuery.toLowerCase()));
  const openRoute = (path: string) => { navigate(path); setCommandOpen(false); setMobileOpen(false); };

  return <div className={`workspace density-${density}`}>
    {mobileOpen && <button className="mobile-scrim" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
      <div className="brand-row"><Link to="/" className="brand" onClick={() => setMobileOpen(false)}><span className="brand-mark">A</span><span className="brand-name">AIRA <span>Business</span></span></Link><button className="icon-button collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Perluas navigasi" : "Persempit navigasi"}><Icon name="list" /></button><button className="icon-button close-sidebar" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi"><Icon name="close" /></button></div>
      <div className="workspace-label"><span className="workspace-dot" /><span>LOCAL WORKSPACE</span></div>
      <nav className="side-nav" aria-label="Navigasi utama">
        {navGroups.map((group, groupIndex) => <section className="nav-group" key={`${group.label}-${groupIndex}`}>
          <h2>{group.label}</h2>
          {group.links.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} title={collapsed ? item.label : undefined}>
            <Icon name={item.icon} /><span className="nav-link-label">{item.label}</span>{item.planned && <span className="planned-dot" title="Belum terhubung">—</span>}
          </NavLink>)}
        </section>)}
      </nav>
      <div className="sidebar-footer"><div className="footer-mark">AI</div><span className="footer-copy">Local-first agent<br /><strong>Python · Ollama</strong></span><span className="footer-status" aria-label="Local agent integration" /></div>
    </aside>

    <div className="workspace-main">
      <header className="topbar">
        <div className="topbar-title"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi"><Icon name="menu" /></button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><h1>{pageTitle}</h1></div></div>
        <div className="topbar-actions"><ApiStatus state={apiState} /><button className="search-trigger" onClick={() => { setCommandOpen(true); setCommandQuery(""); }}><Icon name="search" /><span>Search or jump to…</span><kbd>Ctrl K</kbd></button><button className="icon-button theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? "☼" : "◐"}</button><span className="avatar" title="Authentication is not configured">L</span></div>
      </header>
      <main className="page-content" key={location.pathname}><Outlet context={context} /></main>
    </div>

    {commandOpen && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setCommandOpen(false); }}><section className="command-dialog" role="dialog" aria-modal="true" aria-label="Command palette"><label className="command-input"><Icon name="search" /><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Search pages…" onKeyDown={(event) => { if (event.key === "Enter" && commandItems[0]) openRoute(commandItems[0].to); }} /><kbd>ESC</kbd></label><div className="command-results">{commandItems.length ? commandItems.map((item) => <button key={item.to} onClick={() => openRoute(item.to)}><Icon name={item.icon} /><span>{item.label}</span>{item.planned && <small>Planned</small>}</button>) : <p>No matching pages.</p>}</div><footer>Navigate with Enter <span>·</span> Close with Esc</footer></section></div>}
  </div>;
}

function ApiStatus({ state }: { state: ApiState }) {
  const label = state === "online" ? "API connected" : state === "offline" ? "API offline" : "Checking API";
  return <span className={`api-status api-${state}`} title="This checks the web API only. Ollama is checked when a chat request runs."><i />{label}</span>;
}

function Dashboard({ apiState, density }: { apiState: ApiState; density: Density }) {
  return <div className="page-enter">
    <PageHeading eyebrow="OVERVIEW" title="Business overview" description="A clear view of what is connected and what still needs a data source." />
    <div className="kpi-grid">
      {[["Total revenue", "Revenue data is not connected"], ["Total expenses", "No expense source available"], ["Net profit", "Requires trusted accounting data"], ["Cash balance", "No balance source available"]].map(([label, note]) => <article className="panel kpi-card" key={label}><div className="kpi-heading"><span>{label}</span><span className="status-tag neutral">NOT CONNECTED</span></div><p className="kpi-value">—</p><p className="kpi-note">{note}</p></article>)}
    </div>
    <div className="source-notice"><span className="notice-icon">i</span><div><strong>Dashboard data is not connected yet.</strong><p>The current Python agent reads sales datasets for chat analysis. It does not expose structured metrics for these cards or charts.</p></div><span className="notice-api">{apiState === "online" ? "API reachable" : apiState === "offline" ? "API unavailable" : "Checking API"}</span></div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Financial performance</h2><p>Revenue, expenses and net profit</p></div><button className="select-like" disabled>Period <span>Unavailable</span></button></div><div className="chart-empty"><div className="empty-mark"><Icon name="chart" size={22} /></div><strong>No verified series to display</strong><p>Connect a structured financial data source before charting performance.</p></div></section>
      {density !== "simple" && <section className="panel source-panel"><div className="panel-heading"><div><h2>Data sources</h2><p>Current integration status</p></div></div><div className="source-row"><span className="source-icon"><Icon name="building" /></span><div><strong>Sales dataset</strong><small>Read by the Python agent during analysis</small></div><span className="status-tag neutral">CHAT ONLY</span></div><div className="source-row"><span className="source-icon"><Icon name="activity" /></span><div><strong>Dashboard API</strong><small>Health endpoint is available</small></div><span className={`status-tag ${apiState === "online" ? "success" : "neutral"}`}>{apiState === "online" ? "CONNECTED" : apiState === "offline" ? "OFFLINE" : "CHECKING"}</span></div><p className="source-footnote">API health does not confirm Ollama availability. Ollama is checked when chat runs.</p></section>}
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Transaction endpoint not connected</p></div><Link className="text-link" to="/transactions">View details <Icon name="arrow" size={14} /></Link></div><EmptyRow title="No transactions available" detail="The current API does not expose transaction records." /></section>
      {density === "advanced" && <section className="panel report-panel"><div className="panel-heading"><div><h2>Financial reports</h2><p>Planned modules · no accounting data connected</p></div></div><div className="report-links"><Link to="/finance/income-statement">Income statement <span>Unavailable</span></Link><Link to="/finance/balance-sheet">Balance sheet <span>Unavailable</span></Link><Link to="/finance/cash-flow">Cash flow <span>Unavailable</span></Link></div></section>}
    </div>
  </div>;
}

function ChatPage() {
  const { apiState, messages, sendMessage, retryMessage } = useWorkspace();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const processing = messages.some((message) => message.status === "processing");
  const suggestions = ["Analyze the sales data", "Which product sold the most?", "What is the total profit margin?"];

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "end" }), [messages]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || processing) return;
    setDraft("");
    await sendMessage(message);
  };

  return <div className="page-enter chat-page">
    <PageHeading eyebrow="AIRA INTELLIGENCE" title="Business assistant" description="Ask about the sales data available to the local Python agent." action={<ApiStatus state={apiState} />} />
    <section className="panel chat-panel">
      <div className="chat-toolbar"><div className="assistant-identity"><span className="assistant-mark">A</span><div><strong>AIRA Assistant</strong><small>Ollama · Gemma 3 4B</small></div></div><div className="chat-context"><span className="context-dot" />Local agent</div></div>
      <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
        {!messages.length ? <div className="chat-welcome"><span className="welcome-label">LOCAL BUSINESS AGENT</span><h2>What would you like to understand?</h2><p>Questions use the existing agent and its available deterministic tools. No chat history is saved on the server.</p><div className="suggestion-list">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void sendMessage(suggestion)} disabled={processing}>{suggestion}<Icon name="arrow" size={15} /></button>)}</div></div> : messages.map((message) => <article key={message.id} className={`chat-message ${message.role === "user" ? "user-message" : "assistant-message"}`}>
          <span className={`message-avatar ${message.role}`}>{message.role === "user" ? "Y" : "A"}</span><div className="message-body"><div className="message-meta">{message.role === "user" ? "You" : "AIRA"}<span>{message.role === "assistant" && message.status === "processing" ? "Working" : message.role === "assistant" && !message.status ? "Agent response" : ""}</span></div>
            {message.status === "processing" ? <div className="processing-state" role="status"><span className="typing-dots"><i /><i /><i /></span><span>Waiting for the agent response…</span></div> : <p className={message.status === "error" ? "message-error" : "message-text"}>{message.text}</p>}
            {message.status === "error" && <button className="retry-button" onClick={() => void retryMessage(messages[messages.indexOf(message) - 1]?.text ?? "", message.id)}>Try again</button>}
            {message.role === "assistant" && !message.status && <small className="message-caveat">The agent does not provide source citations. Verify important figures against the dataset.</small>}
          </div>
        </article>)}
        <div ref={bottomRef} />
      </div>
      <form className="chat-composer" onSubmit={submit}><label className="sr-only" htmlFor="chat-input">Your message</label><textarea id="chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask about your sales data…" maxLength={2000} disabled={processing} rows={2} /><div className="composer-footer"><span>Answers use the current local dataset · max 2,000 characters</span><button type="submit" className="primary-button" disabled={!draft.trim() || processing}>{processing ? "Processing…" : "Send message"}<Icon name="arrow" size={15} /></button></div></form>
      <div className="chat-disclaimer">No persistent conversation history · No financial statements or company database connected</div>
    </section>
  </div>;
}

function SettingsPage({ density, setDensity, theme, setTheme }: Pick<WorkspaceContext, "density" | "setDensity" | "theme" | "setTheme">) {
  return <div className="page-enter"><PageHeading eyebrow="PREFERENCES" title="Workspace preferences" description="Saved in this browser. These preferences do not change data access or calculations." />
    <div className="settings-stack"><section className="panel settings-panel"><div className="settings-heading"><h2>Information density</h2><p>Choose how much detail appears in the workspace.</p></div><div className="density-options">{([["simple", "Simple", "Essential dashboard panels."], ["standard", "Standard", "Balanced overview and detail."], ["advanced", "Advanced", "Additional dashboard panels and denser review." ]] as const).map(([value, label, detail]) => <label key={value} className={density === value ? "density-option selected" : "density-option"}><input type="radio" name="density" value={value} checked={density === value} onChange={() => setDensity(value)} /><span><strong>{label}</strong><small>{detail}</small></span></label>)}</div></section>
      <section className="panel settings-panel"><div className="settings-heading"><h2>Appearance</h2><p>Theme follows your system until you make a manual choice.</p></div><div className="appearance-control"><div><strong>{theme === "dark" ? "Dark theme" : "Light theme"}</strong><small>Stored locally in this browser</small></div><button className="secondary-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Switch to {theme === "dark" ? "light" : "dark"}</button></div></section></div>
  </div>;
}

function PlannedPage({ title, detail }: { title: string; detail: string }) {
  return <div className="page-enter"><PageHeading eyebrow="MODULE STATUS" title={title} description="Planned module · backend support required" /><section className="panel planned-panel"><span className="status-tag neutral">NOT CONNECTED</span><h2>This module is not available yet</h2><p>{detail}</p><Link className="text-link" to="/chat">Ask about available sales data <Icon name="arrow" size={14} /></Link></section></div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function EmptyRow({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-row"><span className="empty-mark"><Icon name="list" size={19} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

export default App;
