# Rich Travel UI Rendering Bugs

**Status**: Open
**Created**: 2026-01-06
**Priority**: High
**Component**: Travel Agent UI

## Problem Summary

The Rich Travel UI enhancement (v0.9.0) has several critical rendering and UX issues that need to be addressed:

1. **All components in single bubble** - Highlights, Itinerary, Budget all render in one message bubble instead of separate bubbles
2. **Images show fallback emoji** - Unsplash Source API failing, showing fallback emoji instead of attraction photos
3. **Results wait until all ready** - User has to wait for all 3 agents to complete before seeing anything
4. **Itinerary missing** - Only Highlights and Budget appear, Itinerary is not showing
5. **Cards too small** - Attraction cards are tiny, user wants one slide at a time with full-size photo

## Screenshot

![Screenshot showing issues](../screenshot-rich-travel-issues.png)

## Root Cause Analysis

### Issue 1: Single Bubble Rendering
**File**: `frontend/app/components/MessageBubble.tsx` (lines 293-310)

All three travel components are rendered inside the same message bubble wrapper:
```tsx
<div className="bg-white text-gray-800 rounded-2xl...">
  {message.travelHighlights && <DestinationHighlights />}
  {message.travelItinerary && <ItineraryTimeline />}
  {message.travelBudget && <BudgetSummary />}
</div>
```

**Why**: The `useChat.ts` hook stores all three data fields on the same Message object via `updateLastMessage()`. MessageBubble then renders all three in its single bubble wrapper.

### Issue 2: Images Failing
**File**: `frontend/app/components/travel/DestinationHighlights.tsx` (line 14-17)

Using deprecated Unsplash Source API:
```typescript
function getUnsplashUrl(query: string, width = 400, height = 300): string {
  return `https://source.unsplash.com/${width}x${height}/?${query}`;
}
```

**Why**:
- Unsplash Source API is rate-limited (~50 req/hour per IP)
- Requires proper headers/authentication
- Multiple images requested simultaneously hit the limit
- CORS restrictions in some environments

### Issue 3: Results Wait for All
**File**: `backend/app/agents/travel_agent.py` (line 405)

```python
return Crew(
    agents=[researcher, planner, budget_analyst],
    tasks=[research_task, itinerary_task, budget_task],
    process=Process.sequential,  # Waits for each task
)
```

**Why**: CrewAI runs tasks sequentially. Each task takes 30-60 seconds. The `crew.kickoff()` call blocks until all three complete. Events are only yielded after each task finishes, but users perceive them arriving together because:
1. Frontend re-renders once when data arrives
2. There's no visual indication between task completions

### Issue 4: Itinerary Missing
**File**: `backend/app/agents/travel_agent.py` (lines 506-511)

```python
if parsed_data:
    yield ("travel_itinerary", parsed_data)
else:
    yield ("token", f"\n## Sample Itinerary\n\n{data}\n\n")
```

**Why**: The LLM isn't reliably returning valid JSON. When `_parse_agent_json()` fails, it falls back to text output which gets appended to the content string, not the structured component. The Itinerary task may be producing markdown instead of JSON.

### Issue 5: Cards Too Small
**File**: `frontend/app/components/travel/DestinationHighlights.tsx` (line 92)

```tsx
<div className="flex-shrink-0 w-52 snap-start">
```

Fixed 208px width is too small to display meaningful content. User expectation was a full-width carousel with one attraction at a time.

## Recommended Fixes

### Fix 1: Separate Message Bubbles
Create a new message for each travel component instead of updating the same message:
- Modify `useChat.ts` to call `addMessage()` for each travel event
- Or create a special `TravelResultsContainer` component that renders each section as a visually distinct bubble

### Fix 2: Fix Image Loading
Option A: Use Unsplash API with API key (requires backend proxy)
Option B: Use placeholder service like Picsum or Lorem Flickr
Option C: Have backend generate actual image URLs from a reliable source

### Fix 3: Progressive Loading
Show each section as it arrives:
- Add loading skeletons for pending sections
- Display "Research complete" -> show highlights immediately
- Display "Itinerary complete" -> show itinerary immediately
- Don't wait for all three

### Fix 4: Improve JSON Reliability
- Use CrewAI's `output_json` parameter for structured output
- Add retry logic for JSON parsing failures
- Add validation with default fallback values

### Fix 5: Full-Width Carousel
Change from multi-card horizontal scroll to single-card carousel:
- One attraction at a time
- Navigation arrows/dots
- Full-width photo with description below

## Honest Assessment

The current implementation shipped too quickly without proper testing. Key issues:

1. **Architecture mismatch**: The design document specified "separate bubbles" but the implementation put everything in one message
2. **External dependency risk**: Relying on Unsplash Source API without fallback or caching was risky
3. **No progressive rendering**: Despite SSE streaming, the UX feels like batch loading
4. **JSON prompt engineering**: Asking LLMs to "return ONLY valid JSON" is unreliable without structured output parameters

The core concept is good but the execution needs refinement. Priority should be:
1. Fix image loading (most visible bug)
2. Implement progressive loading (best UX improvement)
3. Redesign carousel (better content presentation)
4. Separate bubbles (nice-to-have, lower priority)

## Files to Modify

- `frontend/app/components/travel/DestinationHighlights.tsx`
- `frontend/app/components/MessageBubble.tsx`
- `frontend/hooks/useChat.ts`
- `backend/app/agents/travel_agent.py`
