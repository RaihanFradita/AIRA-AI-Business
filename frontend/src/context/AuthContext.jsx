import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener("nova:logout", h);
    if (localStorage.getItem("nova_token"))
      authService.me().then(setUser).catch(() => localStorage.removeItem("nova_token")).finally(() => setReady(true));
    else setReady(true);
    return () => window.removeEventListener("nova:logout", h);
  }, []);
  const login = async (fn) => {
    const r = await fn();
    localStorage.setItem("nova_token", r.token);
    setUser(r.user);
    return r.user;
  };
  const logout = async () => {
    try { await authService.logout(); } catch { /* token may already be invalid */ }
    localStorage.removeItem("nova_token");
    setUser(null);
  };
  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}
