from pydantic_settings import BaseSettings, SettingsConfigDict


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
