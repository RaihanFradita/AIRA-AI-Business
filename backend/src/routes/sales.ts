import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { salesService } from "../services/salesService";

export const salesRoutes = new Elysia({ prefix: "/sales" })
  .use(authPlugin)
  .get("/", ({ query }) => salesService.list(query.q, query.from, query.to, query.limit), {
    role: true,
    query: t.Object({ q: t.Optional(t.String()), from: t.Optional(t.String()), to: t.Optional(t.String()), limit: t.Optional(t.Numeric({ minimum: 1, maximum: 500 })) }),
  })
  .get("/:id", ({ params }) => salesService.get(params.id), { role: true, params: t.Object({ id: t.Numeric() }) })
  .post("/", async ({ body, user, set }) => { set.status = 201; return salesService.create(body, user.id); }, {
    role: true,
    body: t.Object({ productId: t.Integer({ minimum: 1 }), customerId: t.Integer({ minimum: 1 }), quantity: t.Integer({ minimum: 1, maximum: 10000 }) }),
  });
