import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { productService } from "../services/productService";

const base = {
  name: t.String({ minLength: 1, maxLength: 120 }),
  sku: t.String({ minLength: 1, maxLength: 40 }),
  category: t.String({ minLength: 1, maxLength: 60 }),
  price: t.Integer({ minimum: 0 }),
  cost: t.Optional(t.Integer({ minimum: 0 })),
};
const id = t.Object({ id: t.Numeric() });

export const productRoutes = new Elysia({ prefix: "/products" })
  .use(authPlugin)
  .get("/", ({ query }) => productService.list(query.q, query.category),
    { role: true, query: t.Object({ q: t.Optional(t.String()), category: t.Optional(t.String()) }) })
  .get("/:id", ({ params }) => productService.get(params.id), { role: true, params: id })
  .post("/", async ({ body, user, set }) => { set.status = 201; return productService.create(body, user.id); },
    { role: ["admin"], body: t.Object({ ...base, stock: t.Integer({ minimum: 0, default: 0 }) }) })
  .put("/:id", ({ params, body }) => productService.update(params.id, body),
    { role: ["admin"], params: id, body: t.Object(base) })
  .delete("/:id", ({ params }) => productService.remove(params.id), { role: ["admin"], params: id });
