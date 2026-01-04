# Agent Badge Persistence in Chat Input

**Status: Fixed in v0.8.1**

## Problem

When using `/travel` (or any slash command) to select an agent, the agent badge disappears from the chat input after sending a message. This forces users to re-type the command for every message, even during multi-turn conversations with the same agent.

## Current Behavior

```
1. User types "/travel" → Badge appears: [✈️ Travel ×]
2. User types message and sends → Message sent with travel agent
3. Badge disappears! → Input shows no agent selected
4. User has to type "/travel" again for next message
```

## Expected Behavior

```
1. User types "/travel" → Badge appears: [✈️ Travel ×]
2. User types message and sends → Message sent with travel agent
3. Badge persists! → Input still shows [✈️ Travel ×]
4. User can continue conversation without re-selecting
5. User clicks X or presses Escape → Badge dismissed
```

## Root Cause

In `frontend/app/components/ChatInput.tsx`, the `handleSubmit()` function clears the selected command unconditionally:

```typescript
const handleSubmit = () => {
  // ...
  onSend(input.trim(), agent);
  setInput("");
  setSelectedCommand(null);  // ← Line 74: Clears badge on every send
  closeMenu();
};
```

## Solution

Remove `setSelectedCommand(null)` from `handleSubmit()`. The badge should only be cleared via:
- X button click (already implemented)
- Escape key (already implemented)

## Files to Change

- `frontend/app/components/ChatInput.tsx`
  - Remove line 74: `setSelectedCommand(null)` from `handleSubmit()`

## UI Flow After Fix

```
┌─────────────────────────────────────────────────────┐
│ ✈️ Travel  ×  │  Plan a trip to Brazil              │
└─────────────────────────────────────────────────────┘
                          ↓ Send
┌─────────────────────────────────────────────────────┐
│ ✈️ Travel  ×  │  █                                  │  ← Badge persists!
└─────────────────────────────────────────────────────┘
                          ↓ Click X or Escape
┌─────────────────────────────────────────────────────┐
│  █                                                  │  ← Back to default
└─────────────────────────────────────────────────────┘
```
