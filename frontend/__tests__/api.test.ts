import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkHealth, fetchAgents, streamChat } from "@/lib/api";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkHealth", () => {
    it("should return health status on success", async () => {
      const healthData = {
        status: "ok",
        agents_loaded: true,
        agent_count: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(healthData),
      });

      const result = await checkHealth();

      expect(result).toEqual(healthData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/health")
      );
    });

    it("should throw error on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(checkHealth()).rejects.toThrow("Health check failed");
    });
  });

  describe("fetchAgents", () => {
    it("should return agents list on success", async () => {
      const agentsData = {
        agents: [
          { id: "default", name: "Default", description: "Default agent", icon: "chat" },
          { id: "code", name: "Code", description: "Code agent", icon: "code" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(agentsData),
      });

      const result = await fetchAgents();

      expect(result).toEqual(agentsData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/agents")
      );
    });

    it("should throw error on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchAgents()).rejects.toThrow("Failed to fetch agents");
    });
  });

  describe("streamChat", () => {
    // Helper to create a mock ReadableStream
    function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
      const encoder = new TextEncoder();
      let index = 0;

      return new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(encoder.encode(chunks[index]));
            index++;
          } else {
            controller.close();
          }
        },
      });
    }

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const generator = streamChat("Hello", [], "default");

      await expect(generator.next()).rejects.toThrow("Chat request failed");
    });

    it("should throw error when no response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const generator = streamChat("Hello", [], "default");

      await expect(generator.next()).rejects.toThrow("No response body");
    });

    it("should parse SSE token events", async () => {
      const sseData = "event: token\ndata: {\"token\":\"Hello\"}\n\n";
      const stream = createMockStream([sseData]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: "token",
        data: { token: "Hello" },
      });
    });

    it("should parse multiple SSE events", async () => {
      const sseData =
        "event: token\ndata: {\"token\":\"Hello\"}\n\n" +
        "event: token\ndata: {\"token\":\" World\"}\n\n" +
        "event: done\ndata: {\"processing_time_ms\":100}\n\n";
      const stream = createMockStream([sseData]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ type: "token", data: { token: "Hello" } });
      expect(events[1]).toEqual({ type: "token", data: { token: " World" } });
      expect(events[2]).toEqual({ type: "done", data: { processing_time_ms: 100 } });
    });

    it("should handle chunked SSE data", async () => {
      // Data split across multiple chunks but complete lines
      const chunks = [
        "event: token\ndata: {\"token\":\"Hello\"}\n\n",
        "event: done\ndata: {\"processing_time_ms\":50}\n\n",
      ];
      const stream = createMockStream(chunks);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: "token", data: { token: "Hello" } });
      expect(events[1]).toEqual({ type: "done", data: { processing_time_ms: 50 } });
    });

    it("should ignore invalid JSON in data", async () => {
      const sseData =
        "event: token\ndata: invalid-json\n\n" +
        "event: token\ndata: {\"token\":\"Valid\"}\n\n";
      const stream = createMockStream([sseData]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      // Only the valid event should be yielded
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: "token", data: { token: "Valid" } });
    });

    it("should send correct request body", async () => {
      const stream = createMockStream(["event: done\ndata: {}\n\n"]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const history = [
        { role: "user" as const, content: "Previous message" },
        { role: "assistant" as const, content: "Previous response" },
      ];

      const generator = streamChat("New message", history, "code");
      // Consume the generator
      for await (const _ of generator) {
        // just iterate
      }

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/chat"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "New message",
            history: [
              { role: "user", content: "Previous message" },
              { role: "assistant", content: "Previous response" },
            ],
            agent: "code",
            context: null,
          }),
        })
      );
    });

    it("should parse status events", async () => {
      const sseData = 'event: status\ndata: {"status":"thinking","message":"Thinking..."}\n\n';
      const stream = createMockStream([sseData]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: "status",
        data: { status: "thinking", message: "Thinking..." },
      });
    });

    it("should parse error events", async () => {
      const sseData = 'event: error\ndata: {"message":"Something went wrong","code":"STREAM_ERROR"}\n\n';
      const stream = createMockStream([sseData]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: "error",
        data: { message: "Something went wrong", code: "STREAM_ERROR" },
      });
    });

    it("should parse sources events", async () => {
      const sources = [{ title: "Source 1", url: "https://example.com" }];
      const sseData = `event: sources\ndata: ${JSON.stringify({ sources })}\n\n`;
      const stream = createMockStream([sseData]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const generator = streamChat("Hi", [], "default");
      const events: unknown[] = [];

      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: "sources",
        data: { sources },
      });
    });
  });
});
