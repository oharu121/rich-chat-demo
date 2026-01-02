# Travel Agent Bugs

## Status: Open

## Issues

### 1. No Follow-up Questions
- **Symptom**: Agent plans trip immediately without asking for details
- **Expected**: Should ask about duration, budget, interests first
- **Solution**: Add intake phase with clickable question UI

### 2. Fake Status Updates
- **Symptom**: Only shows "Itinerary Planner" status, not real agent progress
- **Expected**: Show each agent's status as it works
- **Solution**: Use CrewAI `task_callback` for real status updates

### 3. Response Truncated
- **Symptom**: Long responses cut off mid-sentence
- **Expected**: Complete, concise responses
- **Solution**: Add `max_tokens` limit, stream per-agent output

### 4. Long Wait Time
- **Symptom**: 2+ minutes to get response
- **Expected**: Progressive output as each agent completes
- **Solution**: Stream each agent's output via task_callback

### 5. Wrong Model in Logs
- **Symptom**: Logs show `gemini-2.5-flash` instead of configured model
- **Expected**: Use `GEMINI_MODEL` from settings
- **Solution**: Verify LLM configuration in CrewAI

## Related Files
- `backend/app/agents/travel_agent.py`
- `frontend/app/components/TravelQuestionForm.tsx`
- `frontend/lib/types.ts`
