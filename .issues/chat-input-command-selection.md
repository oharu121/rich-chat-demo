## Bug Report: Chat Input Command Selection Issues

### Description
Two UX issues with the slash command selection in the chat input box:

1. **Command text doesn't disappear**: After selecting `/code` from the command menu, the text "/code " remains visible in the input box instead of being replaced by a chip
2. **Chip positioned incorrectly**: The command indicator chip appears on the border of the input box instead of inline within the input area

### Current Behavior

**Selecting a command:**
1. Type `/` → menu appears ✅
2. Select `/code` from menu → input shows "/code " ❌
3. Command chip appears on top border ❌

**Visual example:**
```
┌─────────────────────────────┐
│  /code ◀── chip on border   │
├─────────────────────────────┤
│ /code your message here     │ ◀── command text still visible
└─────────────────────────────┘
```

### Expected Behavior

**Selecting a command:**
1. Type `/` → menu appears ✅
2. Select `/code` from menu → input clears, inline chip appears ✅
3. Type message → text appears after chip with proper spacing ✅

**Visual example:**
```
┌─────────────────────────────┐
│ [code ×] your message here  │ ◀── chip inline, no slash prefix
└─────────────────────────────┘
```

### Technical Details

**Issue 1 Root Cause:**
In `frontend/app/components/ChatInput.tsx:77`, the `handleCommandSelect` function sets the input to include the command text:
```tsx
const handleCommandSelect = (command: SlashCommand) => {
  setInput(command.command + " ");  // Sets to "/code "
  closeMenu();
  textareaRef.current?.focus();
};
```

**Issue 2 Root Cause:**
In `frontend/app/components/ChatInput.tsx:125-129`, the chip uses absolute positioning outside the input container:
```tsx
{activeCommand && (
  <div className="absolute -top-3 left-4 ...">
    {activeCommand.command}  // Shows "/code"
  </div>
)}
```

### Proposed Solution

1. Track selected command as separate state (not encoded in input text)
2. Clear input completely when command is selected
3. Render chip as inline overlay inside the textarea container
4. Display command name without "/" prefix (show "code" not "/code")
5. Add dismiss button (×) to chip
6. Add Escape key handler to clear selected command
7. Adjust textarea left padding when chip is shown

### Design Rationale

The chip-based approach (similar to Slack/Discord) provides better UX:
- Visual separation between command (metadata) and message (content)
- Cleaner input area for users to focus on their message
- More intuitive and familiar interaction pattern
- Space-efficient compact representation

### Files to Modify

- `frontend/app/components/ChatInput.tsx` - Main implementation
- No other files need changes

### Additional Context

This affects the core chat experience and should be prioritized for better UX alignment with modern chat applications.

---

**Environment:**
- Component: ChatInput
- Files: `frontend/app/components/ChatInput.tsx`, `frontend/hooks/useSlashCommands.ts`
- Related: SlashCommandMenu component
