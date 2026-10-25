import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import {
  AgentBusyError,
  AgentTimeoutError,
  runAgent,
} from "./agentRunner";

type AppOptions = { agent?: (message: string) => Promise<string> };

export function createApp({ agent = runAgent }: AppOptions = {}) {
  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Elysia()
    .use(cors({ origin: allowedOrigins }))
    .onError(({ code, set }) => {
      if (code === "VALIDATION") {
        set.status = 400;
        return { error: "Pesan harus berupa teks dengan panjang 1–2000 karakter." };
      }
      if (code === "NOT_FOUND") {
        set.status = 404;
        return { error: "Endpoint tidak ditemukan." };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server." };
    })
    .get("/api/health", () => ({ status: "ok" }))
    .post("/api/chat", async ({ body, set }) => {
      const message = body.message.trim();
      if (!message) {
        set.status = 400;
        return { error: "Tulis pesan sebelum mengirim." };
      }

      try {
        return { answer: await agent(message) };
      } catch (error) {
        if (error instanceof AgentBusyError) {
          set.status = 503;
          return { error: "Asisten sedang sibuk. Coba lagi sebentar." };
        }
        if (error instanceof AgentTimeoutError) {
          set.status = 504;
          return { error: "Asisten belum merespons. Pastikan Ollama aktif, lalu coba lagi." };
        }
        set.status = 503;
        return { error: "Asisten belum tersedia. Pastikan Ollama dan model gemma3:4b berjalan." };
      }
    }, {
      body: t.Object({
        message: t.String({ minLength: 1, maxLength: 2000 }),
      }, { additionalProperties: false }),
    });
}

export const app = createApp();
