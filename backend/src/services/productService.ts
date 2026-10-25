import { sql } from "../database/db";
import { notFound } from "../utils/errors";

export type ProductInput = { name: string; sku: string; category: string; price: number; stock: number; cost?: number };

export const productService = {
  list: (q = "", category = "") => sql`
    SELECT * FROM products
    WHERE (name ILIKE ${"%" + q + "%"} OR sku ILIKE ${"%" + q + "%"})
      AND (${category} = '' OR category = ${category})
    ORDER BY name`,
  async get(id: number) {
    const [p] = await sql`SELECT * FROM products WHERE id=${id}`;
    if (!p) throw notFound("Product");
    return p;
  },
  create: (b: ProductInput, userId: number) => sql.begin(async (tx) => {
    const [p] = await tx`
      INSERT INTO products(name,sku,category,price,cost,stock,created_by)
      VALUES (${b.name},${b.sku},${b.category},${b.price},${b.cost ?? 0},${b.stock},${userId}) RETURNING *`;
    if (b.stock > 0)
      await tx`INSERT INTO inventory_logs(product_id,type,quantity,note,created_by)
               VALUES (${p.id},'IN',${b.stock},'Initial stock',${userId})`;
    return p;
  }),
  // Stock is changed only through sales / inventory adjustments, never via edit.
  async update(id: number, b: Omit<ProductInput, "stock">) {
    const [p] = await sql`
      UPDATE products SET name=${b.name}, sku=${b.sku}, category=${b.category}, price=${b.price}, cost=COALESCE(${b.cost ?? null}, cost), updated_at=now()
      WHERE id=${id} RETURNING *`;
    if (!p) throw notFound("Product");
    return p;
  },
  async remove(id: number) {
    const r = await sql`DELETE FROM products WHERE id=${id} RETURNING id`;
    if (!r.length) throw notFound("Product");
    return { ok: true };
  },
};
