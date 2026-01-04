# Travel Agent Bugs

## Status: Fixed (v0.6.1, v0.7.0)

## Issues

### 1. No Follow-up Questions - FIXED (v0.6.1)
- **Symptom**: Agent plans trip immediately without asking for details
- **Expected**: Should ask about duration, budget, interests first
- **Solution**: Added intake phase with clickable question UI
- **Enhanced in v0.7.0**: LLM-powered dynamic questions, multi-step wizard

### 2. Fake Status Updates - FIXED (v0.6.1)
- **Symptom**: Only shows "Itinerary Planner" status, not real agent progress
- **Expected**: Show each agent's status as it works
- **Solution**: Used CrewAI `task_callback` for real status updates

### 3. Response Truncated - FIXED (v0.6.1)
- **Symptom**: Long responses cut off mid-sentence
- **Expected**: Complete, concise responses
- **Solution**: Added `max_tokens=800` limit, stream per-agent output

### 4. Long Wait Time - FIXED (v0.6.1)
- **Symptom**: 2+ minutes to get response
- **Expected**: Progressive output as each agent completes
- **Solution**: Stream each agent's output via task_callback

### 5. Wrong Model in Logs - FIXED (v0.6.1)
- **Symptom**: Logs show `gemini-2.5-flash` instead of configured model
- **Expected**: Use `GEMINI_MODEL` from settings
- **Solution**: Verified LLM configuration in CrewAI

### 6. Destination Lost After Form - FIXED (v0.6.2, superseded by v0.7.0)
- **Symptom**: After filling preferences form, agent asks "where would you like to go?" again
- **v0.6.2 Fix**: `_find_destination_in_history()` regex search (fragile)
- **v0.7.0 Fix**: LLM-powered context extraction (semantic understanding)

### 7. Static Questions Not Contextual - FIXED (v0.7.0)
- **Symptom**: Same 3 questions asked regardless of what user already said
- **Solution**: LLM generates questions only for missing fields with destination-specific options
- **See**: `.issues/llm-powered-dynamic-questions.md`

## Related Files
- `backend/app/agents/travel_agent.py`
- `backend/app/agents/travel_context.py`
- `frontend/app/components/TravelQuestionnaire.tsx`
- `frontend/app/components/TravelQuestionForm.tsx` (legacy)
- `frontend/lib/types.ts`
