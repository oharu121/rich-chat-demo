/**
 * UI text and configuration constants.
 */

import type { SlashCommand, AgentType } from "./types";

// UI Text (English)
export const UI_TEXT = {
  appTitle: "Agent Chat",
  appSubtitle: "Chat with specialized AI agents using slash commands",
  inputPlaceholder: "Type a message or /command...",
  processingMessage: "Generating response...",
  networkError: "Network error. Please try again.",
  sendButton: "Send",
  clearButton: "Clear chat",
  enterToSend: "Enter to send",
  shiftEnterNewline: "Shift+Enter for new line",
  welcomeMessage: "Welcome to Agent Chat",
  welcomeDescription: "Use slash commands to route your message to specialized agents, or just type to chat with the default assistant.",
  noMessages: "Start a conversation by typing a message below.",
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  endpoints: {
    chat: "/api/chat",
    health: "/api/health",
    agents: "/api/agents",
  },
} as const;

// Slash Commands
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/code",
    agent: "code",
    description: "Code assistance and generation",
    icon: "code",
  },
  {
    command: "/search",
    agent: "search",
    description: "Web search and information lookup",
    icon: "search",
  },
  {
    command: "/explain",
    agent: "explain",
    description: "Explain concepts in detail",
    icon: "book",
  },
  {
    command: "/help",
    agent: "help",
    description: "Show available commands",
    icon: "help",
  },
];

// Agent display configuration
export const AGENT_CONFIG: Record<AgentType, { label: string; bgColor: string; textColor: string; icon: string }> = {
  default: {
    label: "Assistant",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    icon: "chat",
  },
  code: {
    label: "Code",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    icon: "code",
  },
  search: {
    label: "Search",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    icon: "search",
  },
  explain: {
    label: "Explain",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    icon: "book",
  },
  help: {
    label: "Help",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    icon: "help",
  },
};

// Error code messages
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  UNKNOWN_AGENT: "Unknown agent type. Please try again.",
  STREAM_ERROR: "Error generating response. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
};
