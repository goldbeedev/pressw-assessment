import styled from "styled-components";
import { theme } from "../GlobalStyle";

const SUGGESTIONS = [
  "What can I make with eggs and rice?",
  "Dinner for four, something fast",
  "What's a good wine pairing for a pasta night?",
];

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1.25rem 0.85rem;
`;

const Chip = styled.button`
  border: 1px solid ${theme.border};
  background: ${theme.accentSoft};
  color: ${theme.text};
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`;

// Pre-fills the input rather than auto-sending - a click shouldn't itself
// trigger an API call the user didn't explicitly ask for.
export function SuggestionChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <Wrap>
      {SUGGESTIONS.map((suggestion) => (
        <Chip key={suggestion} type="button" onClick={() => onPick(suggestion)}>
          {suggestion}
        </Chip>
      ))}
    </Wrap>
  );
}
