import { useEffect, useRef, useState } from "react";

export const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animates a number toward `target` (ease-out expo). Continues from the current value when target changes. */
export function useCountUp(target, duration = 1200) {
  const [v, setV] = useState(() => (reducedMotion() || !Number.isFinite(target) ? target : 0));
  const from = useRef(reducedMotion() ? target : 0);
  useEffect(() => {
    if (!Number.isFinite(target) || reducedMotion()) { setV(target); from.current = target; return; }
    const a = from.current, t0 = performance.now(); let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      from.current = a + (target - a) * e; setV(from.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/** Adds `.is-visible` to [data-reveal] elements inside `ref` as they scroll into view. */
export function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const els = root.querySelectorAll("[data-reveal]");
    if (reducedMotion() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
  return ref;
}

/** Reveals `text` progressively (≈ chars per frame) while `enabled`; returns the visible slice and done flag. */
export function useTypewriter(text, enabled, cps = 1100) {
  const [n, setN] = useState(enabled && !reducedMotion() ? 0 : text.length);
  useEffect(() => {
    if (!enabled || reducedMotion()) { setN(text.length); return; }
    let raf, t0 = performance.now();
    const tick = (now) => { const k = Math.min(text.length, Math.floor(((now - t0) / 1000) * cps)); setN(k); if (k < text.length) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled, cps]);
  return [text.slice(0, n), n >= text.length];
}

/** Spotlight: tracks the pointer inside an element and exposes --mx/--my for the .spot::after highlight. */
export const spotlight = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
