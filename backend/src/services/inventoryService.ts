import { sql } from "../database/db";
import { env } from "../utils/env";
import { AppError, notFound } from "../utils/errors";

export const inventoryService = {
  list: (status = "") => sql`
    SELECT * FROM (
      SELECT p.id, p.name, p.sku, p.category, p.stock, p.updated_at AS last_update,
        CASE WHEN p.stock = 0 THEN 'Out of Stock'
             WHEN p.stock <= ${env.LOW_STOCK_THRESHOLD} THEN 'Low Stock'
             ELSE 'In Stock' END AS status
      FROM products p) x
    WHERE ${status} = '' OR status = ${status} ORDER BY stock, name`,
  logs: (productId = 0) => sql`
    SELECT l.*, p.name AS product_name FROM inventory_logs l JOIN products p ON p.id = l.product_id
    WHERE ${productId} = 0 OR l.product_id = ${productId} ORDER BY l.created_at DESC LIMIT 200`,
  /** IN: quantity > 0 adds stock. ADJUSTMENT: signed correction (e.g. -2 for damaged goods). */
  adjust: (b: { productId: number; type: "IN" | "ADJUSTMENT"; quantity: number; note?: string }, userId: number) =>
    sql.begin(async (tx) => {
      if (b.quantity === 0 || (b.type === "IN" && b.quantity < 0))
        throw new AppError(422, "Invalid quantity");
      const [p] = await tx`SELECT id, stock FROM products WHERE id=${b.productId} FOR UPDATE`;
      if (!p) throw notFound("Product");
      if (p.stock + b.quantity < 0) throw new AppError(409, "Stock cannot go below zero");
      const [updated] = await tx`
        UPDATE products SET stock = stock + ${b.quantity}, updated_at = now() WHERE id=${p.id} RETURNING id, name, stock`;
      await tx`INSERT INTO inventory_logs(product_id,type,quantity,note,created_by)
               VALUES (${p.id},${b.type},${b.quantity},${b.note ?? null},${userId})`;
      return updated;
    }),
};
