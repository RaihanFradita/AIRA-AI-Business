import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../hooks/useApi";
import { authService } from "../services/api";
import { Button, Field, Input } from "../components/ui";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [v, bind] = useForm({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === "admin" ? "/app" : "/sales"} replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const signedIn = await login(() => (isLogin ? authService.login(v) : authService.register(v)));
      nav(signedIn.role === "admin" ? "/app" : "/sales", { replace: true });
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-primary p-4">
      <div className="app-bg" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="reveal mb-7 text-center">
          <span className="orb float mx-auto grid h-14 w-14 place-items-center rounded-2xl p-[2.5px] glow-accent"><span className="grid h-full w-full place-items-center rounded-[14px] bg-surface-secondary font-display text-xl font-bold text-gradient">A</span></span>
          <div className="mt-4 font-display text-2xl font-semibold tracking-tight">AIRA <span className="text-gradient">Business</span></div>
          <div className="text-sm text-text-muted">Intelijen keuangan untuk bisnis Anda</div>
        </div>
        <form onSubmit={submit} className="glass grad-border reveal space-y-4 rounded-[20px] p-6" style={{ "--i": 1 }}>
          <h1 className="font-display text-xl font-semibold">{isLogin ? "Masuk ke akun" : "Buat akun AIRA"}</h1>
          {!isLogin && <Field label="Nama"><Input required minLength={2} {...bind("name")} /></Field>}
          <Field label="Email"><Input type="email" required autoComplete="email" {...bind("email")} /></Field>
          <Field label="Kata sandi"><Input type="password" required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? "current-password" : "new-password"} {...bind("password")} /></Field>
          {!isLogin && <p className="text-xs text-text-muted">Gunakan minimal 8 karakter.</p>}
          {err && <p className="text-sm text-negative" role="alert">{err}</p>}
          <Button className="h-10 w-full" disabled={busy}>{busy ? "Mohon tunggu…" : isLogin ? "Masuk" : "Daftar"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-text-muted">
          {isLogin ? <>Belum punya akun? <Link className="text-accent hover:underline" to="/register">Daftar</Link></> : <>Sudah punya akun? <Link className="text-accent hover:underline" to="/login">Masuk</Link></>}
          <span className="mx-2">·</span><Link className="text-accent hover:underline" to="/demo">Coba demo</Link>
        </p>
      </div>
    </div>
  );
}
