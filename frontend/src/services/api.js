const BASE = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

async function req(path, { method = "GET", body, params } = {}) {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    : "";
  const token = localStorage.getItem("nova_token");
  const res = await fetch(BASE + path + qs, {
    method,
    headers: { ...(body && { "Content-Type": "application/json" }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem("nova_token");
      window.dispatchEvent(new Event("nova:logout"));
    }
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  if (data === null) throw new Error("The server returned an invalid response.");
  return data;
}

const crud = (base) => ({
  list: (params) => req(base, { params }),
  get: (id) => req(`${base}/${id}`),
  create: (body) => req(base, { method: "POST", body }),
  update: (id, body) => req(`${base}/${id}`, { method: "PUT", body }),
  remove: (id) => req(`${base}/${id}`, { method: "DELETE" }),
});

export const authService = {
  login: (body) => req("/auth/login", { method: "POST", body }),
  register: (body) => req("/auth/register", { method: "POST", body }),
  logout: () => req("/auth/logout", { method: "POST" }),
  me: () => req("/auth/me"),
};
export const productService = crud("/products");
export const customerService = crud("/customers");
export const salesService = { list: crud("/sales").list, get: crud("/sales").get, create: crud("/sales").create };
export const inventoryService = {
  list: (params) => req("/inventory", { params }),
  logs: (params) => req("/inventory/logs", { params }),
  adjust: (body) => req("/inventory/adjust", { method: "POST", body }),
};
export const dashboardService = {
  summary: () => req("/dashboard/summary"),
  analysis: () => req("/dashboard/analysis"),
  sales: (days = 30) => req("/dashboard/sales", { params: { days } }),
  topProducts: (limit = 5) => req("/dashboard/top-products", { params: { limit } }),
};
export const reportService = {
  get: (type, params) => req("/reports/", { params: { type, ...params } }),
};

export const financeService = {
  transactions: (days = 365) => req("/finance/transactions", { params: { days } }),
};
export const companyProfileService = {
  get: () => req("/company-profile/"),
  update: (body) => req("/company-profile/", { method: "PUT", body }),
};
export const aiService = {
  status: () => req("/ai/status"),
  chat: (body) => req("/ai/chat", { method: "POST", body }),
  demoStatus: () => req("/ai/demo-status"),
  demoChat: (body) => req("/ai/demo-chat", { method: "POST", body }),
};
