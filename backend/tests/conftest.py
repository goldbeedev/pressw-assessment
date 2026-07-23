import os

# Set before any `app.*` module is imported (Settings() runs at import time in
# app/config.py) so tests never depend on real credentials or a local .env.
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")
os.environ.setdefault("TAVILY_API_KEY", "test-tavily-key")
