import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { authService } from "../services/authService";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  .post("/register", async ({ body, jwt, set }) => {
    const user = await authService.register(body.name, body.email, body.password);
    set.status = 201;
    return { user, token: await jwt.sign({ sub: String(user.id), role: user.role }) };
  }, { body: t.Object({ name: t.String({ minLength: 2 }), email: t.String({ format: "email" }), password: t.String({ minLength: 8 }) }) })
  .post("/login", async ({ body, jwt }) => {
    const user = await authService.verify(body.email, body.password);
    return { user, token: await jwt.sign({ sub: String(user.id), role: user.role }) };
  }, { body: t.Object({ email: t.String(), password: t.String() }) })
  // JWT is stateless: the client discards the token.
  .post("/logout", () => ({ ok: true }), { role: true })
  .get("/me", ({ user }) => authService.me(user.id), { role: true });
