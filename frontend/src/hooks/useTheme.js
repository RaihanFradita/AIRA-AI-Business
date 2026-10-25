import { useEffect, useState } from "react";

const preferenceKey = "nova_theme";
const initial = () => { try { return localStorage.getItem(preferenceKey) ?? "dark"; } catch { return "dark"; } };

export function useTheme() {
  const [theme, setTheme] = useState(initial);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const onTheme = (event) => setTheme(event.detail);
    window.addEventListener("aira:theme", onTheme);
    return () => window.removeEventListener("aira:theme", onTheme);
  }, [theme]);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(preferenceKey, next); } catch { /* storage unavailable */ }
    window.dispatchEvent(new CustomEvent("aira:theme", { detail: next }));
    setTheme(next);
  };
  return [theme, toggle];
}
