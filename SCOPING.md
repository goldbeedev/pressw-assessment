- **Scope committed:** what you're actually building, as a tight list
tech:

Python backend 
React Frontend - vite, radix ui, typescript
Langchain - llm calls
docker
external tool - websearch travily (free api key, better quality)
Sonnet 5 model, balance between cost and quality

product:

answer short cooking questions
something about cooking utensils and tools, but its ambiguous with no real concrete asks - come up with general solution - real user interviews have mentioned they all have different things, needs to accomodate this.
suggest recipes - use ingredients the user has
opinionated "friendly" response (needs to feel like a relationship not a tool)
one person says under 2 seconds response, other says quality outweighs timing
memory - dont recommend shellfish if they said they were allergic to it last week
health stuff. People on keto, people managing diabetes, vegetarians, people with real allergies. Our product needs to handle that space well
people want to save recipes list
build out some kind of doc that the bot always pulls from for must haves like not mentioning health related guidelines/suggestions?

- **Scope cut:** what you heard but decided not to do, with reasoning
- possibly not do voice here, for a POC that is a whole new can of worms.
- grocery list, its related but almost a new app itself
- not parsing family cookbooks - low signal, one off user mention and adds complexity.
- not persisting memory past current session window - over fears of the allergy/health legal factors, but context remains within that chat session.
- true per-query cost routing (cheap model for simple asks, smarter model for hard ones) - priya's literal ask. building a query-complexity classifier to route between models is a real v2 lift. instead: set a single global effort="medium" on sonnet 5 (default is "high", which was quietly spending real output tokens on adaptive thinking even for something like "substitute for buttermilk"). that's a real, measured cost cut on every request, just not the per-query granularity priya described. didn't drop to effort="low" - that risks under-thinking harder requests and would undercut the quality-over-speed call already made above.

- **Contradictions resolved:** where stakeholders disagreed, and how you decided
timing (2 seconds vs quality and possibly slower than 2 seconds - model choice? cost of that model?) quality over speed - you need to sell them on the v1 before optimizing for performance, poor quality cant out value slightly slower response time. also CEO > PM decisions, also PM are not always technical.
no keto, dietary etc - I agree with diane we should not become a medical advice platform but acknowledge the users general concern
dont store health related info
memory architecture - marcus wants cross-session memory (the shellfish-next-week example), but that's exactly the health-adjacent data diane says not to persist in v1. resolved by keeping memory session-only: LangGraph's in-memory checkpointer remembers earlier turns within one conversation, nothing persists across sessions or restarts. no database for v1 - and not postgres either, since the one thing worth persisting long-term (allergies) is the one thing counsel told us to hold off on. if v2 needs durable memory for non-health preferences (favorite cuisine, saved recipes), that's a small postgres table keyed by user id, not embeddings.

- **Clarifying questions:** what you'd want answered before a production build
chefs toolkit questions
target market/audience (for design clarifications and other built in features)
how the app will be monetized
scale - how many users **could** realistically hit this at once?
v2 thoughts - could change the direction of some v1 prod things

- **Assumptions made:** what you decided without asking
no voice
understand the users utensils over a pre-set deterministic group.
session memory
needs guard rails against safe to eat, and health queries.
streaming token chat response.

- **Risks accepted:** what could bite later and why you're accepting it
no voice
sonnet 5 could add up but is the right balance between cost and quality
saved recipes (save_recipe/list_saved_recipes) are one shared in-process list with no per-session or per-user key at all - unlike conversation memory, which is correctly scoped by session id. two people saving recipes at the same time would see each other's list. acceptable for a single-reviewer demo, not for anyone else touching it.
the legal guardrails (no medical/dietary advice, no food-safety judgment calls) are enforced entirely by the system prompt, no classifier or code-level check behind them - only the allergen disclaimer is code-appended. diane called these non-negotiable; a determined user could plausibly talk the model past a prompt-only guardrail.
no auth or rate limiting on the api - directly relevant given priya's per-query cost concern. CORS restricts which browser origins can call it, but that's not a security boundary; a direct curl bypasses it entirely.