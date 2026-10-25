import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { SUGGESTIONS } from "../../lib/localAi";
import { useTypewriter } from "../../hooks/useMotion";
import { signed } from "../../utils/format";
import { GenericChart } from "../charts";
import Icon from "../ui/Icon";

/** Safe mini-markdown (no HTML injection): **bold**, `code`, "- " bullets, "1. " lists. */
const inline = (s) => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i} className="font-semibold text-text-primary">{p.slice(2, -2)}</strong> : p.startsWith("`") && p.endsWith("`") && p.length > 2 ? <code key={i} className="rounded bg-surface-elevated px-1 font-mono text-[12px]">{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>);
export function Md({ text }) {
  const out = []; let list = null;
  const flush = () => { if (list) { const L = list; out.push(L.ord ? <ol key={out.length} className="my-1.5 list-decimal space-y-1 pl-5 marker:text-accent">{L.items.map((t, i) => <li key={i}>{inline(t)}</li>)}</ol> : <ul key={out.length} className="my-1.5 list-disc space-y-1 pl-5 marker:text-accent">{L.items.map((t, i) => <li key={i}>{inline(t)}</li>)}</ul>); list = null; } };
  for (const line of text.split("\n")) {
    const b = line.match(/^\s*[-•*]\s+(.*)/), n = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (b || n) { const ord = !!n; if (!list || list.ord !== ord) { flush(); list = { ord, items: [] }; } list.items.push((b ?? n)[1]); }
    else { flush(); if (line.trim()) out.push(<p key={out.length} className="my-1.5">{inline(line)}</p>); }
  }
  flush();
  return <div className="text-[13.5px] leading-6 text-text-secondary">{out}</div>;
}

function Blocks({ blocks }) {
  return <div className="mt-3 space-y-3">{blocks.map((b, i) => <div key={i} className="reveal" style={{ "--i": i }}>
    {b.type === "kpis" && <div className="grid grid-cols-2 gap-2">{b.items.map((k) => <div key={k.label} className="rounded-xl border border-border/80 bg-surface-primary/50 p-2.5"><p className="text-[11px] text-text-muted">{k.label}</p><p className="font-display text-base font-semibold tabular-nums">{k.value}</p>{k.delta != null && Number.isFinite(k.delta) && <p className={`text-[11px] ${k.delta >= 0 ? "financial-positive" : "financial-negative"}`}>{k.tone === "pp" ? `${k.delta >= 0 ? "▲ +" : "▼ −"}${Math.abs(k.delta).toFixed(1).replace(".", ",")} poin` : `${k.delta >= 0 ? "▲" : "▼"} ${signed(k.delta)}`}</p>}</div>)}</div>}
    {b.type === "chart" && <div className="rounded-xl border border-border/80 bg-surface-primary/50 p-3"><p className="mb-2 text-xs font-medium text-text-secondary">{b.title}</p><GenericChart block={b} /></div>}
    {b.type === "table" && <div className="overflow-x-auto rounded-xl border border-border/80 bg-surface-primary/50"><p className="px-3 pt-2.5 text-xs font-medium text-text-secondary">{b.title}</p><table className="mt-1 w-full text-left text-xs"><thead><tr className="border-b border-border/70">{b.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{c}</th>)}</tr></thead><tbody>{b.rows.map((r, ri) => <tr key={ri} className="border-b border-border-subtle last:border-0">{r.map((c, ci) => <td key={ci} className={`whitespace-nowrap px-3 py-1.5 tabular-nums ${ci === 0 ? "max-w-[170px] truncate font-medium text-text-primary" : "text-text-secondary"}`}>{c}</td>)}</tr>)}</tbody></table></div>}
  </div>)}</div>;
}

const SRC = { local: "Mesin analisis lokal", anthropic: "Claude", ollama: "Ollama" };
function Bubble({ m }) {
  const isUser = m.role === "user";
  const [shown, done] = useTypewriter(m.text, !isUser && m.fresh, 1400);
  if (isUser) return <div className="motion-message flex justify-end"><p className="max-w-[88%] rounded-2xl rounded-br-md bg-brand-gradient px-3.5 py-2 text-[13.5px] font-medium text-accent-foreground shadow-[0_8px_24px_-12px_var(--color-glow)]">{m.text}</p></div>;
  return <div className="motion-message flex gap-2.5">
    <span className="orb mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full p-[2px]"><span className="grid h-full w-full place-items-center rounded-full bg-surface-secondary text-accent"><Icon name="sparkle" className="h-3.5 w-3.5" /></span></span>
    <div className="min-w-0 flex-1"><div className={`glass rounded-2xl rounded-tl-md px-3.5 py-2.5 ${done ? "" : "caret"}`}><Md text={shown} />{done && m.blocks?.length > 0 && <Blocks blocks={m.blocks} />}</div>
      {done && <p className="mt-1 pl-1 text-[10px] text-text-muted">{SRC[m.source] ?? m.source}</p>}</div>
  </div>;
}

export default function ChatPanel({ compact = false }) {
  const { t, locale } = useLanguage();
  const { messages, busy, send, clear, provider } = useChat();
  const { meta, A, to } = useData();
  const [text, setText] = useState("");
  const end = useRef(null), input = useRef(null), scroller = useRef(null), inner = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, busy]);
  useEffect(() => { // keep the newest content in view while text/charts stream in, unless the user scrolled up
    const sc = scroller.current, el = inner.current; if (!sc || !el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => { if (sc.scrollHeight - sc.scrollTop - sc.clientHeight < 260) sc.scrollTop = sc.scrollHeight; });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const submit = (e) => { e?.preventDefault(); if (!text.trim() || busy) return; send(text); setText(""); };
  const label = provider.provider === "none" ? t("Mesin analisis lokal") : `${SRC[provider.provider]}${provider.model ? ` · ${provider.model}` : ""}`;
  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex items-center justify-between gap-2 border-b border-border/80 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5"><span className="orb grid h-8 w-8 place-items-center rounded-full p-[2px]"><span className="grid h-full w-full place-items-center rounded-full bg-surface-secondary text-accent"><Icon name="sparkle" /></span></span>
        <div className="min-w-0"><p className="font-display text-sm font-semibold">AIRA Assistant</p><p className="flex items-center gap-1.5 truncate text-[11px] text-text-muted"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-positive text-positive" />{label}</p></div></div>
      {messages.length > 0 && <button onClick={clear} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-text-muted transition-colors hover:bg-surface-elevated hover:text-negative" aria-label={t("Hapus percakapan")}><Icon name="trash" />{t("Hapus")}</button>}
    </div>
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite"><div ref={inner} className="space-y-4">
      {messages.length === 0 && <div className="reveal py-4 text-center">
        <div className="orb float mx-auto grid h-16 w-16 place-items-center rounded-full p-[3px] glow-accent"><span className="grid h-full w-full place-items-center rounded-full bg-surface-secondary text-accent"><Icon name="sparkle" className="h-7 w-7" /></span></div>
        <h2 className="mt-4 font-display text-lg font-semibold">{t("Tanyakan apa saja tentang keuangan Anda")}</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-text-secondary">{A ? <>{t("Saya menganalisis ")}<b className="text-text-primary">{A.rows.toLocaleString(locale)} {t("transaksi")}</b>{t(" transaksi dari ")}<b className="text-text-primary">{meta?.name}</b>.</> : t("Belum ada data aktif.")} {A && <Link to={to("/data")} className="text-accent underline-offset-2 hover:underline">{t("Ganti data")}</Link>}</p>
      </div>}
      {messages.map((m) => <Bubble key={m.id} m={m} />)}
      {busy && <div className="motion-message flex gap-2.5"><span className="orb grid h-7 w-7 place-items-center rounded-full p-[2px]"><span className="h-full w-full rounded-full bg-surface-secondary" /></span><div className="glass flex items-center gap-1 rounded-2xl rounded-tl-md px-4 py-3" role="status" aria-label={t("AIRA sedang menganalisis")}>{[0, 1, 2].map((i) => <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div>}
      <div ref={end} />
    </div></div>
    <div className="border-t border-border/80 p-3">
      {(messages.length === 0 || compact) && <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1">{SUGGESTIONS.slice(0, compact ? 4 : 6).map((s) => <button key={s} disabled={busy || !A} onClick={() => send(t(s))} className="shrink-0 rounded-full border border-border bg-surface-secondary/50 px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-accent/60 hover:text-text-primary disabled:opacity-40">{t(s)}</button>)}</div>}
      <form onSubmit={submit} className="glass flex items-end gap-2 rounded-2xl p-2 focus-within:border-accent/60 focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]">
        <textarea ref={input} rows={1} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }} disabled={!A} placeholder={t(A ? "Tanya: “margin bulan lalu”, “produk paling untung”, “prediksi”…" : "Unggah data terlebih dahulu")} aria-label={t("Pesan untuk AIRA")} className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-text-muted" />
        <button disabled={!text.trim() || busy || !A} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-accent-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-35" aria-label={t("Kirim")}><Icon name="send" /></button>
      </form>
      <p className="mt-1.5 text-center text-[10px] text-text-muted">{t("Angka dihitung dari data Anda. AI dapat keliru — verifikasi sebelum mengambil keputusan.")}</p>
    </div>
  </div>;
}
