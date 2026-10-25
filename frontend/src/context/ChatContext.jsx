import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { answerLocal, buildContext } from "../lib/localAi";
import { aiService } from "../services/api";
import { useData } from "./DataContext";
import { useLanguage } from "./LanguageContext";

const Ctx = createContext(null);
export const useChat = () => useContext(Ctx);
const KEY = "aira_chat_v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]").slice(-40); } catch { return []; } };
const uid = () => Math.random().toString(36).slice(2, 10);

export function ChatProvider({ children }) {
  const { mode, rows, A, meta } = useData();
  const { language } = useLanguage();
  const [messages, setMessages] = useState(load);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState({ provider: "none", model: null });
  const [drawer, setDrawer] = useState({ open: false, seed: null });
  const ref = useRef({ rows, A, meta, messages });
  ref.current = { rows, A, meta, messages };

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(messages.slice(-40))); } catch { /* ignore */ } }, [messages]);
  useEffect(() => {
    let active = true;
    (mode === "demo" ? aiService.demoStatus() : aiService.status())
      .then((status) => { if (active) setProvider(status); })
      .catch(() => { if (active) setProvider({ provider: "none", model: null }); });
    return () => { active = false; };
  }, [mode]);

  const send = useCallback(async (text) => {
    text = text.trim(); if (!text || busy) return;
    const { rows, A, meta, messages: hist } = ref.current;
    setMessages((m) => [...m, { id: uid(), role: "user", text, ts: Date.now() }]);
    setBusy(true);
    try {
      const local = answerLocal(text, rows, A, language);
      let reply = { text: local.text, source: "local" };
      const localOnly = ["unsupported", "greet", "help"].includes(local.intent);
      if (!localOnly && provider.provider !== "none" && A) {
        try {
          const body = {
            message: text,
            history: hist.slice(-8).map((m) => ({ role: m.role, content: m.text.slice(0, 5000) })),
            context: buildContext(local.analysis ?? A, local, meta),
            language,
          };
          const r = mode === "demo" ? await aiService.demoChat(body) : await aiService.chat(body);
          if (r.answer) reply = { text: r.answer, source: r.provider };
          else if (r.warning) reply.text += `\n\n_${r.warning}_`;
        } catch { /* use the deterministic answer when the LLM is unavailable */ }
      } else if (localOnly) {
        await new Promise((r) => setTimeout(r, 250));
      }
      setMessages((m) => [...m, { id: uid(), role: "assistant", ts: Date.now(), blocks: local.blocks, fresh: true, ...reply }]);
    } finally {
      setBusy(false);
    }
  }, [busy, language, mode, provider.provider]);

  const clear = useCallback(() => setMessages([]), []);
  const openDrawer = useCallback((seed = null) => setDrawer({ open: true, seed }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false, seed: null }), []);
  return <Ctx.Provider value={{ messages, busy, send, clear, provider, drawer, openDrawer, closeDrawer }}>{children}</Ctx.Provider>;
}
