from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# pydantic-settings parses `.env` into the Settings object below, but it does
# NOT copy those values into os.environ. TavilySearch and ChatAnthropic read
# TAVILY_API_KEY / ANTHROPIC_API_KEY straight from os.environ, independently
# of this file - without this, running locally (no Docker, no shell that's
# sourced the .env) crashes on import with "Did not find tavily_api_key".
# No-ops if there's no .env file to find (e.g. in Docker, where the real
# process env is already set via docker-compose).
load_dotenv()


class Settings(BaseSettings):
    """Runtime configuration, read from process env vars (or a local .env file).

    ANTHROPIC_API_KEY and TAVILY_API_KEY are also read directly by the
    LangChain integrations that need them (ChatAnthropic, TavilySearch) — they
    are duplicated here only so the app fails fast with a clear error at
    startup if they're missing, instead of a confusing error mid-request.
    """

    anthropic_api_key: str
    anthropic_model: str = "claude-sonnet-5"
    tavily_api_key: str
    allowed_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
