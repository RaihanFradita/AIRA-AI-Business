import { sql } from "../database/db";
import { AppError } from "../utils/errors";

export const authService = {
  async register(name: string, email: string, password: string) {
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM users`;
    const role = n === 0 ? "admin" : "staff"; // first user becomes admin
    const hash = await Bun.password.hash(password);
    const [u] = await sql`
      INSERT INTO users(name,email,password_hash,role)
      VALUES (${name}, ${email.toLowerCase()}, ${hash}, ${role})
      RETURNING id,name,email,role`;
    return u;
  },
  async verify(email: string, password: string) {
    const [u] = await sql`SELECT * FROM users WHERE email=${email.toLowerCase()}`;
    if (!u || !(await Bun.password.verify(password, u.password_hash)))
      throw new AppError(401, "Invalid email or password");
    return { id: u.id, name: u.name, email: u.email, role: u.role };
  },
  async me(id: number) {
    const [u] = await sql`SELECT id,name,email,role FROM users WHERE id=${id}`;
    if (!u) throw new AppError(401, "Unauthorized");
    return u;
  },
};
