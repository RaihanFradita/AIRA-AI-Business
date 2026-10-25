import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { financeService } from "../services/financeService";

export const financeRoutes = new Elysia({ prefix: "/finance" })
  .use(authPlugin)
  .get("/transactions", ({ query }) => financeService.transactions(query.days), {
    role: ["admin"],
    query: t.Object({ days: t.Optional(t.Numeric({ minimum: 1, maximum: 1095 })) }),
  });
