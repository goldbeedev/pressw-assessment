from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: str | None = Field(
        default=None,
        description="Opaque conversation id. Omit on the first message; the response "
        "stream's 'done' event echoes back the id to send on every subsequent message "
        "in the same conversation.",
    )
