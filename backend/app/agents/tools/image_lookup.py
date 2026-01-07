"""Wikipedia Commons image lookup tool for CrewAI agents."""

import logging

import requests
from crewai.tools import tool

logger = logging.getLogger(__name__)

# User-Agent required by Wikipedia API
# See: https://meta.wikimedia.org/wiki/User-Agent_policy
HEADERS = {
    "User-Agent": "RichChatDemo/1.0 (travel planning app; contact@example.com)"
}


@tool
def lookup_wikipedia_image(landmark_name: str, location: str = "") -> str:
    """
    Find a Wikipedia Commons image URL for a landmark or attraction.

    Use this tool to find real, working image URLs for travel destinations
    and attractions. The returned URLs can be displayed directly in the UI.

    Args:
        landmark_name: Name of the landmark (e.g., "Eiffel Tower", "Machu Picchu")
        location: Optional location for disambiguation (e.g., "Paris", "Peru")

    Returns:
        A Wikipedia Commons image URL if found, or a fallback message.
    """
    try:
        # Combine landmark and location for better search
        search_term = f"{landmark_name} {location}".strip()

        # Step 1: Search Wikipedia for the article
        search_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": search_term,
                "format": "json",
                "srlimit": 1,
            },
            headers=HEADERS,
            timeout=10,
        )

        if search_resp.status_code != 200:
            return f"No image found for {landmark_name}."

        search_data = search_resp.json()
        search_results = search_data.get("query", {}).get("search", [])

        if not search_results:
            return f"No image found for {landmark_name}."

        page_title = search_results[0]["title"]

        # Step 2: Get the page's main image
        img_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "titles": page_title,
                "prop": "pageimages",
                "format": "json",
                "pithumbsize": 800,  # Request 800px thumbnail
            },
            headers=HEADERS,
            timeout=10,
        )

        if img_resp.status_code != 200:
            return f"No image found for {landmark_name}."

        img_data = img_resp.json()
        pages = img_data.get("query", {}).get("pages", {})

        for page_info in pages.values():
            if "thumbnail" in page_info:
                image_url = page_info["thumbnail"]["source"]
                return f"Image URL for {landmark_name}: {image_url}"

        return f"No image found for {landmark_name}."

    except requests.Timeout:
        logger.warning(f"Image lookup timeout for {landmark_name}")
        return f"No image found for {landmark_name}."
    except Exception as e:
        logger.warning(f"Image lookup error for {landmark_name}: {e}")
        return f"No image found for {landmark_name}."
