import { sql } from "../database/db";
import { AppError, notFound } from "../utils/errors";

export const salesService = {
  list: (q = "", from = "", to = "", limit = 100) => sql`
    SELECT s.*, p.name AS product_name, p.sku, c.name AS customer_name
    FROM sales s JOIN products p ON p.id = s.product_id JOIN customers c ON c.id = s.customer_id
    WHERE (p.name ILIKE ${"%" + q + "%"} OR c.name ILIKE ${"%" + q + "%"})
      AND (NULLIF(${from}::text, '') IS NULL OR s.sold_at >= NULLIF(${from}::text, '')::timestamptz)
      AND (NULLIF(${to}::text, '') IS NULL OR s.sold_at < (NULLIF(${to}::text, '')::date + 1))
    ORDER BY s.sold_at DESC LIMIT ${limit}`,
  async get(id: number) {
    const [s] = await sql`
      SELECT s.*, p.name AS product_name, c.name AS customer_name
      FROM sales s JOIN products p ON p.id = s.product_id JOIN customers c ON c.id = s.customer_id
      WHERE s.id=${id}`;
    if (!s) throw notFound("Sale");
    return s;
  },
  /** Atomic: validate -> lock product row -> compute total server-side -> save -> decrement stock -> log. */
  create: (b: { productId: number; customerId: number; quantity: number }, userId: number) =>
    sql.begin(async (tx) => {
      const [p] = await tx`SELECT id, price, stock FROM products WHERE id=${b.productId} FOR UPDATE`;
      if (!p) throw notFound("Product");
      const [c] = await tx`SELECT id FROM customers WHERE id=${b.customerId}`;
      if (!c) throw notFound("Customer");
      if (p.stock < b.quantity) throw new AppError(409, `Insufficient stock (available: ${p.stock})`);
      const total = p.price * b.quantity; // never trust client total
      const [sale] = await tx`
        INSERT INTO sales(product_id,customer_id,quantity,total,sold_by)
        VALUES (${p.id},${c.id},${b.quantity},${total},${userId}) RETURNING *`;
      await tx`UPDATE products SET stock = stock - ${b.quantity}, updated_at = now() WHERE id=${p.id}`;
      await tx`INSERT INTO inventory_logs(product_id,type,quantity,note,created_by)
               VALUES (${p.id},'OUT',${b.quantity},${"Sale #" + sale.id},${userId})`;
      return sale;
    }),
};
