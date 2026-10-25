import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "./utils/env";
import { AppError } from "./utils/errors";
import { authRoutes } from "./routes/auth";
import { productRoutes } from "./routes/products";
import { customerRoutes } from "./routes/customers";
import { salesRoutes } from "./routes/sales";
import { inventoryRoutes } from "./routes/inventory";
import { dashboardRoutes } from "./routes/dashboard";
import { reportRoutes } from "./routes/reports";
import { financeRoutes } from "./routes/finance";
import { aiRoutes } from "./routes/ai";
import { companyProfileRoutes } from "./routes/companyProfile";

const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: env.CORS_ORIGIN }))
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) { set.status = error.status; return { error: error.message }; }
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "Validation failed", details: error.all?.map((e: any) => ({ field: e.path, message: e.message })) };
    }
    if (code === "NOT_FOUND") { set.status = 404; return { error: "Route not found" }; }
    const pg = (error as any)?.code; // map Postgres errors, never leak raw DB messages
    if (pg === "23505") { set.status = 409; return { error: "A record with this value already exists" }; }
    if (pg === "23503") { set.status = 409; return { error: "Record is still referenced by other data" }; }
    console.error(error);
    set.status = 500;
    return { error: "Internal server error" };
  })
  .get("/health", () => ({ ok: true }))
  .use(authRoutes)
  .use(productRoutes)
  .use(customerRoutes)
  .use(salesRoutes)
  .use(inventoryRoutes)
  .use(dashboardRoutes)
  .use(reportRoutes)
  .use(financeRoutes)
  .use(companyProfileRoutes)
  .use(aiRoutes)
  .listen(env.PORT);

console.log(`AIRA Business API running on :${env.PORT}`);
export type App = typeof app;
