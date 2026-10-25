import { describe, expect, it } from "bun:test";
import { createApp } from "./app";

const postChat = (app: ReturnType<typeof createApp>, body: unknown) => app.handle(new Request("http://localhost/api/chat", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "http://localhost:5173" },
  body: JSON.stringify(body),
}));

describe("API chat", () => {
  it("reports API health without claiming Ollama availability", async () => {
    const response = await createApp().handle(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("rejects empty, whitespace-only, oversized, and unexpected fields", async () => {
    const app = createApp({ agent: async () => "should not run" });
    expect((await postChat(app, { message: " " })).status).toBe(400);
    expect((await postChat(app, { message: "x".repeat(2001) })).status).toBe(400);
    expect((await postChat(app, { message: "hello", extra: "value" })).status).toBe(400);
  });

  it("returns the existing agent response", async () => {
    const app = createApp({ agent: async (message) => `Agent: ${message}` });
    const response = await postChat(app, { message: "  analisis penjualan  " });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: "Agent: analisis penjualan" });
  });

  it("hides agent failure details from production responses", async () => {
    const app = createApp({ agent: async () => { throw new Error("internal stack and secret"); } });
    const response = await postChat(app, { message: "ringkas penjualan" });
    const body = await response.json() as { error: string };
    expect(response.status).toBe(503);
    expect(body.error).toContain("Ollama");
    expect(body.error).not.toContain("secret");
  });
});
