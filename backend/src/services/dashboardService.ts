import { sql } from "../database/db";
import { env } from "../utils/env";

const growth = (cur: number, prev: number) => (prev === 0 ? null : Math.round(((cur - prev) / prev) * 1000) / 10);

export const dashboardService = {
  async summary() {
    const [s] = await sql`
      SELECT COALESCE(SUM(total),0)::float8 AS revenue, COUNT(*)::int AS orders,
        COALESCE(SUM(total) FILTER (WHERE sold_at >= now()-interval '30 days'),0)::float8 AS rev_cur,
        COALESCE(SUM(total) FILTER (WHERE sold_at < now()-interval '30 days' AND sold_at >= now()-interval '60 days'),0)::float8 AS rev_prev,
        COUNT(*) FILTER (WHERE sold_at >= now()-interval '30 days')::int AS ord_cur,
        COUNT(*) FILTER (WHERE sold_at < now()-interval '30 days' AND sold_at >= now()-interval '60 days')::int AS ord_prev
      FROM sales`;
    const [c] = await sql`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE created_at >= now()-interval '30 days')::int AS cur,
      COUNT(*) FILTER (WHERE created_at < now()-interval '30 days' AND created_at >= now()-interval '60 days')::int AS prev FROM customers`;
    const [p] = await sql`SELECT COUNT(*)::int AS total FROM products`;
    const lowStock = await sql`
      SELECT id,name,sku,stock FROM products WHERE stock <= ${env.LOW_STOCK_THRESHOLD} ORDER BY stock, name LIMIT 10`;
    const [lowStockCount] = await sql`
      SELECT COUNT(*)::int AS total FROM products WHERE stock <= ${env.LOW_STOCK_THRESHOLD}`;
    return {
      revenue: { value: s.revenue, last30Days: s.rev_cur, change: growth(s.rev_cur, s.rev_prev) },
      orders: { value: s.orders, change: growth(s.ord_cur, s.ord_prev) },
      customers: { value: c.total, change: growth(c.cur, c.prev) },
      products: { value: p.total },
      lowStockThreshold: env.LOW_STOCK_THRESHOLD,
      lowStockCount: lowStockCount.total,
      lowStock,
    };
  },
  sales: (days = 30) => sql`
    SELECT d::date AS date, COALESCE(SUM(s.total),0)::float8 AS revenue, COUNT(s.id)::int AS orders
    FROM generate_series(current_date - ${days - 1}::int, current_date, interval '1 day') d
    LEFT JOIN sales s ON s.sold_at::date = d::date
    GROUP BY d ORDER BY d`,
  topProducts: (limit = 5) => sql`
    SELECT p.id, p.name, SUM(s.quantity)::int AS units, SUM(s.total)::float8 AS revenue
    FROM sales s JOIN products p ON p.id = s.product_id
    GROUP BY p.id ORDER BY units DESC, revenue DESC LIMIT ${limit}`,
  topRevenueProducts: (limit = 5) => sql`
    SELECT p.id, p.name, SUM(s.quantity)::int AS units, SUM(s.total)::float8 AS revenue
    FROM sales s JOIN products p ON p.id = s.product_id
    GROUP BY p.id ORDER BY revenue DESC LIMIT ${limit}`,
  leastProducts: (limit = 5) => sql`
    SELECT p.id, p.name, p.sku, COALESCE(SUM(s.quantity), 0)::int AS units,
      COALESCE(SUM(s.total), 0)::float8 AS revenue
    FROM products p LEFT JOIN sales s ON s.product_id = p.id
    GROUP BY p.id ORDER BY units, p.name LIMIT ${limit}`,
  weeklySales: (weeks = 12) => sql`
    SELECT d::date AS week, COALESCE(SUM(s.total),0)::float8 AS revenue, COUNT(s.id)::int AS orders
    FROM generate_series(date_trunc('week', current_date) - (${weeks - 1}::int * interval '1 week'),
      date_trunc('week', current_date), interval '1 week') d
    LEFT JOIN sales s ON s.sold_at >= d AND s.sold_at < d + interval '1 week'
    GROUP BY d ORDER BY d`,
};
