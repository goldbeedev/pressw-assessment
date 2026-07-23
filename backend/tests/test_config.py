import pytest
from pydantic import ValidationError

from app.config import Settings


def test_settings_requires_anthropic_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("TAVILY_API_KEY", "x")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_requires_tavily_api_key(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_allowed_origins_list_splits_and_trims(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setenv("TAVILY_API_KEY", "x")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://a.com, http://b.com ,, ")

    settings = Settings(_env_file=None)

    assert settings.allowed_origins_list == ["http://a.com", "http://b.com"]
