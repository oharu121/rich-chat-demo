"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, AgentType, SSEEvent } from "@/lib/types";
import { streamChat } from "@/lib/api";
import { UI_TEXT, ERROR_CODE_MESSAGES } from "@/lib/constants";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentType>("default");
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const sendMessage = useCallback(async (content: string, agent: AgentType = "default") => {
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

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      agent,
    };

    // Capture current history BEFORE adding new messages
    let capturedHistory: Pick<Message, "role" | "content">[] = [];
    setMessages((prev) => {
      capturedHistory = prev.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      return [...prev, userMessage, assistantMessage];
    });

    try {
      abortControllerRef.current = new AbortController();

      const history = capturedHistory;
      let fullContent = "";
      let responseAgent: AgentType = agent;

      for await (const event of streamChat(content, history, agent)) {
        switch (event.type) {
          case "status":
            setCurrentStatus(event.data.message);
            break;

          case "token":
            // Clear status when tokens start flowing
            setCurrentStatus(null);
            fullContent += event.data.token;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: fullContent }
                  : m
              )
            );
            break;

          case "agent":
            responseAgent = event.data.agent as AgentType;
            setCurrentAgent(responseAgent);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, agent: responseAgent }
                  : m
              )
            );
            break;

          case "done":
            setCurrentStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, isStreaming: false }
                  : m
              )
            );
            break;

          case "sources":
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, sources: event.data.sources }
                  : m
              )
            );
            break;

          case "questions":
            setCurrentStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, questions: event.data.questions, isStreaming: false }
                  : m
              )
            );
            break;

          case "questionnaire":
            setCurrentStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, questionnaire: event.data, isStreaming: false }
                  : m
              )
            );
            break;

          case "error": {
            const errorCode = event.data.code;
            const errorMessage = errorCode && ERROR_CODE_MESSAGES[errorCode]
              ? ERROR_CODE_MESSAGES[errorCode]
              : event.data.message;
            setError(errorMessage);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      content: errorMessage,
                      isStreaming: false,
                    }
                  : m
              )
            );
            break;
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : UI_TEXT.networkError;
      setError(errorMessage);
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.isStreaming
            ? { ...m, content: errorMessage, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setCurrentStatus(null);
      isLoadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentAgent("default");
  }, []);

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
    clearMessages,
    clearError,
  };
}
