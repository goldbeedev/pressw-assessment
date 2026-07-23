import type { FormEvent } from "react";
import styled from "styled-components";
import { theme } from "../GlobalStyle";

const Form = styled.form`
  display: flex;
  gap: 0.6rem;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid ${theme.border};
  background: ${theme.panel};
`;

const Input = styled.input`
  flex: 1;
  border: 1px solid ${theme.border};
  border-radius: 999px;
  padding: 0.65rem 1.1rem;
  font-size: 0.95rem;
  outline: none;
  background: ${theme.bg};

  &:focus {
    border-color: ${theme.accent};
  }
`;

const SendButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.3rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${theme.userBubbleText};
  background: ${theme.accent};
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    onChange("");
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What do you feel like cooking?"
        disabled={disabled}
      />
      <SendButton type="submit" disabled={disabled || !value.trim()}>
        Send
      </SendButton>
    </Form>
  );
}
