import { SQL } from "bun";
import { env } from "../utils/env";

const sql = new SQL(env.DATABASE_URL);
const schemaUrl = new URL("../../../database/schema.sql", import.meta.url);

try {
  const schema = await Bun.file(schemaUrl).text();
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.unsafe(statement);
  }

  console.log(`Database schema applied (${statements.length} statements).`);
} finally {
  await sql.close();
}
