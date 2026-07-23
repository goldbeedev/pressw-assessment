import * as Avatar from "@radix-ui/react-avatar";
import styled from "styled-components";
import { theme } from "../GlobalStyle";
import type { ChatMessage } from "../types";

const Row = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.$isUser ? "row-reverse" : "row")};
  align-items: flex-start;
  gap: 0.6rem;
  margin: 0.9rem 0;
`;

const StyledAvatar = styled(Avatar.Root)<{ $isUser: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${theme.userBubbleText};
  background: ${(p) => (p.$isUser ? theme.textMuted : theme.accent)};
`;

const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: min(32rem, 80%);
  padding: 0.65rem 0.95rem;
  border-radius: 1rem;
  line-height: 1.45;
  font-size: 0.95rem;
  white-space: pre-wrap;
  border: 1px solid ${theme.border};
  background: ${(p) => (p.$isUser ? theme.userBubble : theme.assistantBubble)};
  color: ${(p) => (p.$isUser ? theme.userBubbleText : theme.text)};
  border-bottom-right-radius: ${(p) => (p.$isUser ? "0.25rem" : "1rem")};
  border-bottom-left-radius: ${(p) => (p.$isUser ? "1rem" : "0.25rem")};
`;

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <Row $isUser={isUser}>
      <StyledAvatar $isUser={isUser}>
        <Avatar.Fallback>{isUser ? "You" : "PP"}</Avatar.Fallback>
      </StyledAvatar>
      <Bubble $isUser={isUser}>{message.content}</Bubble>
    </Row>
  );
}
