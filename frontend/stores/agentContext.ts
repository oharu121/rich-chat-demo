/**
 * Zustand store for agent-specific context.
 *
 * Each agent (travel, code, etc.) has its own context slice that lives
 * in memory for the current session. Context is NOT persisted across
 * browser sessions to avoid stale data (e.g., old trip preferences
 * being applied to new destinations).
 */

import { create } from "zustand";
import type { AgentType } from "@/lib/types";

// Travel agent context
export interface TravelContext {
  [key: string]: string | string[] | null; // Index signature for Record<string, unknown> compatibility
  destination: string | null;
  duration: string | null;
  budget: string | null;
  interests: string[] | null;
  travel_dates: string | null;
  group_size: string | null;
  special_requirements: string | null;
}

// Union type for all agent contexts
export type AgentContext = TravelContext; // Add more as needed: | CodeContext | SearchContext

// Store state
interface AgentContextState {
  // Per-agent context storage
  contexts: Partial<Record<AgentType, AgentContext>>;

  // Get context for a specific agent
  getContext: (agent: AgentType) => AgentContext | undefined;

  // Update context for a specific agent (merges with existing)
  updateContext: (agent: AgentType, context: Partial<AgentContext>) => void;

  // Clear context for a specific agent
  clearContext: (agent: AgentType) => void;

  // Clear all contexts (e.g., on "Clear chat")
  clearAllContexts: () => void;
}

// Default empty travel context
const emptyTravelContext: TravelContext = {
  destination: null,
  duration: null,
  budget: null,
  interests: null,
  travel_dates: null,
  group_size: null,
  special_requirements: null,
};

// Create the store (in-memory only, no persistence)
export const useAgentContextStore = create<AgentContextState>()((set, get) => ({
  contexts: {},

  getContext: (agent: AgentType) => {
    return get().contexts[agent];
  },

  updateContext: (agent: AgentType, context: Partial<AgentContext>) => {
    set((state) => {
      const existing = state.contexts[agent] || getDefaultContext(agent);
      return {
        contexts: {
          ...state.contexts,
          [agent]: { ...existing, ...context },
        },
      };
    });
  },

  clearContext: (agent: AgentType) => {
    set((state) => {
      const { [agent]: _, ...rest } = state.contexts;
      return { contexts: rest };
    });
  },

  clearAllContexts: () => {
    set({ contexts: {} });
  },
}));

// Get default context for an agent type
function getDefaultContext(agent: AgentType): AgentContext {
  switch (agent) {
    case "travel":
      return { ...emptyTravelContext };
    default:
      return { ...emptyTravelContext }; // Default to travel context structure
  }
}

// Helper hook for travel context specifically
export function useTravelContext() {
  const { getContext, updateContext, clearContext } = useAgentContextStore();

  return {
    context: getContext("travel") as TravelContext | undefined,
    updateContext: (ctx: Partial<TravelContext>) => updateContext("travel", ctx),
    clearContext: () => clearContext("travel"),
  };
}
