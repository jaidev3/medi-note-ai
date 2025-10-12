import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb", // blue-600
      light: "#60a5fa", // blue-400
      dark: "#1e40af", // blue-700
    },
    secondary: {
      main: "#8b5cf6", // violet-500
      light: "#a78bfa", // violet-400
      dark: "#7c3aed", // violet-600
    },
    success: {
      main: "#10b981", // green-500
      light: "#34d399", // green-400
      dark: "#059669", // green-600
    },
    error: {
      main: "#ef4444", // red-500
      light: "#f87171", // red-400
      dark: "#dc2626", // red-600
    },
    warning: {
      main: "#f59e0b", // amber-500
      light: "#fbbf24", // amber-400
      dark: "#d97706", // amber-600
    },
    info: {
      main: "#3b82f6", // blue-500
      light: "#60a5fa", // blue-400
      dark: "#2563eb", // blue-600
    },
    background: {
      default: "#ffffff",
      paper: "#f9fafb", // gray-50
    },
    text: {
      primary: "#111827", // gray-900
      secondary: "#6b7280", // gray-500
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: {
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 600,
    },
    h4: {
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 600,
    },
    h5: {
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "JetBrains Mono, monospace",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;
