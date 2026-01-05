/**
 * Chat state store using Zustand with sessionStorage persistence.
 *
 * Manages:
 * - messages: Chat history (persisted within browser session)
 * - currentAgent: Active agent type (persisted within browser session)
 *
 * Uses sessionStorage instead of localStorage so chat history clears
 * when the browser is closed. This prevents stale conversations from
 * persisting indefinitely.
 *
 * Ephemeral state (isLoading, error, currentStatus) remains in useChat hook.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Message, AgentType } from "@/lib/types";

interface ChatState {
  messages: Message[];
  currentAgent: AgentType;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  updateLastMessage: (updates: Partial<Message>) => void;
  setCurrentAgent: (agent: AgentType) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      currentAgent: "default",

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (messageId, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        })),

      updateLastMessage: (updates) =>
        set((state) => ({
          messages: state.messages.map((msg, i) =>
            i === state.messages.length - 1 ? { ...msg, ...updates } : msg
          ),
        })),

      setCurrentAgent: (agent) => set({ currentAgent: agent }),

      clearChat: () => set({ messages: [], currentAgent: "default" }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
