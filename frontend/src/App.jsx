import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import Layout from "./components/sidebar/Layout";
import { useTheme } from "./hooks/useTheme";

const page = (p) => lazy(() => import(`./pages/${p}.jsx`));
const Auth = page("Auth"), Dashboard = page("Dashboard"), Products = page("Products"), Sales = page("Sales"), Inventory = page("Inventory"), Customers = page("Customers");
const Analysis = page("Analysis"), Reports = page("Reports"), Settings = page("Settings"), Landing = page("Landing");
const DemoSettings = page("DemoSettings");
const Assistant = page("Assistant"), DataStudio = page("DataStudio"), IncomeStatement = page("IncomeStatement");

function Loading({ children }) {
  const { t } = useLanguage();
  return <div className="grid min-h-[40vh] place-items-center p-10"><div className="text-center" role="status"><span className="orb mx-auto grid h-10 w-10 place-items-center rounded-full p-[2.5px]"><span className="h-full w-full rounded-full bg-surface-secondary" /></span><p className="mt-3 text-sm text-text-muted">{children ?? t("Memuat halaman…")}</p></div></div>;
}

function Protected() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading>Memuat akun…</Loading>;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}
const Admin = ({ children }) => (useAuth().user.role === "admin" ? children : <Navigate to="/sales" replace />);

/** Finance pages shared by the authenticated app (admin) and the public demo. */
const financeRoutes = (wrap = (x) => x) => <>
  <Route path="assistant" element={wrap(<Assistant />)} />
  <Route path="data" element={wrap(<DataStudio />)} />
  <Route path="analysis" element={wrap(<Analysis />)} />
  <Route path="income-statement" element={wrap(<IncomeStatement />)} />
</>;

function MainApp() {
  return <AuthProvider><Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Auth mode="login" />} />
    <Route path="/register" element={<Auth mode="register" />} />
    <Route element={<Protected />}>
      <Route path="/app" element={<Admin><Dashboard /></Admin>} />
      {financeRoutes((x) => <Admin>{x}</Admin>)}
      <Route path="reports" element={<Admin><Reports /></Admin>} />
      <Route path="sales" element={<Sales />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="products" element={<Products />} />
      <Route path="customers" element={<Customers />} />
      <Route path="settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AuthProvider>;
}

function DemoRoutes() {
  return <Routes>
    <Route element={<Layout demo />}>
      <Route index element={<Dashboard />} />
      {financeRoutes()}
      <Route path="settings" element={<DemoSettings />} />
    </Route>
    <Route path="*" element={<Navigate to="/demo" replace />} />
  </Routes>;
}

export default function App() {
  useTheme();
  return <LanguageProvider><BrowserRouter><Suspense fallback={<Loading />}><Routes>
    <Route path="/demo/*" element={<DemoRoutes />} />
    <Route path="*" element={<MainApp />} />
  </Routes></Suspense></BrowserRouter></LanguageProvider>;
}
