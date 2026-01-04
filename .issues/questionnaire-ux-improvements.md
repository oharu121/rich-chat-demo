# Questionnaire UX Improvements

**Status: Fixed**

## Issues

### 1. Auto-advance on Single-Select
**Current**: Clicking an option immediately advances to the next step.
**Problem**: No chance to reconsider, inconsistent with multi-select behavior.
**Solution**: Always require explicit "Continue" button click to proceed.

### 2. Form Buttons Clickable After Submission
**Current**: After submitting, the form remains visible and interactive.
**Problem**: User can click options again, causing unexpected behavior.
**Solution**: Hide the entire questionnaire after submission (cleaner than disabling).

### 3. Fake User Message After Submission
**Current**: A user bubble appears with "Here are my travel preferences:..." that the user never typed.
**Problem**: Confusing - creates content user didn't author.
**Solution**: Replace with assistant confirmation message (static template):
```
✓ Trip preferences saved:
• Destination: Brazil
• Duration: 3-7 days
• Budget: $1500-3500
```

## Files to Change

- `frontend/app/components/TravelQuestionnaire.tsx`
  - Remove auto-advance behavior
  - Add `onComplete` callback or track `submitted` state

- `frontend/app/components/MessageBubble.tsx`
  - Hide questionnaire when `message.questionnaireSubmitted` is true

- `frontend/hooks/useChat.ts` or `frontend/app/components/ChatInterface.tsx`
  - Change form submission to create assistant message instead of user message
  - Format as confirmation rather than preferences list

## UI Flow After Fix

```
1. User clicks option card → Card highlights (selected)
2. User clicks Continue → Advances to next step
3. User completes all steps → Clicks "Plan My Trip"
4. Questionnaire disappears
5. Assistant message appears: "✓ Trip preferences saved..."
6. Planning begins with status indicator
```

## Alternative Consideration

For the confirmation message, could use LLM to generate natural language:
> "Got it! I'll plan a 3-7 day trip to Brazil with a budget of $1500-3500..."

But static template is recommended for v1 (instant, consistent, no extra cost).
