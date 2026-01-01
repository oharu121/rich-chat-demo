/**
 * TypeScript type definitions for the chat interface.
 */

// Agent types for slash command routing
export type AgentType = "default" | "code" | "search" | "explain" | "help" | "rag";

// Source from web search
export interface Source {
  title: string;
  url: string;
}

// Message structure
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agent?: AgentType;
  sources?: Source[];
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

export interface SSEStatusEvent {
  type: "status";
  data: {
    status: "thinking" | "searching" | "executing" | "reading" | "querying knowledge base";
    message: string;
  };
}

export interface SSESourcesEvent {
  type: "sources";
  data: {
    sources: Source[];
  };
}

export type SSEEvent = SSETokenEvent | SSEAgentEvent | SSEDoneEvent | SSEErrorEvent | SSEStatusEvent | SSESourcesEvent;

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
