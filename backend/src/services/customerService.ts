import { sql } from "../database/db";
import { notFound } from "../utils/errors";

type CustomerInput = { name: string; email?: string; phone?: string };

export const customerService = {
  list: (q = "") => sql`
    SELECT c.*, COUNT(s.id)::int AS total_orders, COALESCE(SUM(s.total),0)::float8 AS total_spending
    FROM customers c LEFT JOIN sales s ON s.customer_id = c.id
    WHERE c.name ILIKE ${"%" + q + "%"} OR COALESCE(c.email,'') ILIKE ${"%" + q + "%"}
    GROUP BY c.id ORDER BY c.name`,
  async get(id: number) {
    const [c] = await sql`SELECT * FROM customers WHERE id=${id}`;
    if (!c) throw notFound("Customer");
    const [stats] = await sql`
      SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total),0)::float8 AS total_spending, MAX(sold_at) AS last_purchase
      FROM sales WHERE customer_id=${id}`;
    const history = await sql`
      SELECT s.id, s.quantity, s.total, s.sold_at, p.name AS product_name
      FROM sales s JOIN products p ON p.id = s.product_id
      WHERE s.customer_id=${id} ORDER BY s.sold_at DESC`;
    return { ...c, ...stats, history };
  },
  create: async (b: CustomerInput) => (await sql`
    INSERT INTO customers(name,email,phone) VALUES (${b.name}, ${b.email ?? null}, ${b.phone ?? null}) RETURNING *`)[0],
  async update(id: number, b: CustomerInput) {
    const [c] = await sql`
      UPDATE customers SET name=${b.name}, email=${b.email ?? null}, phone=${b.phone ?? null}, updated_at=now()
      WHERE id=${id} RETURNING *`;
    if (!c) throw notFound("Customer");
    return c;
  },
  async remove(id: number) {
    const r = await sql`DELETE FROM customers WHERE id=${id} RETURNING id`;
    if (!r.length) throw notFound("Customer");
    return { ok: true };
  },
};
