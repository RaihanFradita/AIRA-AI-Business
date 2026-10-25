import { sql } from "../database/db";
import { env } from "../utils/env";

export const reportService = {
  async get(type: "sales" | "inventory" | "customers" | "monthly", from = "", to = "") {
    if (type === "sales") {
      const [summary] = await sql`
        SELECT COALESCE(SUM(total), 0)::float8 AS sales, COUNT(*)::int AS transactions,
          COALESCE(SUM(quantity), 0)::int AS items_sold, COUNT(DISTINCT customer_id)::int AS customers
        FROM sales
        WHERE (NULLIF(${from}::text, '') IS NULL OR sold_at >= NULLIF(${from}::text, '')::date)
          AND (NULLIF(${to}::text, '') IS NULL OR sold_at < NULLIF(${to}::text, '')::date + interval '1 day')`;
      const rows = await sql`
        SELECT s.id, s.sold_at, p.name AS product, p.sku, c.name AS customer,
          s.quantity, s.total AS sales, u.name AS sold_by
        FROM sales s JOIN products p ON p.id=s.product_id JOIN customers c ON c.id=s.customer_id
        LEFT JOIN users u ON u.id=s.sold_by
        WHERE (NULLIF(${from}::text, '') IS NULL OR s.sold_at >= NULLIF(${from}::text, '')::date)
          AND (NULLIF(${to}::text, '') IS NULL OR s.sold_at < NULLIF(${to}::text, '')::date + interval '1 day')
        ORDER BY s.sold_at DESC LIMIT 5000`;
      return { summary, rows };
    }

    if (type === "inventory") {
      const rows = await sql`
        SELECT id, name AS product, sku, category, price, stock,
          CASE WHEN stock = 0 THEN 'Out of stock' WHEN stock <= ${env.LOW_STOCK_THRESHOLD} THEN 'Low stock' ELSE 'In stock' END AS status,
          (price * stock)::float8 AS stock_value
        FROM products ORDER BY stock, name`;
      const [summary] = await sql`
        SELECT COUNT(*)::int AS products, COALESCE(SUM(stock),0)::int AS units_in_stock,
          COUNT(*) FILTER (WHERE stock <= ${env.LOW_STOCK_THRESHOLD})::int AS low_stock,
          COALESCE(SUM(price * stock),0)::float8 AS stock_value
        FROM products`;
      return { summary, rows };
    }

    if (type === "monthly") {
      const [summary] = await sql`
        SELECT COALESCE(SUM(total), 0)::float8 AS sales, COUNT(*)::int AS transactions,
          COALESCE(SUM(quantity), 0)::int AS items_sold, COUNT(DISTINCT customer_id)::int AS customers
        FROM sales
        WHERE (NULLIF(${from}::text, '') IS NULL OR sold_at >= NULLIF(${from}::text, '')::date)
          AND (NULLIF(${to}::text, '') IS NULL OR sold_at < NULLIF(${to}::text, '')::date + interval '1 day')`;
      const rows = await sql`
        SELECT date_trunc('month', sold_at)::date AS month, COALESCE(SUM(total),0)::float8 AS sales,
          COUNT(*)::int AS transactions, COALESCE(SUM(quantity),0)::int AS items_sold,
          COUNT(DISTINCT customer_id)::int AS customers
        FROM sales
        WHERE (NULLIF(${from}::text, '') IS NULL OR sold_at >= NULLIF(${from}::text, '')::date)
          AND (NULLIF(${to}::text, '') IS NULL OR sold_at < NULLIF(${to}::text, '')::date + interval '1 day')
        GROUP BY date_trunc('month', sold_at) ORDER BY month`;
      return { summary, rows };
    }

    const [summary] = await sql`
      SELECT COUNT(DISTINCT c.id)::int AS customers,
        COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= COALESCE(NULLIF(${from}::text, '')::date, date_trunc('month', current_date)::date)
          AND created_at < COALESCE(NULLIF(${to}::text, '')::date + interval '1 day', current_date + interval '1 day'))::int AS new_customers,
        COUNT(DISTINCT s.customer_id)::int AS purchasing_customers,
        COALESCE(SUM(s.total),0)::float8 AS sales
      FROM customers c LEFT JOIN sales s ON s.customer_id=c.id
        AND (NULLIF(${from}::text, '') IS NULL OR s.sold_at >= NULLIF(${from}::text, '')::date)
        AND (NULLIF(${to}::text, '') IS NULL OR s.sold_at < NULLIF(${to}::text, '')::date + interval '1 day')`;
    const rows = await sql`
      SELECT c.id, c.name, c.email, c.phone, c.created_at,
        COUNT(s.id)::int AS transactions, COALESCE(SUM(s.total),0)::float8 AS sales
      FROM customers c LEFT JOIN sales s ON s.customer_id=c.id
        AND (NULLIF(${from}::text, '') IS NULL OR s.sold_at >= NULLIF(${from}::text, '')::date)
        AND (NULLIF(${to}::text, '') IS NULL OR s.sold_at < NULLIF(${to}::text, '')::date + interval '1 day')
      GROUP BY c.id ORDER BY sales DESC, c.name`;
    return { summary, rows };
  },
};
