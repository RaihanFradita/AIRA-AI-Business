import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { dashboardService } from "../services/dashboardService";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(authPlugin)
  .get("/summary", () => dashboardService.summary(), { role: ["admin"] })
  .get("/analysis", async () => {
    const [summary, daily, weekly, topProducts, topRevenueProducts, leastProducts] = await Promise.all([
      dashboardService.summary(), dashboardService.sales(30), dashboardService.weeklySales(12),
      dashboardService.topProducts(5), dashboardService.topRevenueProducts(5), dashboardService.leastProducts(5),
    ]);
    return { summary, daily, weekly, topProducts, topRevenueProducts, leastProducts };
  }, { role: ["admin"] })
  .get("/sales", ({ query }) => dashboardService.sales(query.days), { role: ["admin"], query: t.Object({ days: t.Optional(t.Numeric({ minimum: 1, maximum: 365 })) }) })
  .get("/top-products", ({ query }) => dashboardService.topProducts(query.limit), { role: ["admin"], query: t.Object({ limit: t.Optional(t.Numeric({ minimum: 1, maximum: 20 })) }) });
