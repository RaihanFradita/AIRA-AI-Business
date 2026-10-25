import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { aiService } from "../services/aiService";

const history = t.Optional(t.Array(t.Object({
  role: t.Union([t.Literal("user"), t.Literal("assistant")]),
  content: t.String({ maxLength: 6000 }),
}), { maxItems: 12 }));

export const aiRoutes = new Elysia({ prefix: "/ai" })
  .use(authPlugin)
  .get("/demo-status", () => aiService.demoStatus())
  .post("/demo-chat", async ({ body, status }) => {
    if (aiService.demoStatus().provider === "none")
      return status(404, { error: "AI demo is disabled" });
    if (!aiService.allowDemoRequest())
      return status(429, { error: "Batas penggunaan AI demo tercapai. Coba lagi sebentar." });
    try {
      return await aiService.chat(body.message, body.history ?? [], body.context ?? "", body.language);
    } finally {
      aiService.finishDemoRequest();
    }
  }, {
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 2000 }),
      history,
      context: t.Optional(t.String({ maxLength: 12000 })),
      language: t.Optional(t.Union([t.Literal("id-ID"), t.Literal("en-US")])),
    }),
  })
  .get("/status", () => aiService.status(), { role: ["admin"] })
  .post("/chat", ({ body }) => aiService.chat(body.message, body.history ?? [], body.context ?? "", body.language), {
    role: ["admin"],
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 2000 }),
      history,
      context: t.Optional(t.String({ maxLength: 40000 })),
      language: t.Optional(t.Union([t.Literal("id-ID"), t.Literal("en-US")])),
    }),
  });
