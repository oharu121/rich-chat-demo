import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/stores/chatStore";
import * as api from "@/lib/api";

// Mock the api module
vi.mock("@/lib/api", () => ({
  streamChat: vi.fn(),
}));

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store state before each test
    useChatStore.getState().clearChat();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should have empty messages initially", () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentAgent).toBe("default");
      expect(result.current.currentStatus).toBeNull();
    });
  });

  describe("sendMessage", () => {
    it("should not send empty messages", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("   ");
      });

      expect(result.current.messages).toEqual([]);
      expect(api.streamChat).not.toHaveBeenCalled();
    });

    it("should add user and assistant messages", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Hello" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi there");
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("Hi there");
      expect(result.current.messages[1].role).toBe("assistant");
      expect(result.current.messages[1].content).toBe("Hello");
    });

    it("should set loading state during message send", async () => {
      let resolveStream: () => void;
      const streamPromise = new Promise<void>((resolve) => {
        resolveStream = resolve;
      });

      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Hello" } };
        await streamPromise;
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.sendMessage("Hi");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveStream!();
        await sendPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should handle status events", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "status", data: { status: "thinking", message: "Thinking..." } };
        yield { type: "token", data: { token: "Response" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      // Status should be cleared after tokens start
      expect(result.current.currentStatus).toBeNull();
    });

    it("should handle agent events", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "agent", data: { agent: "code", name: "Code", description: "Code assistant" } };
        yield { type: "token", data: { token: "Response" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi", "code");
      });

      expect(result.current.currentAgent).toBe("code");
      expect(result.current.messages[1].agent).toBe("code");
    });

    it("should handle sources events", async () => {
      const sources = [
        { title: "Source 1", url: "https://example.com/1" },
        { title: "Source 2", url: "https://example.com/2" },
      ];

      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Response" } };
        yield { type: "sources", data: { sources } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Search for something");
      });

      expect(result.current.messages[1].sources).toEqual(sources);
    });

    it("should handle error events", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "error", data: { message: "Something went wrong", code: "STREAM_ERROR" } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.error).toBe("Error generating response. Please try again.");
    });

    it("should handle error events with unknown code", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "error", data: { message: "Custom error message", code: "UNKNOWN_CODE" } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.error).toBe("Custom error message");
    });

    it("should handle network errors", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        throw new Error("Network failure");
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.error).toBe("Network failure");
      expect(result.current.isLoading).toBe(false);
    });

    it("should accumulate tokens in message content", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Hello" } };
        yield { type: "token", data: { token: " " } };
        yield { type: "token", data: { token: "World" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.messages[1].content).toBe("Hello World");
    });

    it("should mark message as not streaming when done", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Response" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.messages[1].isStreaming).toBe(false);
    });

    it("should pass history to streamChat", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Response" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      // Send first message - history should be empty
      await act(async () => {
        await result.current.sendMessage("First message");
      });

      expect(mockStreamChat).toHaveBeenCalledTimes(1);
      const firstCallArgs = mockStreamChat.mock.calls[0];
      expect(firstCallArgs[0]).toBe("First message"); // message
      expect(firstCallArgs[2]).toBe("default"); // agent
      // First call history is empty (no previous messages)
      expect(Array.isArray(firstCallArgs[1])).toBe(true);
    });

    it("should not allow concurrent message sends", async () => {
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        await firstPromise;
        yield { type: "token", data: { token: "Response" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      // Start first message (don't await)
      let firstSend: Promise<void>;
      act(() => {
        firstSend = result.current.sendMessage("First");
      });

      // Try to send second message while first is in progress
      await act(async () => {
        await result.current.sendMessage("Second");
      });

      // Complete first message
      await act(async () => {
        resolveFirst!();
        await firstSend!;
      });

      // Only first message should have been processed
      expect(mockStreamChat).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearMessages", () => {
    it("should clear all messages", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "token", data: { token: "Response" } };
        yield { type: "done", data: { processing_time_ms: 100 } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.currentAgent).toBe("default");
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      const mockStreamChat = vi.fn().mockImplementation(async function* () {
        yield { type: "error", data: { message: "Error occurred", code: "" } };
      });
      vi.mocked(api.streamChat).mockImplementation(mockStreamChat);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hi");
      });

      expect(result.current.error).toBe("Error occurred");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
