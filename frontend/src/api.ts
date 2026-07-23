export interface StreamEvent {
  type: "token" | "done" | "error";
  text?: string;
  session_id?: string;
  message?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ChatApiError extends Error {}

/**
 * POSTs a message to the streaming chat endpoint and invokes `onEvent` for
 * each token/done/error event as it arrives over the response body.
 */
export async function streamMessage(
  message: string,
  sessionId: string | null,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new ChatApiError(
      `PantryPal's backend returned ${res.status}. ${detail}`.trim(),
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      const event = JSON.parse(dataLine.slice("data:".length).trim()) as StreamEvent;
      onEvent(event);
    }
  }
}
