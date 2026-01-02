"""
Travel planning agent using CrewAI multi-agent system.
"""

import asyncio
import re
import threading
from collections.abc import AsyncIterator
from queue import Queue

from crewai import Agent, Task, Crew, Process, LLM

from app.core.config import settings

from .base import BaseAgent


# Default travel questions when info is missing
TRAVEL_QUESTIONS = [
    {
        "id": "duration",
        "question": "How long is your trip?",
        "options": [
            {"label": "3-5 days", "value": "3-5 days"},
            {"label": "1-2 weeks", "value": "1-2 weeks"},
            {"label": "2+ weeks", "value": "2+ weeks"},
        ],
        "multiSelect": False,
        "allowCustom": True,
    },
    {
        "id": "budget",
        "question": "What's your budget range?",
        "options": [
            {"label": "Budget ($50-100/day)", "value": "budget"},
            {"label": "Mid-range ($100-200/day)", "value": "mid-range"},
            {"label": "Luxury ($200+/day)", "value": "luxury"},
        ],
        "multiSelect": False,
        "allowCustom": False,
    },
    {
        "id": "interests",
        "question": "What interests you most? (select all that apply)",
        "options": [
            {"label": "Nature & Landscapes", "value": "nature"},
            {"label": "Culture & History", "value": "culture"},
            {"label": "Adventure Activities", "value": "adventure"},
            {"label": "Food & Markets", "value": "food"},
        ],
        "multiSelect": True,
        "allowCustom": True,
    },
]


class TravelAgent(BaseAgent):
    """Multi-agent travel planning using CrewAI."""

    name = "Travel Planner"
    description = "Plan trips with a team of AI travel specialists"
    icon = "plane"

    def _create_llm(self) -> LLM:
        """Create LLM instance for CrewAI agents."""
        return LLM(
            model=f"gemini/{settings.GEMINI_MODEL}",
            api_key=settings.GEMINI_API_KEY,
            max_tokens=800,
        )

    def _extract_destination(self, message: str) -> str | None:
        """Extract destination from user message."""
        message_lower = message.lower()

        # Common patterns: "go to X", "visit X", "trip to X", "travel to X"
        patterns = [
            r"(?:go|going|trip|travel|visit|visiting|fly|flying)\s+to\s+([A-Za-z\s,]+)",
            r"(?:plan|planning)\s+(?:a\s+)?(?:trip|visit)\s+to\s+([A-Za-z\s,]+)",
            r"^([A-Za-z\s,]+)$",  # Just the destination name
        ]

        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                destination = match.group(1).strip()
                # Clean up common trailing words
                destination = re.sub(r"\s+(for|in|during|next|this).*$", "", destination, flags=re.IGNORECASE)
                if destination and len(destination) > 2:
                    return destination

        return None

    def _has_travel_details(self, message: str, history: list[dict]) -> bool:
        """Check if user has provided travel details (duration, budget, interests)."""
        combined = message.lower()
        for msg in history[-4:]:  # Check recent history
            combined += " " + msg.get("content", "").lower()

        # Check for duration keywords
        has_duration = any(word in combined for word in [
            "days", "day", "week", "weeks", "month",
            "short", "long", "quick", "extended",
        ])

        # Check for budget keywords
        has_budget = any(word in combined for word in [
            "budget", "cheap", "luxury", "mid-range", "midrange",
            "affordable", "expensive", "$", "dollar", "cost",
        ])

        # Check for interest keywords
        has_interests = any(word in combined for word in [
            "nature", "culture", "history", "adventure", "food",
            "beach", "mountain", "city", "museum", "hiking",
            "relaxation", "sightseeing", "shopping",
        ])

        # Also check if this is a follow-up with preferences
        has_preferences = "preferences" in combined or "here are my" in combined

        return (has_duration and has_budget) or has_preferences or (has_duration and has_interests)

    def _create_crew(self, query: str, context: str, output_queue: Queue) -> Crew:
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
            backstory="You create simple 3-day itineraries with morning and afternoon activities. Keep descriptions short.",
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

        # Tasks with concise expected outputs
        research_task = Task(
            description=f"""Research this destination: {query}

User preferences: {context}

Provide:
- Top 5 must-see attractions (1 sentence each)
- Best time to visit
- 2 local tips""",
            expected_output="Concise destination guide under 200 words",
            agent=researcher,
        )

        itinerary_task = Task(
            description=f"""Create a 3-day sample itinerary for {query}.

User preferences: {context}

Format as:
Day 1: Morning - X, Afternoon - Y
Day 2: Morning - X, Afternoon - Y
Day 3: Morning - X, Afternoon - Y""",
            expected_output="3-day itinerary under 150 words",
            agent=planner,
            context=[research_task],
        )

        budget_task = Task(
            description=f"""Estimate travel budget for {query}.

User preferences: {context}

Provide:
- Flights estimate (range)
- Hotels per night (range)
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
    ) -> AsyncIterator[tuple[str, str | dict | list[dict]]]:
        """
        Execute travel planning crew and stream results.

        Flow:
        1. If destination found but no details → emit questions event
        2. If has details → run crew and stream each agent's output
        """
        destination = self._extract_destination(message)

        if not destination:
            yield ("token", "I'd be happy to help plan your trip! Could you tell me where you'd like to go?")
            return

        # Check if we have enough details to plan
        if not self._has_travel_details(message, history):
            # Emit questions for interactive intake
            yield ("token", f"Great choice! **{destination.title()}** is an amazing destination. Let me gather a few details to create the perfect plan for you.\n\n")
            yield ("questions", {"questions": TRAVEL_QUESTIONS})
            return

        # We have details - run the crew
        yield ("status", "researching destinations")

        output_queue: Queue = Queue()
        agent_names = ["Research", "Itinerary", "Budget"]
        headers = [
            "## Destination Highlights",
            "## Sample Itinerary",
            "## Budget Estimate",
        ]
        current_agent_idx = 0

        # Build context from message and recent history
        context = message
        for msg in history[-2:]:
            if msg.get("role") == "user":
                context += "\n" + msg.get("content", "")

        def run_crew():
            try:
                crew = self._create_crew(destination, context, output_queue)
                crew.kickoff()
            except Exception as e:
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
                        chunk = data[i:i + chunk_size]
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
