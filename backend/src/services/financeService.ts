import { sql } from "../database/db";

/**
 * Flat, finance-ready transaction rows (revenue, cost of goods, qty) for the dashboard & AI.
 * Cost = product.cost × quantity (current HPP; swap for a cost-history table later if needed).
 */
export const financeService = {
  transactions: (days = 365) => sql`
    SELECT to_char(s.sold_at, 'YYYY-MM-DD') AS date,
           p.name AS product, p.category, c.name AS customer,
           s.quantity::int AS qty,
           s.total::float8 AS revenue,
           (p.cost * s.quantity)::float8 AS cost
    FROM sales s
    JOIN products p ON p.id = s.product_id
    JOIN customers c ON c.id = s.customer_id
    WHERE s.sold_at >= current_date - ${days}::int
    ORDER BY s.sold_at
    LIMIT 100000`,
};
