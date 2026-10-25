import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../utils/env";

export type Role = "admin" | "staff";

/** Usage in a route's options: `{ role: true }` (any logged-in user) or `{ role: ["admin"] }`. */
export const authPlugin = new Elysia({ name: "auth" })
  .use(jwt({ name: "jwt", secret: env.JWT_SECRET, exp: "7d" }))
  .macro({
    role: (roles: Role[] | true) => ({
      async resolve({ jwt, headers, status }) {
        const token = headers.authorization?.replace(/^Bearer /, "");
        const p = token ? await jwt.verify(token) : false;
        if (!p) return status(401, { error: "Unauthorized" });
        if (Array.isArray(roles) && !roles.includes(p.role as Role))
          return status(403, { error: "Forbidden" });
        return { user: { id: Number(p.sub), role: p.role as Role } };
      },
    }),
  });
