# PantryPal

An AI cooking assistant: a chat UI backed by a FastAPI + LangGraph agent that
decides on its own when to search the web or save/list recipes.

The original take-home instructions are preserved in [`ASSESSMENT.md`](./ASSESSMENT.md).
Scoping decisions and reasoning live in [`SCOPING.md`](./SCOPING.md); trade-offs
made under time pressure are in `TRADEOFFS.md` (todo).

## Architecture

```
frontend (React + Vite + TS, Radix UI + styled-components)
   |  POST /api/chat  (SSE token stream)
   v
backend (FastAPI)
   |
   v
LangGraph agent  <-- LangChain ChatAnthropic (claude-sonnet-5)
   |         \
   v          v
tavily web_search   save_recipe / list_saved_recipes (in-memory stub)
```

- **LLM-driven tool use:** the graph has exactly one decision point (the
  `agent` node). On every turn the model itself decides whether to answer
  directly or call `web_search`, `save_recipe`, or `list_saved_recipes` -
  there's no hardcoded sequence. See `backend/app/graph/graph.py`.
- **All model calls go through LangChain** (`ChatAnthropic` from
  `langchain-anthropic`) - nothing imports the `anthropic` SDK directly.
- **Memory is session-scoped only**, via LangGraph's in-memory checkpointer
  (`MemorySaver`), keyed by a session id the frontend generates and echoes
  back. Nothing persists across a server restart or a new session - see
  `SCOPING.md` for why (short version: the one thing worth remembering
  long-term, allergies, is the one thing legal told us not to store yet).
- **Legal guardrails** (no medical/dietary advice, no food-safety judgment
  calls, allergen disclaimer on every response) live in
  `backend/app/graph/prompts.py`, split out from the personality/product
  prompt so they can be reviewed or edited independently.

## Setup

### Option A: Docker (recommended)

From project root:

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY and TAVILY_API_KEY in .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (docs at `/docs`)

### Option B: run locally

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY and TAVILY_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:8000, only edit if needed
npm run dev
```

## Tests

Narrow coverage of the highest-value backend behavior: config fail-fast,
request validation, the `save_recipe`/`list_saved_recipes` tools, and the
chat route's SSE framing/disclaimer/session-id handling (with only the
LangGraph/model boundary mocked - the route logic itself runs for real).

```bash
cd backend
pip install -r requirements-dev.txt
pytest -v
```

## Getting API keys

- **Anthropic:** https://console.anthropic.com/ (used for `ANTHROPIC_API_KEY`)
- **Tavily** (web search tool, free tier): https://tavily.com/ (used for `TAVILY_API_KEY`)

## Example request

The chat endpoint streams Server-Sent Events (`token` chunks, then a `done`
event carrying the `session_id` to reuse on the next message):

```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have chicken thighs, rice, and a lime. What should I make?"}'
```

Send a follow-up in the same conversation by passing back the `session_id`
from the `done` event:

```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "actually I don'\''t have a stovetop, just a microwave", "session_id": "<id from previous response>"}'
```

Health check:

```bash
curl http://localhost:8000/api/health
```

## Known limitations

See `TRADEOFFS.md` for the full list. The short version: memory and saved
recipes are in-process only (lost on restart, no per-user isolation) - both
are documented, deliberate scope cuts for a 3-hour build, not bugs.
