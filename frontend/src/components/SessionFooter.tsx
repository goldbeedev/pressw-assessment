import { useState } from "react";
import styled from "styled-components";
import { theme } from "../GlobalStyle";

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.4rem 1.25rem;
  font-size: 0.75rem;
  color: ${theme.textMuted};
  border-top: 1px solid ${theme.border};
  background: ${theme.bg};
`;

const CopyButton = styled.button`
  border: none;
  background: none;
  color: ${theme.accent};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

// Purely for support/debugging - lets a user hand you an id that correlates
// to backend logs if something goes wrong. Not a "resume this conversation
// later" feature: memory is deliberately session-only and in-process (see
// SCOPING.md), so this id is only good for as long as the server stays up.
export function SessionFooter({ sessionId }: { sessionId: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!sessionId) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context) - the id
      // is still visible on screen to select manually, so just no-op.
    }
  }

  return (
    <Bar>
      <span>Conversation ID: {sessionId.slice(0, 8)}&hellip;</span>
      <CopyButton type="button" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy full ID"}
      </CopyButton>
    </Bar>
  );
}
