from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.config import settings
from app.graph.prompts import SYSTEM_PROMPT
from app.graph.tools import TOOLS

_model = ChatAnthropic(
    model_name=settings.anthropic_model,
    max_tokens=1024,
    # No temperature/top_p/top_k: Sonnet 5 400s on a non-default value, and
    # the default (omitted) is fine for this use case.
    timeout=None,
    stop=None,
    # Sonnet 5 defaults to "high" effort (adaptive thinking) if unset, which
    # spends real output tokens on thinking even for simple lookups like
    # "what can I make with eggs and bread." "medium" is a real cost cut on
    # every request - directly relevant to Priya's per-query cost concern -
    # without dropping to "low", which risks under-thinking harder requests
    # and would cut against the quality-over-speed call already made (see
    # SCOPING.md "Contradictions resolved"). This is a global tier, not the
    # true per-query cost routing Priya asked for - see SCOPING.md "Scope
    # cut" for why that's out of scope here.
    effort="medium",
)
_model_with_tools = _model.bind_tools(TOOLS)


def _agent_node(state: MessagesState, config: RunnableConfig) -> dict:
    """The only node that talks to the LLM. It decides on its own, per turn,
    whether to answer directly or call a tool - there is no hardcoded
    sequence of tool calls anywhere in this graph.

    `config` must be forwarded to `.invoke()` - it carries the callback
    manager LangGraph uses to detect that token-by-token streaming was
    requested (`stream_mode="messages"`). Drop it and this call silently
    falls back to one non-streamed response instead of raising anything,
    which is exactly what happened here before this fix.
    """
    messages = [SystemMessage(content=SYSTEM_PROMPT), *state["messages"]]
    response = _model_with_tools.invoke(messages, config)
    return {"messages": [response]}


def build_graph() -> CompiledStateGraph:
    graph = StateGraph(MessagesState)
    graph.add_node("agent", _agent_node)
    graph.add_node("tools", ToolNode(TOOLS))

    graph.set_entry_point("agent")
    # tools_condition inspects the last message: routes to "tools" if the
    # model asked for one, otherwise ends the turn. The model - not this code
    # - decides which branch gets taken on every single turn.
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")

    # MemorySaver = session-scoped, in-process conversation memory only. See
    # SCOPING.md "Contradictions resolved" for why this doesn't persist to a
    # database.
    return graph.compile(checkpointer=MemorySaver())


GRAPH = build_graph()
