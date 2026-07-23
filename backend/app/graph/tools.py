from langchain_core.tools import tool
from langchain_tavily import TavilySearch

# Reads TAVILY_API_KEY from the environment automatically.
web_search = TavilySearch(
    max_results=3,
    name="web_search",
    description=(
        "Search the web for current or specific food-related information - "
        "a restaurant, a product, a very current technique or trend. Not for "
        "basic cooking knowledge you already know."
    ),
)

# In-memory only, deliberately: no persistence across restarts, no per-user
# isolation. This is a stub for the "save a recipe I liked" feature the CX
# lead flagged as coming up in nearly every user interview - a real build
# needs this keyed by an authenticated user, in a real store. See
# SCOPING.md / TRADEOFFS.md for why that's out of scope for v1.
_saved_recipes: list[dict[str, str]] = []


@tool
def save_recipe(title: str, recipe_text: str) -> str:
    """Save a recipe the user wants to keep for later.

    Call this when the user asks you to save, bookmark, or remember a recipe.

    Args:
        title: A short, human-readable title for the recipe.
        recipe_text: The recipe itself (ingredients + steps) as plain text.
    """
    _saved_recipes.append({"title": title, "recipe_text": recipe_text})
    return f"Saved '{title}' to your recipe list."


@tool
def list_saved_recipes() -> str:
    """List the titles of recipes the user has previously saved this session."""
    if not _saved_recipes:
        return "No recipes saved yet."
    titles = "\n".join(f"- {r['title']}" for r in _saved_recipes)
    return f"Saved recipes:\n{titles}"


TOOLS = [web_search, save_recipe, list_saved_recipes]
