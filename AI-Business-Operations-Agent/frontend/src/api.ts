export type ChatReply = { answer: string };

export async function checkApiHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch("/api/health", { signal });
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendChatMessage(message: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
    signal,
  });

  const body = await response.json().catch(() => ({})) as Partial<ChatReply> & { error?: string };
  if (!response.ok) throw new Error(body.error || "Asisten belum dapat menjawab. Coba lagi sebentar.");
  if (typeof body.answer !== "string" || !body.answer.trim()) throw new Error("Respons asisten kosong. Silakan coba lagi.");
  return body.answer;
}
