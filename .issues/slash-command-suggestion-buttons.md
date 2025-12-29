## Bug: Slash Command Suggestion Buttons Don't Select Command

### Description
When clicking slash command suggestion buttons on the welcome screen, the command is not selected. Only the input is focused, but no chip appears.

### Current Behavior
1. User sees welcome screen with command buttons (`/code`, `/search`, `/explain`, `/help`)
2. User clicks `/code` button
3. Input is focused, but nothing else happens
4. No chip appears, command is not selected

### Expected Behavior
1. User clicks `/code` button
2. The "code" chip appears in the input box (with appropriate color theme)
3. Input is focused and ready for the user to type their message

### Root Cause
In `frontend/app/components/ChatInterface.tsx` (lines 176-180), the onClick handler only focuses the input:
```tsx
onClick={() => {
  chatInputRef.current?.focus();
}}
```

It does not call any method to select the command.

### Proposed Fix
1. Expose a `selectCommand` method from `ChatInput` via the ref
2. Call `chatInputRef.current?.selectCommand(cmd)` when clicking suggestion buttons

### Files to Modify
- `frontend/app/components/ChatInput.tsx` - Add `selectCommand` to ref
- `frontend/app/components/ChatInterface.tsx` - Update onClick handler
