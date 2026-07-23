import pytest
from pydantic import ValidationError

from app.schemas import ChatRequest


def test_chat_request_rejects_empty_message():
    with pytest.raises(ValidationError):
        ChatRequest(message="")


def test_chat_request_rejects_oversized_message():
    with pytest.raises(ValidationError):
        ChatRequest(message="a" * 4001)


def test_chat_request_session_id_defaults_to_none():
    request = ChatRequest(message="what can I make with eggs and rice?")
    assert request.session_id is None
