"""
Travel planning agent using CrewAI multi-agent system.
"""

import asyncio
from collections.abc import AsyncIterator

from crewai import Agent, Task, Crew, Process, LLM

from app.core.config import settings

from .base import BaseAgent


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
        )

    def _create_crew(self, destination: str) -> Crew:
        """Create the travel planning crew with specialized agents."""
        llm = self._create_llm()

        # Research Agent - Gathers destination info, attractions, weather
        researcher = Agent(
            role="Travel Researcher",
            goal=f"Research comprehensive travel information about {destination}",
            backstory="""You are an experienced travel researcher who excels at
            finding detailed information about destinations, including popular
            attractions, local customs, weather patterns, best times to visit,
            and hidden gems that tourists often miss.""",
            llm=llm,
            verbose=False,
        )

        # Itinerary Planner - Creates day-by-day schedules
        planner = Agent(
            role="Itinerary Planner",
            goal=f"Create a detailed day-by-day travel itinerary for {destination}",
            backstory="""You are a meticulous travel planner who creates
            well-organized itineraries. You consider travel times between
            locations, opening hours, and optimal scheduling to maximize
            the travel experience while avoiding exhaustion.""",
            llm=llm,
            verbose=False,
        )

        # Budget Analyst - Estimates costs
        budget_analyst = Agent(
            role="Travel Budget Analyst",
            goal=f"Estimate travel costs and budget for visiting {destination}",
            backstory="""You are a travel budget expert who provides accurate
            cost estimates for trips. You consider flights, accommodation,
            food, activities, transportation, and miscellaneous expenses
            while offering money-saving tips.""",
            llm=llm,
            verbose=False,
        )

        # Logistics Coordinator - Handles transportation and accommodation
        logistics = Agent(
            role="Logistics Coordinator",
            goal=f"Plan transportation and accommodation for {destination}",
            backstory="""You are a logistics expert who specializes in travel
            arrangements. You recommend the best transportation options,
            suitable accommodation based on preferences and budget, and
            provide practical tips for getting around.""",
            llm=llm,
            verbose=False,
        )

        # Define tasks for each agent
        research_task = Task(
            description=f"""Research the destination: {destination}

            Provide information about:
            - Top attractions and must-see places
            - Local culture and customs
            - Best time to visit and weather considerations
            - Safety tips and travel advisories
            - Local cuisine and dining recommendations""",
            expected_output="A comprehensive destination research report",
            agent=researcher,
        )

        itinerary_task = Task(
            description=f"""Create a travel itinerary for {destination}

            Based on the research, create a day-by-day itinerary that includes:
            - Morning, afternoon, and evening activities
            - Recommended duration at each location
            - Tips for each activity
            - Alternative options for different interests""",
            expected_output="A detailed day-by-day travel itinerary",
            agent=planner,
            context=[research_task],
        )

        budget_task = Task(
            description=f"""Estimate travel budget for {destination}

            Provide cost estimates for:
            - Flights (range based on origin)
            - Accommodation (budget, mid-range, luxury options)
            - Daily food and dining
            - Activities and entrance fees
            - Local transportation
            - Total estimated budget with money-saving tips""",
            expected_output="A detailed travel budget breakdown",
            agent=budget_analyst,
            context=[research_task, itinerary_task],
        )

        logistics_task = Task(
            description=f"""Plan logistics for {destination}

            Provide recommendations for:
            - Best transportation options to reach the destination
            - Getting around locally (public transport, rentals, etc.)
            - Accommodation recommendations by area
            - Practical tips (visa, currency, connectivity)
            - Packing suggestions""",
            expected_output="A comprehensive logistics and accommodation guide",
            agent=logistics,
            context=[research_task, itinerary_task, budget_task],
        )

        # Create the crew with sequential execution
        crew = Crew(
            agents=[researcher, planner, budget_analyst, logistics],
            tasks=[research_task, itinerary_task, budget_task, logistics_task],
            process=Process.sequential,
            verbose=False,
        )

        return crew

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncIterator[tuple[str, str | list[dict]]]:
        """
        Execute travel planning crew and stream results.

        Yields tuples of (event_type, content):
        - ("status", "researching destinations") - Research Agent working
        - ("status", "planning itinerary") - Itinerary Agent working
        - ("status", "calculating budget") - Budget Agent working
        - ("status", "finding logistics") - Logistics Agent working
        - ("token", "text") - Response text token
        - ("error", "message") - Error occurred
        """
        # Extract destination from the message
        destination = message.strip()
        if not destination:
            yield ("error", "Please specify a destination for travel planning.")
            return

        try:
            # Emit status updates for each phase
            yield ("status", "researching destinations")

            # Create and run the crew
            crew = self._create_crew(destination)

            # Run crew in a thread to avoid blocking
            def run_crew():
                return crew.kickoff()

            # Execute the crew
            yield ("status", "planning itinerary")

            result = await asyncio.to_thread(run_crew)

            yield ("status", "calculating budget")
            await asyncio.sleep(0.1)  # Brief pause for UI feedback

            yield ("status", "finding logistics")
            await asyncio.sleep(0.1)  # Brief pause for UI feedback

            # Stream the final result
            output = str(result)

            # Stream the output in chunks for better UX
            chunk_size = 50
            for i in range(0, len(output), chunk_size):
                chunk = output[i:i + chunk_size]
                yield ("token", chunk)
                await asyncio.sleep(0.01)  # Small delay for streaming effect

        except Exception as e:
            yield ("error", f"Travel planning failed: {str(e)}")
