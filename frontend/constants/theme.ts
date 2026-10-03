
export const theme = {
  colors: {
    primary: "#FF6B35",
    secondary: "#4ECDC4",
    background: "#0F0F0F",
    surface: "#1A1A1A",
    card: "#2A2A2A",
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    textMuted: "#666666",
    border: "#333333",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    accent: "#9C27B0",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: "bold" as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: "bold" as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: "normal" as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: "normal" as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: "normal" as const,
      lineHeight: 16,
    },
  },
};
