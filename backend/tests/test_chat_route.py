import json

import pytest
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessageChunk

from app.main import app
from app.routes import chat as chat_module


class _FakeGraph:
    """Stands in for the compiled LangGraph. Only the model/graph boundary is
    faked here - everything downstream (SSE framing, disclaimer, session id
    handling) is the real route code."""

    async def astream(self, input, config, stream_mode):  # noqa: ARG002
        yield AIMessageChunk(content="Try "), {"langgraph_node": "agent"}
        yield AIMessageChunk(content="tacos."), {"langgraph_node": "agent"}
        # A chunk from the tools node carries no user-facing text and must be
        # filtered out, not streamed to the client.
        yield AIMessageChunk(content="ignored"), {"langgraph_node": "tools"}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(chat_module, "GRAPH", _FakeGraph())
    return TestClient(app)


def _parse_sse(body: str) -> list[dict]:
    events = []
    for block in body.strip().split("\n\n"):
        for line in block.splitlines():
            if line.startswith("data:"):
                events.append(json.loads(line[len("data:") :].strip()))
    return events


def test_chat_streams_model_tokens_then_disclaimer_then_done(client):
    response = client.post("/api/chat", json={"message": "what should I cook tonight?"})
    assert response.status_code == 200

    events = _parse_sse(response.text)
    token_events = [e for e in events if e["type"] == "token"]

    # Model tokens arrive in order, and only from the agent node.
    assert [e["text"] for e in token_events[:2]] == ["Try ", "tacos."]
    # The allergen disclaimer is appended after the model's own output, always.
    assert "food-safety" in token_events[-1]["text"]

    done_events = [e for e in events if e["type"] == "done"]
    assert len(done_events) == 1
    assert done_events[0]["session_id"]  # a session id was generated


def test_chat_echoes_back_provided_session_id(client):
    response = client.post(
        "/api/chat", json={"message": "hi", "session_id": "existing-session-abc"}
    )

    done_event = next(e for e in _parse_sse(response.text) if e["type"] == "done")
    assert done_event["session_id"] == "existing-session-abc"


def test_health_endpoint_does_not_touch_the_graph():
    # Deliberately uses the real app/GRAPH - health should never depend on
    # the LLM or tools being reachable.
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
