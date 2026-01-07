"""
Travel planning agent using CrewAI multi-agent system with LLM-powered intake.

This agent uses Gemini to:
1. Extract travel context from conversation (semantic understanding)
2. Generate dynamic questions based on what's missing
3. Create contextual options based on the destination
"""

import asyncio
import json
import logging
import threading
from collections.abc import AsyncIterator
from queue import Queue

from crewai import Agent, Task, Crew, Process, LLM
from google import genai
from google.genai import types

from app.core.config import settings

from .base import BaseAgent
from .tools import convert_currency, get_local_currency, lookup_wikipedia_image
from .travel_context import TravelContext

logger = logging.getLogger(__name__)


class TravelAgent(BaseAgent):
    """Multi-agent travel planning using CrewAI with LLM-powered intake."""

    name = "Travel Planner"
    description = "Plan trips with a team of AI travel specialists"
    icon = "plane"

    def __init__(self):
        """Initialize the travel agent with Gemini client."""
        self._gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _create_llm(self) -> LLM:
        """Create LLM instance for CrewAI agents."""
        return LLM(
            model=f"gemini/{settings.GEMINI_MODEL}",
            api_key=settings.GEMINI_API_KEY,
            max_tokens=800,
        )

    def _format_history(self, history: list[dict]) -> str:
        """Format conversation history for LLM prompts."""
        if not history:
            return "No previous conversation."

        formatted = []
        for msg in history[-6:]:  # Last 6 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            formatted.append(f"{role.upper()}: {content}")
        return "\n".join(formatted)

    async def _call_gemini_json(self, prompt: str) -> dict:
        """Call Gemini API expecting JSON response.

        Uses response_mime_type for reliable JSON output.
        """
        try:
            response = await asyncio.to_thread(
                self._gemini_client.models.generate_content,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,  # Lower temp for more consistent extraction
                ),
            )

            if response.text:
                return json.loads(response.text)
            return {}

        except Exception as e:
            logger.error(f"Gemini JSON call failed: {e}")
            return {}

    async def _extract_context(
        self, message: str, history: list[dict]
    ) -> TravelContext:
        """Use LLM to extract travel context from conversation.

        This replaces the brittle regex-based detection with semantic understanding.
        """
        prompt = f"""Extract travel planning information from this conversation.
Return JSON matching this exact schema:

{{
    "destination": string or null,
    "duration": string or null,
    "budget": string or null,
    "interests": array of strings or null,
    "travel_dates": string or null,
    "group_size": string or null,
    "special_requirements": string or null
}}

Rules:
- Only include fields that are EXPLICITLY mentioned
- Use null for unknown/unmentioned fields
- For duration, extract phrases like "5 days", "2 weeks", "a week"
- For budget, extract "budget", "mid-range", "luxury" or specific amounts
- For interests, extract as array: ["nature", "culture", "adventure", etc.]

Conversation history:
{self._format_history(history)}

Latest message: {message}

Return ONLY the JSON object, no explanation."""

        result = await self._call_gemini_json(prompt)

        try:
            return TravelContext.model_validate(result)
        except Exception as e:
            logger.error(f"Failed to validate TravelContext: {e}")
            return TravelContext()

    async def _generate_questions(
        self, context: TravelContext, missing: list[str]
    ) -> list[dict]:
        """Generate contextual questions for missing fields.

        Questions are tailored to the destination and only ask about
        what's actually missing.
        """
        # Map field names to question metadata
        field_info = {
            "duration": {
                "header": "Duration",
                "base_question": "How long will you be staying",
                "multiSelect": False,
                "allowCustom": True,
            },
            "budget": {
                "header": "Budget",
                "base_question": "What's your budget range",
                "multiSelect": False,
                "allowCustom": False,
            },
            "interests": {
                "header": "Interests",
                "base_question": "What interests you most",
                "multiSelect": True,
                "allowCustom": True,
            },
        }

        prompt = f"""Generate intake questions for trip planning to {context.destination or 'the destination'}.

Generate questions ONLY for these missing fields: {missing}

For each field, generate contextual options based on the destination.
Make options specific and relevant to {context.destination or 'general travel'}.

Return JSON array with this exact structure for each question:
[
    {{
        "id": "field_name",
        "header": "Short Label",
        "question": "Full question text?",
        "options": [
            {{"label": "Display text", "value": "value_to_store", "description": "Optional explanation"}}
        ],
        "multiSelect": boolean,
        "allowCustom": boolean
    }}
]

Examples for {context.destination or 'Brazil'}:

For "duration":
{{
    "id": "duration",
    "header": "Duration",
    "question": "How long will you be staying in {context.destination or 'Brazil'}?",
    "options": [
        {{"label": "3-5 days", "value": "3-5 days", "description": "Quick getaway"}},
        {{"label": "1-2 weeks", "value": "1-2 weeks", "description": "Good for exploring"}},
        {{"label": "2+ weeks", "value": "2+ weeks", "description": "In-depth experience"}}
    ],
    "multiSelect": false,
    "allowCustom": true
}}

For "interests" with destination "Brazil":
{{
    "id": "interests",
    "header": "Interests",
    "question": "What interests you about Brazil? (select multiple)",
    "options": [
        {{"label": "Amazon Rainforest", "value": "amazon", "description": "Wildlife & jungle tours"}},
        {{"label": "Beaches & Rio", "value": "beaches", "description": "Copacabana, Ipanema"}},
        {{"label": "Culture & Carnival", "value": "culture", "description": "Music, dance, festivals"}},
        {{"label": "Adventure Sports", "value": "adventure", "description": "Hiking, surfing"}}
    ],
    "multiSelect": true,
    "allowCustom": true
}}

Generate {len(missing)} question(s) for: {missing}
Make options SPECIFIC to {context.destination or 'the destination'}.

Return ONLY the JSON array."""

        result = await self._call_gemini_json(prompt)

        # Validate and ensure we have valid questions
        if isinstance(result, list) and len(result) > 0:
            # Add fallback values for any missing fields
            for q in result:
                if "id" not in q:
                    continue
                field = q["id"]
                if field in field_info:
                    q.setdefault("header", field_info[field]["header"])
                    q.setdefault("multiSelect", field_info[field]["multiSelect"])
                    q.setdefault("allowCustom", field_info[field]["allowCustom"])
            return result

        # Fallback to static questions if LLM fails
        logger.warning("LLM question generation failed, using fallback")
        return self._get_fallback_questions(missing, context.destination)

    def _get_fallback_questions(
        self, missing: list[str], destination: str | None
    ) -> list[dict]:
        """Fallback static questions if LLM generation fails."""
        fallback = {
            "duration": {
                "id": "duration",
                "header": "Duration",
                "question": f"How long will you be staying{' in ' + destination if destination else ''}?",
                "options": [
                    {"label": "3-5 days", "value": "3-5 days"},
                    {"label": "1-2 weeks", "value": "1-2 weeks"},
                    {"label": "2+ weeks", "value": "2+ weeks"},
                ],
                "multiSelect": False,
                "allowCustom": True,
            },
            "budget": {
                "id": "budget",
                "header": "Budget",
                "question": "What's your budget range?",
                "options": [
                    {"label": "Budget ($50-100/day)", "value": "budget"},
                    {"label": "Mid-range ($100-200/day)", "value": "mid-range"},
                    {"label": "Luxury ($200+/day)", "value": "luxury"},
                ],
                "multiSelect": False,
                "allowCustom": False,
            },
            "interests": {
                "id": "interests",
                "header": "Interests",
                "question": "What interests you most? (select multiple)",
                "options": [
                    {"label": "Nature & Landscapes", "value": "nature"},
                    {"label": "Culture & History", "value": "culture"},
                    {"label": "Adventure Activities", "value": "adventure"},
                    {"label": "Food & Markets", "value": "food"},
                ],
                "multiSelect": True,
                "allowCustom": True,
            },
        }
        return [fallback[field] for field in missing if field in fallback]

    def _create_crew(self, context: TravelContext, output_queue: Queue) -> Crew:
        """Create the travel planning crew with specialized agents.

        Each agent returns structured JSON for rich UI rendering.
        """
        llm = self._create_llm()

        task_names = ["highlights", "itinerary", "budget"]
        task_idx = [0]  # Use list to allow mutation in closure

        def on_task_complete(task_output):
            """Callback after each task completes."""
            task_name = task_names[task_idx[0]] if task_idx[0] < len(task_names) else "unknown"
            output_queue.put(("task_done", task_name, task_output.raw))
            task_idx[0] += 1

        # Research Agent - returns structured highlights JSON
        # Has lookup_wikipedia_image tool for finding verified image URLs
        researcher = Agent(
            role="Travel Researcher",
            goal="Research key travel information and return structured JSON with real image URLs",
            backstory="""You provide destination highlights in JSON format. Focus on top 5 attractions, best time to visit, and 2 local tips.
            Use the lookup_wikipedia_image tool to find real, working image URLs for each attraction.""",
            llm=llm,
            tools=[lookup_wikipedia_image],
            verbose=False,
        )

        # Itinerary Agent - returns structured itinerary JSON
        planner = Agent(
            role="Itinerary Planner",
            goal="Create a sample itinerary and return structured JSON",
            backstory="You create itineraries in JSON format with morning, afternoon, and evening activities for each day.",
            llm=llm,
            verbose=False,
        )

        # Budget Agent - returns structured budget JSON
        # Has currency tools for accurate conversions
        budget_analyst = Agent(
            role="Budget Analyst",
            goal="Provide budget estimates and return structured JSON",
            backstory="""You give budget breakdowns in JSON format: flights, hotels, food, activities, and one money-saving tip.
            Use get_local_currency to find the destination's currency.
            Use convert_currency for accurate currency conversions when needed.""",
            llm=llm,
            tools=[convert_currency, get_local_currency],
            verbose=False,
        )

        # Build context string for tasks
        context_str = context.to_context_string()

        # Tasks with JSON output format
        research_task = Task(
            description=f"""Research this destination: {context.destination}

User preferences:
{context_str}

Return a JSON object with this EXACT structure:
{{
    "destination": "{context.destination}",
    "bestTimeToVisit": "Month to Month (reason)",
    "tips": ["tip 1", "tip 2"],
    "attractions": [
        {{"name": "Attraction Name", "description": "One sentence description", "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/..."}},
        ... (5 attractions total)
    ]
}}

For imageUrl, you MUST provide actual working image URLs. Use URLs from:
- Wikipedia Commons (https://upload.wikimedia.org/wikipedia/commons/...)
- These are real, publicly accessible image URLs that can be displayed directly

Example real URLs:
- Christ the Redeemer: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_-_Cristo_Redentor.jpg/800px-Christ_the_Redeemer_-_Cristo_Redentor.jpg"
- Eiffel Tower: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg"

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.""",
            expected_output="Valid JSON object with destination highlights including real Wikipedia Commons image URLs",
            agent=researcher,
        )

        itinerary_task = Task(
            description=f"""Create a sample itinerary for {context.destination}.

User preferences:
{context_str}
Duration: {context.duration or '3 days'}

Return a JSON object with this EXACT structure:
{{
    "duration": "{context.duration or '3 days'}",
    "days": [
        {{
            "day": 1,
            "title": "City/Area Name",
            "activities": [
                {{"time": "morning", "activity": "Activity name", "description": "Brief description"}},
                {{"time": "afternoon", "activity": "Activity name", "description": "Brief description"}},
                {{"time": "evening", "activity": "Activity name", "description": "Brief description"}}
            ]
        }},
        ... (one entry per day)
    ]
}}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.""",
            expected_output="Valid JSON object with itinerary",
            agent=planner,
            context=[research_task],
        )

        budget_task = Task(
            description=f"""Estimate travel budget for {context.destination}.

User preferences:
{context_str}
Budget level: {context.budget or 'mid-range'}

Return a JSON object with this EXACT structure:
{{
    "totalRange": "$X,XXX - $X,XXX",
    "categories": [
        {{"category": "Flights", "icon": "✈️", "range": "$XXX - $XXX"}},
        {{"category": "Accommodation", "icon": "🏨", "range": "$XXX - $XXX"}},
        {{"category": "Food & Dining", "icon": "🍽️", "range": "$XXX - $XXX"}},
        {{"category": "Activities", "icon": "🎯", "range": "$XXX - $XXX"}},
        {{"category": "Transportation", "icon": "🚌", "range": "$XXX - $XXX"}}
    ],
    "tip": "One money-saving tip"
}}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.""",
            expected_output="Valid JSON object with budget breakdown",
            agent=budget_analyst,
            context=[research_task],
        )

        return Crew(
            agents=[researcher, planner, budget_analyst],
            tasks=[research_task, itinerary_task, budget_task],
            process=Process.sequential,
            task_callback=on_task_complete,
            verbose=False,
        )

    async def stream_response(
        self,
        message: str,
        history: list[dict],
        context: dict | None = None,
    ) -> AsyncIterator[tuple[str, str | dict | list[dict]]]:
        """
        Execute travel planning with LLM-powered intake.

        Flow:
        1. If context provided, use it directly (structured memory from frontend)
        2. Otherwise, extract context using LLM (semantic understanding)
        3. If missing required fields → generate dynamic questions
        4. If complete → run CrewAI planning agents
        """
        # Step 1: Show analyzing status
        yield ("status", "Analyzing your request...")

        # Step 2: Use frontend context if provided, otherwise extract with LLM
        if context:
            # Frontend sent structured context - use it directly
            try:
                travel_context = TravelContext.model_validate(context)
                logger.info(f"Using frontend context: {travel_context.model_dump()}")
            except Exception as e:
                logger.warning(f"Failed to parse frontend context: {e}, falling back to LLM extraction")
                travel_context = await self._extract_context(message, history)
        else:
            # No context from frontend - extract with LLM
            travel_context = await self._extract_context(message, history)
            logger.info(f"Extracted context via LLM: {travel_context.model_dump()}")

        # Step 3: Check if we have a destination
        if not travel_context.destination:
            yield ("token", "I'd love to help plan your trip! Where would you like to go?")
            return

        # Step 4: Check what's missing
        missing = travel_context.get_missing_required()

        if missing:
            # Step 5: Generate dynamic questions for missing fields
            yield ("status", "Preparing questions...")

            questions = await self._generate_questions(travel_context, missing)
            logger.info(f"Generated {len(questions)} questions for missing fields: {missing}")

            # Step 6: Emit questionnaire
            yield ("questionnaire", {
                "title": f"Planning trip to {travel_context.destination}",
                "steps": questions,
                "context": travel_context.model_dump(exclude_none=True),
            })
            return

        # Step 7: All required info gathered - run planning crew
        yield ("status", "Planning your trip...")

        output_queue: Queue = Queue()

        def run_crew():
            try:
                crew = self._create_crew(travel_context, output_queue)
                crew.kickoff()
            except Exception as e:
                logger.error(f"Crew execution failed: {e}")
                output_queue.put(("error", None, str(e)))
            finally:
                output_queue.put(("done", None, None))

        # Start crew in background thread
        thread = threading.Thread(target=run_crew)
        thread.start()

        # Intro message
        yield ("token", f"Here's your travel plan for {travel_context.destination}!\n\n")

        # Stream outputs as they arrive
        while True:
            await asyncio.sleep(0.1)

            while not output_queue.empty():
                event_type, task_name, data = output_queue.get()

                if event_type == "task_done" and data:
                    # Parse JSON from agent output
                    parsed_data = self._parse_agent_json(data, task_name)

                    if task_name == "highlights":
                        yield ("status", "Research complete")
                        if parsed_data:
                            yield ("travel_highlights", parsed_data)
                        else:
                            # Fallback to text if JSON parsing fails
                            yield ("token", f"\n## Destination Highlights\n\n{data}\n\n")

                    elif task_name == "itinerary":
                        yield ("status", "Itinerary complete")
                        if parsed_data:
                            yield ("travel_itinerary", parsed_data)
                        else:
                            yield ("token", f"\n## Sample Itinerary\n\n{data}\n\n")

                    elif task_name == "budget":
                        yield ("status", "Budget complete")
                        if parsed_data:
                            yield ("travel_budget", parsed_data)
                        else:
                            yield ("token", f"\n## Budget Estimate\n\n{data}\n\n")

                elif event_type == "error":
                    yield ("error", f"Travel planning failed: {data}")
                    return

                elif event_type == "done":
                    return

            if not thread.is_alive() and output_queue.empty():
                return

    def _parse_agent_json(self, raw_output: str, task_name: str = "unknown") -> dict | None:
        """Parse JSON from agent output, handling markdown code blocks."""
        import re

        # Log raw output for debugging
        logger.info(f"Raw output from {task_name} (first 500 chars): {raw_output[:500]}")

        try:
            # Try direct JSON parse first
            result = json.loads(raw_output)
            logger.info(f"Successfully parsed JSON for {task_name}")
            return result
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code block
        json_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", raw_output)
        if json_match:
            try:
                result = json.loads(json_match.group(1))
                logger.info(f"Successfully parsed JSON from code block for {task_name}")
                return result
            except json.JSONDecodeError:
                pass

        # Try finding JSON object in text
        json_match = re.search(r"\{[\s\S]*\}", raw_output)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                logger.info(f"Successfully parsed JSON from embedded object for {task_name}")
                return result
            except json.JSONDecodeError:
                pass

        logger.error(f"Failed to parse JSON for {task_name}. Full output: {raw_output}")
        return None
