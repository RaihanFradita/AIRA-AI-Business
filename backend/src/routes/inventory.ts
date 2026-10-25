import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { inventoryService } from "../services/inventoryService";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .use(authPlugin)
  .get("/", ({ query }) => inventoryService.list(query.status), {
    role: true,
    query: t.Object({ status: t.Optional(t.Union([t.Literal("In Stock"), t.Literal("Low Stock"), t.Literal("Out of Stock")])) }),
  })
  .get("/logs", ({ query }) => inventoryService.logs(query.productId), { role: true, query: t.Object({ productId: t.Optional(t.Numeric()) }) })
  .post("/adjust", ({ body, user }) => inventoryService.adjust(body, user.id), {
    role: true,
    body: t.Object({ productId: t.Integer({ minimum: 1 }), type: t.Union([t.Literal("IN"), t.Literal("ADJUSTMENT")]), quantity: t.Integer(), note: t.Optional(t.String({ maxLength: 200 })) }),
  });
