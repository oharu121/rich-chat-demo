"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { UI_TEXT, SLASH_COMMANDS } from "@/lib/constants";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { ChatInputRef } from "./ChatInput";
import type { AgentType } from "@/lib/types";

export function ChatInterface() {
  const {
    messages,
    isLoading,
    error,
    currentAgent,
    sendMessage,
    clearMessages,
    clearError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Preload avatar GIFs
  useEffect(() => {
    const preloadImages = [
      "/avatars/maya-idling.gif",
      "/avatars/maya-speaking.gif",
      "/avatars/maya-thinking.gif",
    ];
    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSendMessage = (content: string, agent: AgentType) => {
    sendMessage(content, agent);
  };

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="shrink-0 glass border-b border-white/20 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              {UI_TEXT.appTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {UI_TEXT.appSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="group flex items-center gap-2 px-4 py-2 text-sm font-medium
                         text-gray-600 bg-white/80 rounded-xl border border-gray-200/60
                         hover:bg-white hover:border-gray-300 hover:text-gray-900
                         active:scale-[0.98] transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>{UI_TEXT.clearButton}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Error message */}
          {error && (
            <div
              className="mb-6 p-4 bg-linear-to-r from-red-50 to-rose-50 border border-red-200/60
                          rounded-2xl shadow-sm animate-fade-in-down"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
                <button
                  onClick={clearError}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Welcome message when empty */}
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="relative w-20 h-20 mx-auto mb-5">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
                {/* Icon container */}
                <div
                  className="relative w-full h-full bg-linear-to-br from-blue-500 to-indigo-600
                              rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25
                              transform hover:scale-105 transition-transform duration-300"
                >
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {UI_TEXT.welcomeMessage}
              </h2>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
                {UI_TEXT.welcomeDescription}
              </p>

              {/* Available commands */}
              <div className="flex flex-wrap justify-center gap-3">
                {SLASH_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.command}
                    onClick={() => {
                      chatInputRef.current?.focus();
                    }}
                    className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200
                             rounded-xl hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50
                             hover:shadow-md transition-all duration-200"
                  >
                    <span className="font-medium">{cmd.command}</span>
                    <span className="text-gray-400 ml-2">{cmd.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MessageBubble message={message} />
              </div>
            ))}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <ChatInput
        ref={chatInputRef}
        onSend={handleSendMessage}
        disabled={isLoading}
      />
    </div>
  );
}
