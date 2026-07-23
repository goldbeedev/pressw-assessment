## What we built vs. what we scoped

Built everything in SCOPING.md's "Scope committed" list: FastAPI + LangGraph
backend with a single LLM-driven agent node (model decides per-turn whether
to answer directly or call a tool - no hardcoded sequence), Tavily web
search as the external tool, all model calls routed through
`langchain-anthropic`, a React/Vite/Radix/styled-components chat frontend
with token-by-token streaming, and a Docker setup for both services.

Cut from the original brief, deliberately, with reasoning in SCOPING.md:
voice, grocery list export, family-cookbook parsing, cross-session/durable
memory, and true per-query cost routing (we did a coarser global effort
tier instead - see below).

## Specific trade-offs

- **Session-only memory, no database.** Marcus wants cross-session memory
  (the shellfish example); Diane's counsel is clear that health-adjacent
  data shouldn't persist in v1. We resolved this in favor of legal:
  LangGraph's in-memory checkpointer remembers a conversation within one
  session, nothing survives a restart or a new session.
- **`effort="medium"` instead of real cost routing.** Priya asked for
  cheap-model-for-simple-queries, smart-model-for-hard-queries. Building an
  actual complexity classifier was out of scope for the time box. Instead we
  set a single global effort tier on Sonnet 5 (default is "high", which was
  quietly spending real output tokens on adaptive thinking even for
  something like "substitute for buttermilk"). Real cost cut, just not the
  per-query granularity Priya described. Didn't go to `effort="low"` -
  that risks under-thinking harder requests and would undercut the
  quality-over-speed call we made resolving the other timing contradiction.
- **Legal guardrails are prompt-enforced, not code-enforced.** No medical
  advice, no food-safety judgment calls, and "stay in the cooking lane" are
  all instructions in `backend/app/graph/prompts.py`. Only the allergen
  disclaimer is deterministically appended in code
  (`backend/app/routes/chat.py`) - it applies to every response regardless
  of what the model does, by design, since Diane's email says it applies
  "whether or not the user mentioned allergies." The other guardrails rely
  on the model following instructions. See "Known issues" below.
- **`save_recipe`/`list_saved_recipes` are a single unkeyed in-memory list.**
  No per-session or per-user isolation, no persistence across restarts.
  Fine for one person testing; two people saving recipes at the same time
  would see each other's list. This is the CX-flagged "favorites" feature
  from the brief, stubbed deliberately shallow given the time box.
- **No auth or rate limiting on the API.** Directly relevant to Priya's
  per-query cost concern - right now anyone who can reach the endpoint can
  run up Anthropic/Tavily spend with no cap. CORS restricts browser origins
  but isn't a security boundary; a direct `curl` bypasses it.

## What we'd do next with more time

- Fix the two items above that are really the same shape of gap: give
  saved recipes and any future durable preference data a proper per-user
  key. If it needs to survive a restart, that's a small Postgres table
  keyed by user id - not embeddings, not health data (per Diane).
- Build the query-complexity signal Priya actually asked for (cheap
  effort/model for "how do I know when chicken is done," escalate for
  multi-constraint asks) instead of the blanket `effort="medium"` tier.
- Move the legal guardrails from prompt-only to defense-in-depth: a cheap
  keyword/classifier check on the model's response before it streams to
  the user, so a jailbroken response gets caught even if the prompt
  instruction fails. Diane called these non-negotiable; prompt-following
  alone isn't the bar that language sets.
- A "save this recipe" button under each response + a downloadable PDF of
  saved recipes was raised as a feature idea and scoped but not built: it
  needs a real endpoint (not a tool call, since it's a deterministic UI
  action) fixing the per-session-key gap above, a PDF-generation
  dependency, and - the actual hard part - deciding what "the recipe" means
  when one response offers several options with commentary mixed in.
  Cheap version (save the raw message text) ships an ambiguous result;
  correct version needs another model call to extract a clean recipe.
- Basic auth + per-session rate limiting, sized to Priya's cost concern.
- Automated tests that exercise a real (not mocked) model call in CI on a
  schedule, distinct from the mocked-boundary unit tests we shipped - to
  catch behavior drift (tone, guardrail adherence, tool-choice patterns)
  that unit tests checking route plumbing can't see.

## Known issues / unhandled cases

- `save_recipe`'s `recipe_text` is written by the model from its own
  memory of the conversation, not copied verbatim - never verified it
  reliably reproduces the exact recipe it gave a few turns earlier.
- Errors in the chat route stream `str(exc)` verbatim to the client
  (`backend/app/routes/chat.py`) - fine for our own debugging, but it's an
  info-disclosure smell and a bad user-facing message if a real user ever
  sees a raw exception.
- Found and fixed one real bug during the build worth calling out as a
  pattern to watch for in this stack: the agent node originally called
  `.invoke()` without forwarding LangGraph's run `config`, which silently
  disabled token streaming with no error - it just fell back to one lumped
  response. Same shape of risk exists anywhere else a required plumbing
  argument gets dropped in this framework: it fails quiet, not loud.
- Similarly: `TavilySearch`/`ChatAnthropic` read API keys straight from
  `os.environ`, not from our own `Settings` object's `.env` parsing - if
  nothing loads `.env` into the actual process environment first (we do
  this explicitly now in `app/config.py` via `load_dotenv()`), the app
  crashes on import with a confusing pydantic validation error, not an
  obvious "check your .env" message.
- No UI feedback if a specific tool call fails mid-turn (e.g. Tavily rate
  limit) - the model gets the error as a tool result and may recover
  gracefully in its next message, but there's no distinct signal to the
  user that a tool failed versus the model just choosing not to search.
- Not tested against deliberately adversarial input (prompt injection
  attempts against the "stay in the cooking lane" or legal guardrails,
  extremely long conversation histories, non-English input). The brief
  says to expect exactly this kind of testing - flagging it here rather
  than claiming coverage we don't have.
