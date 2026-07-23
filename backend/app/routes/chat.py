import json
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessageChunk, HumanMessage

from app.graph.graph import GRAPH
from app.schemas import ChatRequest

router = APIRouter()

ALLERGEN_DISCLAIMER = (
    "\n\n---\n"
    "PantryPal is an AI assistant, not a food-safety or medical authority. "
    "Always check ingredient labels and use your own judgment about what's "
    "safe for your allergies, intolerances, and dietary needs before eating."
)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _stream_agent_text(message: str, session_id: str) -> AsyncIterator[str]:
    """Yield only the assistant's visible text, token by token, skipping
    tool-call content blocks that have no text to show the user."""
    config = {"configurable": {"thread_id": session_id}}
    async for token, metadata in GRAPH.astream(
        {"messages": [HumanMessage(content=message)]},
        config=config,
        stream_mode="messages",
    ):
        if metadata.get("langgraph_node") != "agent" or not isinstance(token, AIMessageChunk):
            continue

        content = token.content
        if isinstance(content, str):
            if content:
                yield content
        elif isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    text = block.get("text", "")
                    if text:
                        yield text


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    session_id = req.session_id or str(uuid.uuid4())

    async def event_stream() -> AsyncIterator[str]:
        try:
            async for chunk in _stream_agent_text(req.message, session_id):
                yield _sse({"type": "token", "text": chunk})
            yield _sse({"type": "token", "text": ALLERGEN_DISCLAIMER})
            yield _sse({"type": "done", "session_id": session_id})
        except Exception as exc:  # noqa: BLE001 - surface any failure to the client
            yield _sse({"type": "error", "message": f"PantryPal is temporarily unavailable: {exc}"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
