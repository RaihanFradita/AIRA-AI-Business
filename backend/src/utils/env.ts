const req = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing environment variable: ${k}`);
  return v;
};
export const env = {
  DATABASE_URL: req("DATABASE_URL"),
  JWT_SECRET: req("JWT_SECRET"),
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  LOW_STOCK_THRESHOLD: Number(process.env.LOW_STOCK_THRESHOLD ?? 10),
  // AI assistant (all optional — without any of them the UI uses its built-in local analysis engine)
  AI_PROVIDER: (process.env.AI_PROVIDER ?? "auto") as "auto" | "anthropic" | "ollama" | "none",
  AI_DEMO_ENABLED: process.env.AI_DEMO_ENABLED === "true",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
  OLLAMA_URL: (process.env.OLLAMA_URL ?? "").replace(/\/$/, ""),
  OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? "gemma3:4b",
};
