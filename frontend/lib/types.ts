/**
 * TypeScript type definitions for the chat interface.
 */

// Agent types for slash command routing
export type AgentType = "default" | "code" | "search" | "explain" | "help";

// Message structure
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agent?: AgentType;
}

// Slash command definition
export interface SlashCommand {
  command: string;
  agent: AgentType;
  description: string;
  icon: string;
}

// SSE Event types
export interface SSETokenEvent {
  type: "token";
  data: { token: string };
}

export interface SSEAgentEvent {
  type: "agent";
  data: {
    agent: AgentType;
    name: string;
    description: string;
  };
}

export interface SSEDoneEvent {
  type: "done";
  data: { processing_time_ms: number };
}

export interface SSEErrorEvent {
  type: "error";
  data: { message: string; code: string };
}

export type SSEEvent = SSETokenEvent | SSEAgentEvent | SSEDoneEvent | SSEErrorEvent;

// API response types
export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface AgentsResponse {
  agents: AgentInfo[];
}

export interface HealthResponse {
  status: string;
  agents_loaded: boolean;
  agent_count: number;
}
