# Travel Context Persists Incorrectly Across Sessions

**Status: Fixed (2026-01-05)**

## Problem

When using the travel agent, the questionnaire (asking about duration, budget, interests) is skipped because context from a previous session is being loaded from localStorage and sent to the backend. The backend sees that all required fields are already filled and immediately generates a trip plan.

## Steps to Reproduce

1. Start fresh with no localStorage data
2. Type `/travel I want to go to Japan`
3. Agent shows questionnaire asking for duration, budget, interests
4. Fill out the form and submit
5. Close browser completely
6. Open browser again
7. Type `/travel I want to go to Brazil`
8. **Bug**: Agent skips questionnaire and immediately generates Brazil trip plan using the old duration/budget/interests from the Japan trip

## Expected Behavior

When starting a new trip conversation (different destination), the questionnaire should be shown again because the context (duration, budget, interests) from the previous trip is not relevant to the new destination.

## Root Cause

The Zustand store in `frontend/stores/agentContext.ts` uses the `persist` middleware to save context to localStorage:

```typescript
export const useAgentContextStore = create<AgentContextState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: "agent-context-storage",
      partialize: (state) => ({ contexts: state.contexts }),
    }
  )
);
```

In `ChatInterface.tsx`, when sending a message, the persisted context is always sent:

```typescript
const handleSendMessage = (content: string, agent: AgentType) => {
  const context = getContext(agent);  // Gets stale persisted context
  sendMessage(content, agent, context);
};
```

The backend receives this context and sees all required fields are filled:

```python
# In travel_agent.py stream_response()
if context:
    travel_context = TravelContext.model_validate(context)  # Uses stale context!
```

The context is only cleared when user clicks "Clear chat" button, not when starting a new conversation topic.

## Proposed Solutions

### Option 1: Clear Context on Destination Change (Recommended)

Detect when the user mentions a new destination and clear the travel context:

1. In `handleSendMessage`, check if this is a travel message with a new destination
2. If the message contains a destination different from `context.destination`, clear the context before sending
3. This could use simple regex or a more robust approach

```typescript
const handleSendMessage = (content: string, agent: AgentType) => {
  let context = getContext(agent);

  if (agent === "travel" && context) {
    // Simple check: if user mentions "to [Location]" and it differs from stored destination
    const destinationMatch = content.match(/(?:to|visit|go to)\s+([A-Z][a-zA-Z\s]+)/i);
    if (destinationMatch && context.destination) {
      const newDest = destinationMatch[1].trim().toLowerCase();
      const storedDest = context.destination.toLowerCase();
      if (!storedDest.includes(newDest) && !newDest.includes(storedDest)) {
        clearContext("travel");
        context = undefined;
      }
    }
  }

  sendMessage(content, agent, context);
};
```

### Option 2: Don't Persist Travel Context Across Sessions

Remove localStorage persistence for travel context since trip planning is typically a fresh conversation each time:

```typescript
// Option A: Remove persist entirely
export const useAgentContextStore = create<AgentContextState>()((set, get) => ({
  // ... same implementation without persist wrapper
}));

// Option B: Only persist in sessionStorage (cleared when browser closes)
persist(
  (set, get) => ({ ... }),
  {
    name: "agent-context-storage",
    storage: createJSONStorage(() => sessionStorage),  // Session only
  }
)
```

### Option 3: Backend Validates Context Freshness

The backend could check if the destination in the context matches the destination in the current message. If they differ, ignore the context:

```python
async def stream_response(self, message, history, context):
    if context:
        travel_context = TravelContext.model_validate(context)
        # Check if current message mentions a different destination
        extracted = await self._extract_context(message, [])
        if extracted.destination and travel_context.destination:
            if extracted.destination.lower() != travel_context.destination.lower():
                # New destination - reset context
                travel_context = extracted
```

## Files to Change

- `frontend/stores/agentContext.ts` - Adjust persistence strategy
- `frontend/app/components/ChatInterface.tsx` - Add destination change detection
- Optionally: `backend/app/agents/travel_agent.py` - Add server-side validation

## Design Considerations

- Option 1 is most user-friendly but adds complexity to frontend
- Option 2 is simplest but loses context if user accidentally refreshes mid-planning
- Option 3 adds latency (extra LLM call) but is most robust
- Combination: Use Option 2 (sessionStorage) + Option 1 (detect destination change within session)

## Solution Applied

Implemented Option 2: Don't persist context across browser sessions.

### Changes Made

1. **`frontend/stores/agentContext.ts`** - Removed `persist` middleware entirely
   - Agent context now lives in memory only
   - Clears when page refreshes or browser closes

2. **`frontend/stores/chatStore.ts`** - Switched from localStorage to sessionStorage
   - Chat history persists within a browser session (survives page refresh)
   - Clears when browser is closed

### Rationale

- Agent context (destination, budget, etc.) is session-specific and should not carry over
- Chat history benefits from persistence within a session but not across sessions
- Industry standard: session-scoped chat state for fresh-start interactions

## Related Issues

- `agent-badge-persistence.md` - Related context persistence feature
- `destination-lost-after-form.md` - Previous fix for losing destination
