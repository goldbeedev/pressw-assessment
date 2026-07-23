import { createGlobalStyle } from "styled-components";

export const theme = {
  bg: "#faf6f0",
  panel: "#ffffff",
  border: "#e8e0d4",
  text: "#2b2420",
  textMuted: "#8a7f70",
  accent: "#c1552c",
  accentSoft: "#f3e3d6",
  userBubble: "#2b2420",
  userBubbleText: "#faf6f0",
  assistantBubble: "#ffffff",
};

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
  }

  body {
    background: ${theme.bg};
    color: ${theme.text};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }
`;
