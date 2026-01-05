/**
 * TypeScript type definitions for the chat interface.
 */

// Agent types for slash command routing
export type AgentType = "default" | "code" | "search" | "explain" | "help" | "rag" | "travel";

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
  questions?: TravelQuestion[];  // Legacy single-form questions
  questionnaire?: Questionnaire;  // Multi-step wizard questionnaire
  questionnaireSubmitted?: boolean;  // Track if questionnaire was submitted
  questionnaireAnswers?: Record<string, string | string[]>;  // Store submitted answers
  // Rich travel UI data (displayed as separate bubbles)
  travelHighlights?: TravelHighlightsData;
  travelItinerary?: TravelItineraryData;
  travelBudget?: TravelBudgetData;
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
    status: "thinking" | "searching" | "executing" | "reading" | "querying knowledge base" | "researching destinations" | "planning itinerary" | "calculating budget" | "finding logistics";
    message: string;
  };
}

export interface SSESourcesEvent {
  type: "sources";
  data: {
    sources: Source[];
  };
}

// Travel question for interactive intake (legacy - single form)
export interface TravelQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; value: string }>;
  multiSelect: boolean;
  allowCustom: boolean;
}

export interface SSEQuestionsEvent {
  type: "questions";
  data: {
    questions: TravelQuestion[];
  };
}

// Questionnaire step (Claude Code style - multi-step wizard)
export interface QuestionStep {
  id: string;
  header: string;  // Short label like "Duration", "Budget" (max 12 chars)
  question: string;  // Full question text
  options: Array<{
    label: string;  // Display text
    value: string;  // Value to send back
    description?: string;  // Optional description below label
  }>;
  multiSelect: boolean;  // true = checkboxes, false = radio (auto-advance)
  allowCustom: boolean;  // Show "Other" text input
}

export interface Questionnaire {
  title: string;  // "Planning trip to Brazil"
  steps: QuestionStep[];  // Array of questions (only missing fields)
  context: Record<string, unknown>;  // Already known: {destination: "Brazil"}
}

export interface SSEQuestionnaireEvent {
  type: "questionnaire";
  data: Questionnaire;
}

// Rich Travel UI Events - Structured data for enhanced travel output

// Attraction for destination highlights carousel
export interface TravelAttraction {
  name: string;
  description: string;
  imageQuery: string;  // Search query for Unsplash (e.g., "Christ the Redeemer Rio")
}

export interface TravelHighlightsData {
  destination: string;
  bestTimeToVisit: string;
  tips: string[];
  attractions: TravelAttraction[];
}

export interface SSETravelHighlightsEvent {
  type: "travel_highlights";
  data: TravelHighlightsData;
}

// Itinerary day for timeline/accordion
export interface ItineraryActivity {
  time: "morning" | "afternoon" | "evening";
  activity: string;
  description?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;  // e.g., "Rio de Janeiro"
  activities: ItineraryActivity[];
}

export interface TravelItineraryData {
  duration: string;
  days: ItineraryDay[];
}

export interface SSETravelItineraryEvent {
  type: "travel_itinerary";
  data: TravelItineraryData;
}

// Budget breakdown for summary card
export interface BudgetCategory {
  category: string;
  icon: string;  // emoji
  range: string;  // e.g., "$800 - $1,200"
}

export interface TravelBudgetData {
  totalRange: string;
  categories: BudgetCategory[];
  tip: string;
}

export interface SSETravelBudgetEvent {
  type: "travel_budget";
  data: TravelBudgetData;
}

export type SSEEvent = SSETokenEvent | SSEAgentEvent | SSEDoneEvent | SSEErrorEvent | SSEStatusEvent | SSESourcesEvent | SSEQuestionsEvent | SSEQuestionnaireEvent | SSETravelHighlightsEvent | SSETravelItineraryEvent | SSETravelBudgetEvent;

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
