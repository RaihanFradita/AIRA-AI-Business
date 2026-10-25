import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { analyze } from "../lib/analytics";
import { makeSample } from "../lib/sample";
import { financeService } from "../services/api";

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);
const KEY = "aira_dataset_v1";

const restore = () => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); return v?.rows?.length ? v : null; } catch { return null; } };
const sampleState = (note) => ({ rows: makeSample(), meta: { source: "sample", name: "Data contoh (UMKM kopi & lifestyle)", importedAt: Date.now(), note } });

/** Single source of truth for the active finance dataset. mode: "app" (authenticated) | "demo". */
export function DataProvider({ mode, children }) {
  const [state, setState] = useState(() => restore() ?? (mode === "demo" ? sampleState() : { rows: [], meta: null }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const useSample = useCallback(() => { setError(""); setState(sampleState()); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }, []);

  const loadDatabase = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const rows = await financeService.transactions(730);
      const norm = rows.map((r) => ({ ...r, expense: 0, channel: "—" }));
      if (!norm.length) throw new Error("Database belum memiliki transaksi penjualan.");
      setState({ rows: norm, meta: { source: "database", name: "Database AIRA (penjualan & HPP produk)", importedAt: Date.now() } });
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    } catch (e) { setError(e.message); setState((s) => (s.rows.length ? s : sampleState("Database belum tersedia — menampilkan data contoh."))); }
    finally { setLoading(false); }
  }, []);

  const setExcel = useCallback((rows, meta) => {
    const next = { rows, meta: { source: "excel", importedAt: Date.now(), ...meta } };
    setState(next); setError("");
    try { const s = JSON.stringify(next); if (s.length < 4_000_000) localStorage.setItem(KEY, s); else localStorage.removeItem(KEY); } catch { /* quota: keep in memory only */ }
  }, []);

  useEffect(() => { if (mode === "app" && !state.rows.length) loadDatabase(); }, []); // eslint-disable-line

  const A = useMemo(() => analyze(state.rows), [state.rows]);
  const to = useCallback((p = "") => (mode === "demo" ? `/demo${p}` : p === "" ? "/app" : p), [mode]);
  return <Ctx.Provider value={{ mode, rows: state.rows, meta: state.meta, A, loading, error, to, useSample, loadDatabase, setExcel }}>{children}</Ctx.Provider>;
}
