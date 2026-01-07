"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, AgentType } from "@/lib/types";
import { streamChat } from "@/lib/api";
import { UI_TEXT, ERROR_CODE_MESSAGES } from "@/lib/constants";
import { useChatStore } from "@/stores/chatStore";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function useChat() {
  // Persistent state from Zustand store
  const {
    messages,
    currentAgent,
    addMessage,
    updateMessage,
    updateLastMessage,
    setCurrentAgent,
    clearChat,
  } = useChatStore();

  // Ephemeral state (request-lifecycle bound)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const assistantMessageIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    agent: AgentType = "default",
    context?: Record<string, unknown>
  ) => {
    if (!content.trim() || isLoadingRef.current) return;

    setError(null);
    setIsLoading(true);
    isLoadingRef.current = true;
    setCurrentAgent(agent);

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      agent,
    };
    addMessage(userMessage);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      agent,
    };
    assistantMessageIdRef.current = assistantMessage.id;
    addMessage(assistantMessage);

    // Capture current history (excluding the two messages we just added)
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();

      let fullContent = "";
      let responseAgent: AgentType = agent;

      for await (const event of streamChat(content, history, agent, context)) {
        switch (event.type) {
          case "status":
            setCurrentStatus(event.data.message);
            break;

          case "token":
            // Clear status when tokens start flowing
            setCurrentStatus(null);
            fullContent += event.data.token;
            updateLastMessage({ content: fullContent });
            break;

          case "agent":
            responseAgent = event.data.agent as AgentType;
            setCurrentAgent(responseAgent);
            updateLastMessage({ agent: responseAgent });
            break;

          case "done":
            setCurrentStatus(null);
            updateLastMessage({ isStreaming: false });
            break;

          case "sources":
            updateLastMessage({ sources: event.data.sources });
            break;

          case "questions":
            setCurrentStatus(null);
            updateLastMessage({
              questions: event.data.questions,
              isStreaming: false,
            });
            break;

          case "questionnaire":
            setCurrentStatus(null);
            updateLastMessage({
              questionnaire: event.data,
              isStreaming: false,
            });
            break;

          case "travel_highlights":
            setCurrentStatus(null);
            // Create a new message for highlights (separate bubble)
            addMessage({
              id: generateId(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              agent: responseAgent,
              travelHighlights: event.data,
            });
            break;

          case "travel_itinerary":
            setCurrentStatus(null);
            // Create a new message for itinerary (separate bubble)
            addMessage({
              id: generateId(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              agent: responseAgent,
              travelItinerary: event.data,
            });
            break;

          case "travel_budget":
            setCurrentStatus(null);
            // Create a new message for budget (separate bubble)
            addMessage({
              id: generateId(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              agent: responseAgent,
              travelBudget: event.data,
            });
            break;

          case "error": {
            const errorCode = event.data.code;
            const errorMessage = errorCode && ERROR_CODE_MESSAGES[errorCode]
              ? ERROR_CODE_MESSAGES[errorCode]
              : event.data.message;
            setError(errorMessage);
            updateLastMessage({
              content: errorMessage,
              isStreaming: false,
            });
            break;
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : UI_TEXT.networkError;
      setError(errorMessage);
      updateLastMessage({
        content: errorMessage,
        isStreaming: false,
      });
    } finally {
      setIsLoading(false);
      setCurrentStatus(null);
      isLoadingRef.current = false;
      abortControllerRef.current = null;
      assistantMessageIdRef.current = null;
    }
  }, [messages, addMessage, updateLastMessage, setCurrentAgent]);

  /**
   * Send a request to get assistant response without creating a user message.
   * Used after questionnaire submission to trigger planning.
   */
  const sendAssistantRequest = useCallback(async (
    agent: AgentType,
    context: Record<string, unknown>
  ) => {
    if (isLoadingRef.current) return;

    setError(null);
    setIsLoading(true);
    isLoadingRef.current = true;
    setCurrentAgent(agent);

    // Create assistant message placeholder (no user message)
    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      agent,
    };
    assistantMessageIdRef.current = assistantMessage.id;
    addMessage(assistantMessage);

    // Capture current history
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();

      let fullContent = "";
      let responseAgent: AgentType = agent;

      // Send empty message with context - backend uses context for planning
      for await (const event of streamChat("", history, agent, context)) {
        switch (event.type) {
          case "status":
            setCurrentStatus(event.data.message);
            break;

          case "token":
            setCurrentStatus(null);
            fullContent += event.data.token;
            updateLastMessage({ content: fullContent });
            break;

          case "agent":
            responseAgent = event.data.agent as AgentType;
            setCurrentAgent(responseAgent);
            updateLastMessage({ agent: responseAgent });
            break;

          case "done":
            setCurrentStatus(null);
            updateLastMessage({ isStreaming: false });
            break;

          case "sources":
            updateLastMessage({ sources: event.data.sources });
            break;

          case "travel_highlights":
            setCurrentStatus(null);
            // Create a new message for highlights (separate bubble)
            addMessage({
              id: generateId(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              agent: responseAgent,
              travelHighlights: event.data,
            });
            break;

          case "travel_itinerary":
            setCurrentStatus(null);
            // Create a new message for itinerary (separate bubble)
            addMessage({
              id: generateId(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              agent: responseAgent,
              travelItinerary: event.data,
            });
            break;

          case "travel_budget":
            setCurrentStatus(null);
            // Create a new message for budget (separate bubble)
            addMessage({
              id: generateId(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              agent: responseAgent,
              travelBudget: event.data,
            });
            break;

          case "error": {
            const errorCode = event.data.code;
            const errorMessage = errorCode && ERROR_CODE_MESSAGES[errorCode]
              ? ERROR_CODE_MESSAGES[errorCode]
              : event.data.message;
            setError(errorMessage);
            updateLastMessage({
              content: errorMessage,
              isStreaming: false,
            });
            break;
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : UI_TEXT.networkError;
      setError(errorMessage);
      updateLastMessage({
        content: errorMessage,
        isStreaming: false,
      });
    } finally {
      setIsLoading(false);
      setCurrentStatus(null);
      isLoadingRef.current = false;
      abortControllerRef.current = null;
      assistantMessageIdRef.current = null;
    }
  }, [messages, addMessage, updateLastMessage, setCurrentAgent]);

  const clearMessages = useCallback(() => {
    clearChat();
    setError(null);
  }, [clearChat]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentAgent,
    currentStatus,
    sendMessage,
    sendAssistantRequest,
    updateMessage,
    clearMessages,
    clearError,
  };
}
