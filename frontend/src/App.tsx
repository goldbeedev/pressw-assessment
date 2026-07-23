import { useState } from "react";
import styled from "styled-components";
import { GlobalStyle, theme } from "./GlobalStyle";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import { SessionFooter } from "./components/SessionFooter";
import { SuggestionChips } from "./components/SuggestionChips";
import { streamMessage } from "./api";
import type { ChatMessage } from "./types";

const SESSION_STORAGE_KEY = "pantrypal_session_id";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 42rem;
  margin: 0 auto;
  background: ${theme.panel};
  border-left: 1px solid ${theme.border};
  border-right: 1px solid ${theme.border};
`;

const Header = styled.header`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${theme.border};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.15rem;
`;

const Subtitle = styled.p`
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: ${theme.textMuted};
`;

const ErrorBanner = styled.div`
  margin: 0 1.25rem;
  padding: 0.5rem 0.8rem;
  border-radius: 0.5rem;
  background: #fde8e2;
  color: #8a2a10;
  font-size: 0.85rem;
`;

function newId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newId(),
      role: "assistant",
      content:
        "Hey, I'm PantryPal. Tell me what's in your kitchen or what you're in the mood for, and I'll figure out what you should cook.",
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_STORAGE_KEY),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  function appendToMessage(id: string, text: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)),
    );
  }

  async function handleSend(text: string) {
    setError(null);
    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setIsLoading(true);

    try {
      await streamMessage(text, sessionId, (event) => {
        if (event.type === "token" && event.text) {
          appendToMessage(assistantId, event.text);
        } else if (event.type === "done" && event.session_id) {
          setSessionId(event.session_id);
          sessionStorage.setItem(SESSION_STORAGE_KEY, event.session_id);
        } else if (event.type === "error" && event.message) {
          setError(event.message);
        }
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong talking to PantryPal.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <GlobalStyle />
      <Shell>
        <Header>
          <Title>PantryPal</Title>
          <Subtitle>Your AI cooking assistant</Subtitle>
        </Header>
        <ChatWindow messages={messages} isLoading={isLoading} />
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {messages.length === 1 && (
          <SuggestionChips onPick={(text) => setInputValue(text)} />
        )}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isLoading}
        />
        <SessionFooter sessionId={sessionId} />
      </Shell>
    </>
  );
}
