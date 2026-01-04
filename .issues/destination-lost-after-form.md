# Destination Lost After Question Form Submission

## Status: Fixed (2026-01-03)

## Symptom
After user fills out the travel question form, the agent asks "where would you like to go?" again, even though the user already specified a destination like "Brazil" in the initial message.

## Steps to Reproduce
1. Type `/travel I want to go to Brazil`
2. Agent responds with "Great choice! Brazil is an amazing destination..." and shows the question form
3. User selects options (duration, budget, interests) and clicks "Plan My Trip"
4. Agent receives: "Here are my travel preferences: duration: 3-5 days, budget: mid-range, interests: nature"
5. Agent asks again: "Could you tell me where you'd like to go?"

## Expected Behavior
Agent should remember that the destination is "Brazil" from the earlier message and proceed to plan the trip with the provided preferences.

## Root Cause
The `_extract_destination()` method in `travel_agent.py` only checks the current message, not the conversation history. When the user submits preferences via the form, the message contains only preferences, not the destination.

## Proposed Solution
Add a `_find_destination_in_history()` method that:
1. Searches recent conversation history (last 6 messages) for destinations
2. Checks user messages using `_extract_destination()`
3. Also checks assistant messages for patterns like "**Brazil** is an amazing destination"

Call this method when:
- No destination found in current message
- BUT user has provided travel details (preferences)

## Files Modified
- `backend/app/agents/travel_agent.py`

## Fix Applied
Added `_find_destination_in_history()` method and updated `stream_response()` to call it when:
- No destination in current message
- User has provided travel details (preferences)

```python
def _find_destination_in_history(self, history: list[dict]) -> str | None:
    """Search conversation history for a destination."""
    for msg in reversed(history[-6:]):
        if msg.get("role") == "user":
            destination = self._extract_destination(msg.get("content", ""))
            if destination:
                return destination
        elif msg.get("role") == "assistant":
            content = msg.get("content", "")
            match = re.search(
                r"\*\*([A-Za-z\s]+)\*\*\s+is\s+(?:an?\s+)?(?:amazing|great|wonderful|fantastic)",
                content, re.IGNORECASE
            )
            if match:
                return match.group(1).strip()
    return None
```

## Related Issues
- Part of v0.6.2 bug fixes
