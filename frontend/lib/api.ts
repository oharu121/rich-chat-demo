/**
 * Backend API client with SSE streaming support.
 */

import { API_CONFIG } from "./constants";
import type { AgentType, SSEEvent, Message, HealthResponse, AgentsResponse } from "./types";

const { baseUrl, endpoints } = API_CONFIG;

/**
 * Health check
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${baseUrl}${endpoints.health}`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}

/**
 * Get list of available agents
 */
export async function fetchAgents(): Promise<AgentsResponse> {
  const response = await fetch(`${baseUrl}${endpoints.agents}`);
  if (!response.ok) {
    throw new Error("Failed to fetch agents");
  }
  return response.json();
}

/**
 * SSE streaming chat
 */
export async function* streamChat(
  message: string,
  history: Pick<Message, "role" | "content">[],
  agent: AgentType = "default"
): AsyncGenerator<SSEEvent, void, unknown> {
  const response = await fetch(`${baseUrl}${endpoints.chat}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      agent,
    }),
  });

  if (!response.ok) {
    throw new Error("Chat request failed");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    let currentEvent: string | null = null;

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          yield { type: currentEvent, data } as SSEEvent;
        } catch {
          // Ignore parse errors
        }
        currentEvent = null;
      }
    }
  }
}
