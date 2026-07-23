import { useEffect, useRef } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import styled from "styled-components";
import { theme } from "../GlobalStyle";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "../types";

const Viewport = styled(ScrollArea.Viewport)`
  width: 100%;
  height: 100%;
`;

const Scrollbar = styled(ScrollArea.Scrollbar)`
  display: flex;
  width: 6px;
  background: transparent;
  padding: 2px;

  &[data-orientation="vertical"] {
    width: 8px;
  }
`;

const Thumb = styled(ScrollArea.Thumb)`
  flex: 1;
  background: ${theme.border};
  border-radius: 999px;
`;

const Padding = styled.div`
  padding: 1rem 1.25rem;
`;

const TypingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: ${theme.textMuted};
  font-size: 0.85rem;
  padding: 0 1.25rem 0.5rem 3rem;
`;

export function ChatWindow({
  messages,
  isLoading,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  // The pending assistant bubble is added empty and filled token by token, so
  // only show the "thinking" indicator before the first token has arrived.
  const showTypingIndicator =
    isLoading && (!lastMessage || lastMessage.content.length === 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <ScrollArea.Root style={{ flex: 1, overflow: "hidden" }}>
      <Viewport>
        <Padding>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </Padding>
      </Viewport>
      {showTypingIndicator && <TypingRow>PantryPal is thinking&hellip;</TypingRow>}
      <Scrollbar orientation="vertical">
        <Thumb />
      </Scrollbar>
    </ScrollArea.Root>
  );
}
