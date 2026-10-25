import { useEffect, useId, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import Icon from "../ui/Icon";
import { spotlight, useCountUp } from "../../hooks/useMotion";
import { pct, short, signed } from "../../utils/format";

export const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-6)"];
const C = { cyan: COLORS[0], green: COLORS[1], amber: COLORS[2], violet: COLORS[3], rose: COLORS[4], blue: COLORS[5] };
const ANIM = 1300;
const axis = { tick: { fill: "var(--color-text-muted)", fontSize: 11 }, tickLine: false, axisLine: false };
const grid = <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" strokeDasharray="3 5" />;
const moneyTick = (v) => short(v, "");
const cursorLine = { stroke: "var(--color-accent)", strokeOpacity: 0.35, strokeDasharray: "3 4" };
const cursorBar = { fill: "var(--color-accent)", fillOpacity: 0.07 };
const trunc = (s, n = 22) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : s);
const uid = (raw) => raw.replace(/[^a-zA-Z0-9]/g, "");

function Grad({ id, color, from = 0.42 }) {
  return <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={from} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient>;
}

export function Tip({ active, payload, label, money = true, suffix = "", formats = {}, hide = ["range", "band"] }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value != null && !hide.includes(p.dataKey) && !Array.isArray(p.value));
  if (!rows.length) return null;
  return <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-2xl">
    {label != null && <p className="mb-1 font-semibold text-text-primary">{label}</p>}
    {rows.map((p) => {
      const f = formats[p.dataKey] ?? (money ? (v) => short(v) : (v) => `${Number(v).toLocaleString("id-ID")}${suffix}`);
      return <p key={p.dataKey} className="flex items-center gap-2 text-text-secondary"><span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} />{p.name}<b className="ml-auto pl-4 tabular-nums text-text-primary">{f(p.value)}</b></p>;
    })}
  </div>;
}

/* ─────────────── KPI ─────────────── */
export function Sparkline({ data, dataKey = "v", color = C.cyan, height = 40 }) {
  const id = uid(useId());
  return <ResponsiveContainer width="100%" height={height}><AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}><defs><Grad id={id} color={color} from={0.35} /></defs><Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.6} fill={`url(#${id})`} dot={false} isAnimationActive animationDuration={ANIM} /></AreaChart></ResponsiveContainer>;
}

export function KpiCard({ label, value, format = short, delta, pp = false, invert = false, spark, color = C.cyan, i = 0, hint, icon }) {
  const v = useCountUp(value);
  const good = delta == null ? null : invert ? delta <= 0 : delta >= 0;
  return <div onMouseMove={spotlight} className={`glass spot glow-hover lift reveal relative overflow-hidden rounded-[18px] p-4 ${spark ? "pb-12" : ""}`} style={{ "--i": i }}>
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-text-secondary">{label}</span>{icon && <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-subtle text-accent"><Icon name={icon} /></span>}</div>
    <div className="mt-2 font-display text-[clamp(1.3rem,1.7vw,1.7rem)] font-semibold leading-tight tabular-nums">{format(v)}</div>
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {delta != null && Number.isFinite(delta) && <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${good ? "bg-positive-bg text-positive" : "bg-negative-bg text-negative"}`}><Icon name={delta >= 0 ? "up" : "down"} className="h-3 w-3" strokeWidth={2.4} />{pp ? `${Math.abs(delta).toFixed(1).replace(".", ",")} poin` : signed(Math.abs(delta)).slice(1)}</span>}
      {hint && <span className="text-text-muted">{hint}</span>}
    </div>
    {spark && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-11 opacity-90"><Sparkline data={spark} color={color} height={44} /></div>}
  </div>;
}

const toneUI = { positive: ["up", "text-positive", "bg-positive-bg"], negative: ["down", "text-negative", "bg-negative-bg"], warning: ["warn", "text-warning", "bg-warning-bg"], info: ["sparkle", "text-accent", "bg-accent-subtle"] };
export function InsightCard({ tone = "info", title, text, i = 0 }) {
  const [icon, fg, bg] = toneUI[tone] ?? toneUI.info;
  return <div className="reveal glow-hover flex gap-3 rounded-xl border border-border/80 bg-surface-primary/40 p-3" style={{ "--i": i }}>
    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${bg} ${fg}`}><Icon name={icon} /></span>
    <div className="min-w-0"><p className="text-[13px] font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-text-secondary">{text}</p></div>
  </div>;
}

/* ─────────────── Revenue / profit / margin ─────────────── */
export function RevenueProfitChart({ data, hasCost, height = 320 }) {
  const id = uid(useId());
  return <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={data} margin={{ top: 8, right: hasCost ? 4 : 8, left: -8, bottom: 0 }}>
      <defs><Grad id={`${id}r`} color={C.cyan} /><Grad id={`${id}g`} color={C.green} from={0.35} /></defs>
      {grid}
      <XAxis dataKey="label" {...axis} minTickGap={24} />
      <YAxis yAxisId="l" {...axis} tickFormatter={moneyTick} width={52} />
      {hasCost && <YAxis yAxisId="r" orientation="right" {...axis} tickFormatter={(v) => `${v}%`} width={40} domain={[0, (m) => Math.min(100, Math.ceil((m + 8) / 10) * 10)]} />}
      <Tooltip cursor={cursorLine} content={<Tip formats={{ margin: (v) => pct(v) }} />} />
      <Area yAxisId="l" type="monotone" dataKey="revenue" name="Pendapatan" stroke={C.cyan} strokeWidth={2.2} fill={`url(#${id}r)`} animationDuration={ANIM} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-surface-secondary)" }} />
      {hasCost && <Area yAxisId="l" type="monotone" dataKey="gross" name="Laba kotor" stroke={C.green} strokeWidth={2} fill={`url(#${id}g)`} animationDuration={ANIM} animationBegin={150} />}
      {hasCost && <Line yAxisId="r" type="monotone" dataKey="margin" name="Margin" stroke={C.amber} strokeWidth={2} strokeDasharray="5 4" dot={false} animationDuration={ANIM} animationBegin={300} />}
    </ComposedChart>
  </ResponsiveContainer>;
}

export function MarginArea({ data, avg, height = 150 }) {
  const id = uid(useId());
  return <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <defs><Grad id={id} color={C.amber} from={0.4} /></defs>
      {grid}<XAxis dataKey="label" {...axis} minTickGap={28} /><YAxis {...axis} width={40} tickCount={4} tickFormatter={(v) => `${Math.round(v)}%`} domain={[(m) => Math.floor(m - 4), (m) => Math.ceil(m + 4)]} />
      <Tooltip cursor={cursorLine} content={<Tip formats={{ margin: (v) => pct(v) }} />} />
      {avg != null && <ReferenceLine y={avg} stroke="var(--color-text-muted)" strokeDasharray="4 4" />}
      <Area type="monotone" dataKey="margin" name="Margin" stroke={C.amber} strokeWidth={2} fill={`url(#${id})`} animationDuration={ANIM} />
    </AreaChart>
  </ResponsiveContainer>;
}

/* ─────────────── Composition ─────────────── */
export function Donut({ data, height = 220, money = true, centerLabel, centerValue, legend = true }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
    <div className="relative shrink-0" style={{ width: height, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart><Tooltip content={<Tip money={money} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="90%" paddingAngle={3} cornerRadius={6} stroke="none" animationDuration={ANIM}>
            {data.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[10px] uppercase tracking-wider text-text-muted">{centerLabel ?? "Total"}</p><p className="font-display text-base font-semibold tabular-nums">{centerValue ?? (money ? short(total) : total.toLocaleString("id-ID"))}</p></div></div>
    </div>
    {legend && <ul className="grid w-full min-w-0 gap-1.5 text-xs">{data.map((d, i) => <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: COLORS[i % COLORS.length] }} /><span className="min-w-0 flex-1 truncate text-text-secondary">{d.name}</span><span className="tabular-nums text-text-primary">{total ? pct((d.value / total) * 100, 0) : "—"}</span></li>)}</ul>}
  </div>;
}

export function HBars({ data, dataKey, nameKey = "name", money = true, suffix = "", height, color = 0, nameWidth = 128 }) {
  const id = uid(useId()), h = height ?? Math.max(160, data.length * 34 + 16), col = COLORS[color % COLORS.length];
  return <ResponsiveContainer width="100%" height={h}>
    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap="22%">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={col} stopOpacity={0.35} /><stop offset="100%" stopColor={col} stopOpacity={1} /></linearGradient></defs>
      <XAxis type="number" hide /><YAxis type="category" dataKey={nameKey} {...axis} width={nameWidth} tickFormatter={(s) => trunc(s)} />
      <Tooltip cursor={cursorBar} content={<Tip money={money} suffix={suffix} />} />
      <Bar dataKey={dataKey} name={dataKey} radius={[4, 10, 10, 4]} fill={`url(#${id})`} animationDuration={ANIM}>
        <LabelList dataKey={dataKey} position="right" fill="var(--color-text-secondary)" fontSize={11} formatter={(v) => (money ? short(v, "") : `${v}${suffix}`)} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

export function Columns({ data, xKey = "name", dataKey, money = true, height = 220, highlight }) {
  const id = uid(useId());
  return <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
      <defs><Grad id={id} color={C.violet} from={0.95} /></defs>{grid}
      <XAxis dataKey={xKey} {...axis} /><YAxis {...axis} tickFormatter={money ? moneyTick : undefined} width={50} />
      <Tooltip cursor={cursorBar} content={<Tip money={money} />} />
      <Bar dataKey={dataKey} name="Rata-rata" radius={[8, 8, 2, 2]} animationDuration={ANIM}>
        {data.map((d, i) => <Cell key={i} fill={highlight && d[xKey] === highlight ? C.cyan : `url(#${id})`} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

/* ─────────────── Waterfall (P&L bridge) ─────────────── */
export function Waterfall({ totals, hasExpense, height = 260 }) {
  const T = totals;
  const steps = [
    { name: "Pendapatan", base: 0, value: T.revenue, c: C.cyan },
    { name: "HPP", base: T.revenue - T.cost, value: T.cost, c: C.rose },
    { name: "Laba kotor", base: 0, value: T.gross, c: C.green },
    ...(hasExpense ? [{ name: "Beban ops.", base: Math.max(0, T.gross - T.expense), value: Math.min(T.expense, Math.max(T.gross, 0)), c: C.rose }, { name: "Laba operasi", base: 0, value: Math.max(0, T.op), c: T.op >= 0 ? C.violet : C.rose }] : []),
  ];
  return <ResponsiveContainer width="100%" height={height}>
    <BarChart data={steps} margin={{ top: 22, right: 8, left: -8, bottom: 0 }}>
      {grid}<XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={moneyTick} width={52} />
      <Tooltip cursor={cursorBar} content={<Tip hide={["base"]} />} />
      <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} legendType="none" />
      <Bar dataKey="value" name="Nilai" stackId="w" radius={[8, 8, 4, 4]} animationDuration={ANIM}>
        {steps.map((s, i) => <Cell key={i} fill={s.c} />)}
        <LabelList dataKey="value" position="top" fill="var(--color-text-primary)" fontSize={11} formatter={(v) => short(v, "")} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

/* ─────────────── Forecast ─────────────── */
export function ForecastChart({ data, height = 300, money = true }) {
  const id = uid(useId());
  const d = useMemo(() => data.map((r) => ({ ...r, range: r.low != null ? [r.low, r.high] : undefined })), [data]);
  return <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={d} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
      <defs><Grad id={id} color={C.violet} from={0.5} /></defs>{grid}
      <XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={moneyTick} width={52} domain={[(m) => Math.floor(m * 0.8), (m) => Math.ceil(m * 1.08)]} />
      <Tooltip cursor={cursorLine} content={<Tip money={money} />} />
      <Area type="monotone" dataKey="range" name="Rentang 80%" stroke="none" fill={`url(#${id})`} animationDuration={ANIM} animationBegin={500} isAnimationActive />
      <Line type="monotone" dataKey="actual" name="Aktual" stroke={C.cyan} strokeWidth={2.4} dot={{ r: 3, fill: C.cyan, strokeWidth: 0 }} animationDuration={ANIM} />
      <Line type="monotone" dataKey="forecast" name="Proyeksi" stroke={C.violet} strokeWidth={2.4} strokeDasharray="6 5" dot={{ r: 3.5, fill: C.violet, strokeWidth: 0 }} animationDuration={ANIM} animationBegin={500} />
    </ComposedChart>
  </ResponsiveContainer>;
}

/* ─────────────── Pareto & product matrix ─────────────── */
export function ParetoChart({ data, height = 300 }) {
  const id = uid(useId()), d = data.slice(0, 14).map((p) => ({ ...p, cum: +p.cum.toFixed(1) }));
  return <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={d} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
      <defs><Grad id={id} color={C.cyan} from={0.95} /></defs>{grid}
      <XAxis dataKey="name" {...axis} tickFormatter={(s) => trunc(s, 9)} interval={0} angle={-28} textAnchor="end" height={58} />
      <YAxis yAxisId="l" {...axis} tickFormatter={moneyTick} width={52} />
      <YAxis yAxisId="r" orientation="right" {...axis} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={40} />
      <Tooltip cursor={cursorBar} content={<Tip formats={{ cum: (v) => pct(v) }} />} />
      <ReferenceLine yAxisId="r" y={80} stroke={C.amber} strokeDasharray="4 4" label={{ value: "80%", fill: "var(--color-chart-3)", fontSize: 10, position: "insideTopRight" }} />
      <Bar yAxisId="l" dataKey="revenue" name="Pendapatan" fill={`url(#${id})`} radius={[8, 8, 2, 2]} animationDuration={ANIM} />
      <Line yAxisId="r" type="monotone" dataKey="cum" name="Kumulatif" stroke={C.amber} strokeWidth={2.2} dot={{ r: 3, fill: C.amber, strokeWidth: 0 }} animationDuration={ANIM} animationBegin={300} />
    </ComposedChart>
  </ResponsiveContainer>;
}

export function ProductMatrix({ products, avgMargin, height = 320 }) {
  const d = products.filter((p) => p.margin != null).slice(0, 40).map((p) => ({ name: p.name, revenue: p.revenue, margin: +p.margin.toFixed(1), qty: p.qty }));
  const Dot = ({ payload }) => payload.name;
  return <ResponsiveContainer width="100%" height={height}>
    <ScatterChart margin={{ top: 12, right: 16, left: -4, bottom: 4 }}>
      {grid}
      <XAxis type="number" dataKey="revenue" name="Pendapatan" {...axis} tickFormatter={moneyTick} />
      <YAxis type="number" dataKey="margin" name="Margin" {...axis} tickFormatter={(v) => `${v}%`} width={44} domain={["dataMin - 5", "dataMax + 5"]} />
      <ZAxis type="number" dataKey="qty" range={[70, 520]} />
      {avgMargin != null && <ReferenceLine y={avgMargin} stroke="var(--color-text-muted)" strokeDasharray="4 4" label={{ value: `rata-rata ${avgMargin.toFixed(0)}%`, fill: "var(--color-text-muted)", fontSize: 10, position: "insideTopRight" }} />}
      <Tooltip cursor={{ strokeDasharray: "3 4", stroke: "var(--color-accent)", strokeOpacity: 0.4 }} content={({ active, payload }) => active && payload?.length ? <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-2xl"><p className="mb-1 font-semibold">{payload[0].payload.name}</p><p className="text-text-secondary">Pendapatan <b className="text-text-primary">{short(payload[0].payload.revenue)}</b></p><p className="text-text-secondary">Margin <b className="text-text-primary">{pct(payload[0].payload.margin)}</b></p><p className="text-text-secondary">Qty <b className="text-text-primary">{payload[0].payload.qty.toLocaleString("id-ID")}</b></p></div> : null} />
      <Scatter data={d} animationDuration={ANIM} shape={undefined}>
        {d.map((p, i) => <Cell key={i} fill={p.margin >= (avgMargin ?? 0) ? C.green : C.rose} fillOpacity={0.62} stroke={p.margin >= (avgMargin ?? 0) ? C.green : C.rose} strokeWidth={1.5} />)}
      </Scatter>
    </ScatterChart>
  </ResponsiveContainer>;
}

/* ─────────────── Gauge ─────────────── */
export function Gauge({ value, max = 100, label, sub, color = C.green }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 120); return () => clearTimeout(t); }, []);
  const v = useCountUp(value ?? 0), id = uid(useId()), frac = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  return <div className="relative mx-auto w-full max-w-[260px]">
    <svg viewBox="0 0 200 120" className="w-full" role="img" aria-label={`${label}: ${value == null ? "tidak tersedia" : pct(value)}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.rose} /><stop offset="50%" stopColor={C.amber} /><stop offset="100%" stopColor={color} /></linearGradient></defs>
      <path d="M20 105 A80 80 0 0 1 180 105" fill="none" stroke="var(--color-border)" strokeWidth="14" strokeLinecap="round" pathLength="1" />
      <path d="M20 105 A80 80 0 0 1 180 105" fill="none" stroke={`url(#${id})`} strokeWidth="14" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={on ? 1 - frac : 1} style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)", filter: "drop-shadow(0 0 6px var(--color-glow))" }} />
    </svg>
    <div className="absolute inset-x-0 bottom-1 text-center"><p className="font-display text-2xl font-semibold tabular-nums">{value == null ? "—" : pct(v)}</p><p className="text-[11px] text-text-muted">{sub ?? label}</p></div>
  </div>;
}

/* ─────────────── Heatmap calendar ─────────────── */
export function Heatmap({ daily, weeks = 26 }) {
  const { cells, max, months } = useMemo(() => {
    if (!daily.length) return { cells: [], max: 0, months: [] };
    const last = daily.at(-1).date, map = new Map(daily.map((d) => [d.date, d.revenue]));
    const end = new Date(`${last}T00:00:00Z`), wd = (end.getUTCDay() + 6) % 7;
    const start = new Date(end.getTime() - ((weeks - 1) * 7 + wd) * 86400000), out = []; let mx = 0; const ml = [];
    for (let i = 0; i < weeks * 7; i++) {
      const dt = new Date(start.getTime() + i * 86400000), key = dt.toISOString().slice(0, 10);
      if (dt > end) break;
      const v = map.get(key) ?? 0; mx = Math.max(mx, v);
      out.push({ key, v, col: Math.floor(i / 7), row: i % 7 });
      if (i % 7 === 0 && (ml.length === 0 || (ml.at(-1).m !== dt.getUTCMonth() && Math.floor(i / 7) - ml.at(-1).col >= 3))) ml.push({ m: dt.getUTCMonth(), col: Math.floor(i / 7) });
    }
    return { cells: out, max: mx, months: ml };
  }, [daily, weeks]);
  const MN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  if (!cells.length) return null;
  return <div className="overflow-x-auto pb-1">
    <div className="inline-grid gap-x-[3px] text-[10px] text-text-muted" style={{ gridTemplateColumns: `22px repeat(${weeks}, 14px)` }}>
      <span />{Array.from({ length: weeks }, (_, c) => <span key={c} className="h-4 overflow-visible whitespace-nowrap">{months.find((m) => m.col === c) ? MN[months.find((m) => m.col === c).m] : ""}</span>)}
      {["Sen", "", "Rab", "", "Jum", "", ""].map((l, r) => <div key={r} className="contents"><span className="leading-[14px]">{l}</span>{Array.from({ length: weeks }, (_, c) => { const cell = cells.find((x) => x.col === c && x.row === r); return cell ? <span key={c} title={`${cell.key}: ${short(cell.v)}`} className="heat-cell h-[14px] w-[14px] rounded-[4px] transition-transform hover:scale-125" style={{ "--c": c, background: cell.v ? `color-mix(in oklab, var(--color-accent) ${Math.round(14 + 86 * Math.pow(cell.v / max, 0.65))}%, var(--color-surface-elevated))` : "var(--color-border-subtle)" }} /> : <span key={c} />; })}</div>)}
    </div>
    <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-text-muted">Rendah{[14, 35, 58, 80, 100].map((p) => <span key={p} className="h-3 w-3 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--color-accent) ${p}%, var(--color-surface-elevated))` }} />)}Tinggi</div>
  </div>;
}

/* ─────────────── Generic renderer for chat blocks ─────────────── */
export function GenericChart({ block, height = 220 }) {
  const { kind, data, series = [], xKey = "name", money = false, suffix = "" } = block, id = uid(useId());
  if (kind === "donut") return <Donut data={data} money={money} height={170} />;
  if (kind === "hbar") return <HBars data={data} dataKey={series[0].key} nameKey={xKey} money={money} suffix={suffix} nameWidth={110} />;
  if (kind === "forecast") return <ForecastChart data={data} height={height} money={money} />;
  if (kind === "bar") return <Columns data={data} xKey={xKey} dataKey={series[0].key} money={money} height={height} />;
  if (kind === "area") return <ResponsiveContainer width="100%" height={height}><AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}><defs><Grad id={id} color={C.cyan} /></defs>{grid}<XAxis dataKey={xKey} {...axis} minTickGap={28} /><YAxis {...axis} tickFormatter={money ? moneyTick : undefined} width={52} /><Tooltip cursor={cursorLine} content={<Tip money={money} />} />{series.map((s) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={C.cyan} strokeWidth={2} fill={`url(#${id})`} animationDuration={ANIM} />)}</AreaChart></ResponsiveContainer>;
  const hasRight = series.some((s) => s.axis === "right");
  return <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 4 : 8, left: -8, bottom: 0 }}>
      {grid}<XAxis dataKey={xKey} {...axis} minTickGap={20} /><YAxis yAxisId="l" {...axis} tickFormatter={money ? moneyTick : undefined} width={52} />
      {hasRight && <YAxis yAxisId="r" orientation="right" {...axis} tickFormatter={(v) => `${v}%`} width={40} />}
      <Tooltip cursor={cursorBar} content={<Tip money={money} formats={{ margin: (v) => pct(v) }} />} />
      {series.map((s, i) => s.kind === "line" ? <Line key={s.key} yAxisId={s.axis === "right" ? "r" : "l"} type="monotone" dataKey={s.key} name={s.label} stroke={COLORS[(i + 2) % 6]} strokeWidth={2.2} dot={false} animationDuration={ANIM} /> : <Bar key={s.key} yAxisId="l" dataKey={s.key} name={s.label} fill={COLORS[i % 6]} radius={[6, 6, 2, 2]} animationDuration={ANIM} />)}
    </ComposedChart>
  </ResponsiveContainer>;
}
