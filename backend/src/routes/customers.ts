import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { customerService } from "../services/customerService";

const body = t.Object({
  name: t.String({ minLength: 1, maxLength: 120 }),
  email: t.Optional(t.String({ format: "email" })),
  phone: t.Optional(t.String({ maxLength: 30 })),
});
const id = t.Object({ id: t.Numeric() });

export const customerRoutes = new Elysia({ prefix: "/customers" })
  .use(authPlugin)
  .get("/", ({ query }) => customerService.list(query.q), { role: true, query: t.Object({ q: t.Optional(t.String()) }) })
  .get("/:id", ({ params }) => customerService.get(params.id), { role: true, params: id })
  .post("/", async ({ body, set }) => { set.status = 201; return customerService.create(body); }, { role: true, body })
  .put("/:id", ({ params, body }) => customerService.update(params.id, body), { role: true, params: id, body })
  .delete("/:id", ({ params }) => customerService.remove(params.id), { role: ["admin"], params: id });
