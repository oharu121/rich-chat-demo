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
        """Create the travel planning crew with specialized agents."""
        llm = self._create_llm()

        def on_task_complete(task_output):
            """Callback after each task completes."""
            output_queue.put(("task_done", task_output.raw))

        # Research Agent
        researcher = Agent(
            role="Travel Researcher",
            goal="Research key travel information concisely",
            backstory="You provide brief, helpful destination highlights. Focus on top 5 attractions, best time to visit, and 2 local tips. Keep it concise.",
            llm=llm,
            verbose=False,
        )

        # Itinerary Agent
        planner = Agent(
            role="Itinerary Planner",
            goal="Create a brief sample itinerary",
            backstory="You create simple itineraries with morning and afternoon activities. Keep descriptions short.",
            llm=llm,
            verbose=False,
        )

        # Budget Agent
        budget_analyst = Agent(
            role="Budget Analyst",
            goal="Provide quick budget estimates",
            backstory="You give simple budget breakdowns: flights, hotels, daily costs. Include one money-saving tip.",
            llm=llm,
            verbose=False,
        )

        # Build context string for tasks
        context_str = context.to_context_string()

        # Tasks with concise expected outputs
        research_task = Task(
            description=f"""Research this destination: {context.destination}

User preferences:
{context_str}

Provide:
- Top 5 must-see attractions (1 sentence each)
- Best time to visit
- 2 local tips""",
            expected_output="Concise destination guide under 200 words",
            agent=researcher,
        )

        itinerary_task = Task(
            description=f"""Create a sample itinerary for {context.destination}.

User preferences:
{context_str}

Format as:
Day 1: Morning - X, Afternoon - Y
Day 2: Morning - X, Afternoon - Y
(Continue for duration: {context.duration or '3 days'})""",
            expected_output="Itinerary under 200 words",
            agent=planner,
            context=[research_task],
        )

        budget_task = Task(
            description=f"""Estimate travel budget for {context.destination}.

User preferences:
{context_str}

Provide:
- Flights estimate (range)
- Hotels per night (range based on {context.budget or 'mid-range'} budget)
- Daily expenses
- One money-saving tip""",
            expected_output="Budget breakdown under 100 words",
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
        agent_names = ["Research", "Itinerary", "Budget"]
        headers = [
            "## Destination Highlights",
            "## Sample Itinerary",
            "## Budget Estimate",
        ]
        current_agent_idx = 0

        def run_crew():
            try:
                crew = self._create_crew(travel_context, output_queue)
                crew.kickoff()
            except Exception as e:
                logger.error(f"Crew execution failed: {e}")
                output_queue.put(("error", str(e)))
            finally:
                output_queue.put(("done", None))

        # Start crew in background thread
        thread = threading.Thread(target=run_crew)
        thread.start()

        # Stream outputs as they arrive
        while True:
            await asyncio.sleep(0.1)

            while not output_queue.empty():
                event_type, data = output_queue.get()

                if event_type == "task_done" and data:
                    # Emit status for current agent
                    if current_agent_idx < len(agent_names):
                        agent_name = agent_names[current_agent_idx]
                        yield ("status", f"{agent_name} complete")

                        # Add section header
                        if current_agent_idx < len(headers):
                            yield ("token", f"\n\n{headers[current_agent_idx]}\n\n")

                    # Stream content in chunks
                    chunk_size = 50
                    for i in range(0, len(data), chunk_size):
                        chunk = data[i : i + chunk_size]
                        yield ("token", chunk)
                        await asyncio.sleep(0.01)

                    current_agent_idx += 1

                elif event_type == "error":
                    yield ("error", f"Travel planning failed: {data}")
                    return

                elif event_type == "done":
                    return

            if not thread.is_alive() and output_queue.empty():
                return
