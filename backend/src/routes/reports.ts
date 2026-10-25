import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { reportService } from "../services/reportService";

const date = t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" });

export const reportRoutes = new Elysia({ prefix: "/reports" })
  .use(authPlugin)
  .get("/", ({ query }) => reportService.get(query.type, query.from, query.to), {
    role: ["admin"],
    query: t.Object({
      type: t.Union([t.Literal("sales"), t.Literal("inventory"), t.Literal("customers"), t.Literal("monthly")]),
      from: t.Optional(date),
      to: t.Optional(date),
    }),
  });
