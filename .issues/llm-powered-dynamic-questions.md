# LLM-Powered Dynamic Question Generation

## Status: Fixed (v0.7.0 - 2026-01-04)

## Problem

The travel agent's intake phase had multiple UX issues:

### 1. Static Questions Waste User's Time
- **Symptom**: User says "Brazil for 5 days" but still gets asked "How long is your trip?"
- **Root Cause**: Static `TRAVEL_QUESTIONS` constant asked the same 3 questions every time
- **Impact**: Frustrating UX, feels like the agent isn't listening

### 2. Generic Options Not Contextual
- **Symptom**: Brazil trip shows generic "Nature & Landscapes" instead of "Amazon Rainforest"
- **Root Cause**: Options hardcoded, not generated based on destination
- **Impact**: Missed opportunity for destination-specific suggestions

### 3. Destination Lost After Form Submission
- **Symptom**: After filling out preferences form, agent asks "where would you like to go?" again
- **Root Cause**: `_find_destination_in_history()` regex was fragile
- **Impact**: Conversation flow broken, user has to repeat information

### 4. Single-Form UI Not Ideal
- **Symptom**: All questions shown at once in one form
- **Expected**: Claude Code style multi-step wizard with progress indicator
- **Impact**: Overwhelming UI, no sense of progress

## Solution: LLM-Powered Intake

### Architecture Change

```
OLD: User → Regex Detection → Static Questions → Keyword Detection → CrewAI
NEW: User → Gemini Extraction → Dynamic Questions (if needed) → CrewAI
```

### Key Components

1. **TravelContext Pydantic Model** (`backend/app/agents/travel_context.py`)
   - Structured model for extracted travel info
   - `get_missing_required()` returns only unfilled fields

2. **LLM Context Extraction** (`_extract_context()`)
   - Gemini with `response_mime_type="application/json"` for reliable parsing
   - Semantic understanding of conversation, not regex

3. **Dynamic Question Generation** (`_generate_questions()`)
   - Only generates questions for missing fields
   - Options are destination-specific (Brazil → Amazon, Rio, Carnival)

4. **Multi-Step Questionnaire UI** (`TravelQuestionnaire.tsx`)
   - Progress bar showing "1 of 2"
   - Auto-advance on single-select
   - "Continue" button for multi-select
   - Back navigation
   - Card-style options with visible descriptions (not tooltips)

### SSE Event Flow

```
1. User: "/travel Brazil"
2. Backend: status("Analyzing your request...")
3. Backend: _extract_context() → {destination: "Brazil", duration: null, budget: null}
4. Backend: status("Preparing questions...")
5. Backend: _generate_questions(["duration", "budget"]) → contextual questions
6. Backend: questionnaire({title: "Planning trip to Brazil", steps: [...]})
7. Frontend: Renders multi-step wizard
8. User: Selects duration, budget
9. Backend: _extract_context() → all fields filled
10. Backend: status("Planning your trip...")
11. Backend: CrewAI agents execute
```

## Files Modified

| File | Changes |
|------|---------|
| `backend/app/agents/travel_context.py` | New Pydantic model |
| `backend/app/agents/travel_agent.py` | Complete rewrite with LLM extraction |
| `frontend/lib/types.ts` | `QuestionStep`, `Questionnaire`, `SSEQuestionnaireEvent` |
| `frontend/app/components/TravelQuestionnaire.tsx` | New multi-step wizard |
| `frontend/app/components/MessageBubble.tsx` | Render questionnaire |
| `frontend/hooks/useChat.ts` | Handle `questionnaire` event |
| `backend/app/routers/chat.py` | Forward `questionnaire` event |

## Related Issues

- Supersedes fix in v0.6.2 (`_find_destination_in_history()`)
- Closes issues #1, #3, #4 in `travel-agent-bugs.md`

## Testing

1. `/travel Brazil` → Should show 3 questions (duration, budget, interests)
2. `/travel Brazil for 5 days` → Should show 2 questions (budget, interests)
3. `/travel Brazil for 5 days, mid-range budget` → Should show 1 question (interests)
4. Options should be Brazil-specific (Amazon, Rio, Carnival, etc.)
