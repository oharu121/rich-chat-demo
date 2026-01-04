# User Message Agent Badge Styling Inconsistency

**Status: Fixed**

## Problem

The agent badge on user messages (`/travel`) had a different style and position than the agent badge on assistant messages (`✈️ Travel`).

### Before
- Right-aligned white transparent badge (`bg-white/20`)
- Text only, no icon (`/travel`)
- Custom inline styling

### After
- Left-aligned colored badge (same as assistant)
- Icon + label (`✈️ Travel`)
- Uses shared `AgentBadge` component

## Solution

Replaced the custom inline badge with the existing `AgentBadge` component:

```diff
- <div className="mb-2 flex justify-end">
-   <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white/90">
-     /{message.agent}
-   </span>
- </div>
+ <div className="mb-2">
+   <AgentBadge agent={message.agent} />
+ </div>
```

## Files Changed

- `frontend/app/components/MessageBubble.tsx`
