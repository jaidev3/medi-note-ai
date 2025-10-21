import { createTheme } from "@mui/material/styles";

// Color palette
const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  secondary: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  info: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
};

// Typography scale
const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMono: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
  h1: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 800,
    fontSize: "2.5rem",
    lineHeight: 1.2,
    letterSpacing: "-0.025em",
  },
  h2: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 700,
    fontSize: "2rem",
    lineHeight: 1.3,
    letterSpacing: "-0.025em",
  },
  h3: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: "1.75rem",
    lineHeight: 1.3,
    letterSpacing: "-0.025em",
  },
  h4: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.4,
  },
  h5: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: "1.25rem",
    lineHeight: 1.4,
  },
  h6: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: "1.125rem",
    lineHeight: 1.4,
  },
  subtitle1: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  subtitle2: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  body1: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: "1rem",
    lineHeight: 1.6,
  },
  body2: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  button: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: "0.875rem",
    lineHeight: 1.5,
    textTransform: "none" as const,
  },
  caption: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: "0.75rem",
    lineHeight: 1.4,
  },
  overline: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: "0.75rem",
    lineHeight: 1.4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
};

// Spacing scale (consistent with Tailwind)
const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
  "2xl": 4,
  "3xl": 6,
  "4xl": 8,
  "5xl": 10,
  "6xl": 12,
  "7xl": 14,
  "8xl": 16,
  "9xl": 20,
  "10xl": 24,
};

// Shadow utilities
const shadows = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  primary: "0 4px 20px rgba(37, 99, 235, 0.15)",
  secondary: "0 4px 20px rgba(139, 92, 246, 0.15)",
  success: "0 4px 20px rgba(34, 197, 94, 0.15)",
  warning: "0 4px 20px rgba(245, 158, 11, 0.15)",
  error: "0 4px 20px rgba(239, 68, 68, 0.15)",
  info: "0 4px 20px rgba(14, 165, 233, 0.15)",
};

// Border radius
const borderRadius = {
  none: 0,
  sm: 0.25,
  md: 0.5,
  lg: 0.75,
  xl: 1,
  "2xl": 1.5,
  "3xl": 2,
  full: 9999,
};

// Create the theme
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[700],
      contrastText: "#ffffff",
    },
    secondary: {
      main: colors.secondary[600],
      light: colors.secondary[400],
      dark: colors.secondary[700],
      contrastText: "#ffffff",
    },
    success: {
      main: colors.success[600],
      light: colors.success[400],
      dark: colors.success[700],
      contrastText: "#ffffff",
    },
    warning: {
      main: colors.warning[600],
      light: colors.warning[400],
      dark: colors.warning[700],
      contrastText: "#ffffff",
    },
    error: {
      main: colors.error[600],
      light: colors.error[400],
      dark: colors.error[700],
      contrastText: "#ffffff",
    },
    info: {
      main: colors.info[600],
      light: colors.info[400],
      dark: colors.info[700],
      contrastText: "#ffffff",
    },
    background: {
      default: colors.gray[50],
      paper: "#ffffff",
    },
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[600],
      disabled: colors.gray[400],
    },
    divider: colors.gray[200],
  },
  typography,
  shape: {
    borderRadius: borderRadius.lg,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: borderRadius.lg,
          padding: `${spacing.sm}rem ${spacing.lg}rem`,
          transition: "all 0.2s ease-in-out",
          boxShadow: "none",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: shadows.md,
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.sm,
          border: `1px solid ${colors.gray[100]}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: shadows.md,
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: borderRadius.lg,
            transition: "all 0.2s ease-in-out",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary[400],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary[500],
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          fontWeight: 500,
          "&.MuiChip-colorPrimary": {
            backgroundColor: colors.primary[100],
            color: colors.primary[700],
          },
          "&.MuiChip-colorSecondary": {
            backgroundColor: colors.secondary[100],
            color: colors.secondary[700],
          },
          "&.MuiChip-colorSuccess": {
            backgroundColor: colors.success[100],
            color: colors.success[700],
          },
          "&.MuiChip-colorWarning": {
            backgroundColor: colors.warning[100],
            color: colors.warning[700],
          },
          "&.MuiChip-colorError": {
            backgroundColor: colors.error[100],
            color: colors.error[700],
          },
          "&.MuiChip-colorInfo": {
            backgroundColor: colors.info[100],
            color: colors.info[700],
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          boxShadow: shadows.sm,
          borderBottom: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: colors.gray[50],
          fontWeight: 600,
          color: colors.gray[700],
          borderBottom: `2px solid ${colors.gray[200]}`,
        },
        body: {
          borderBottom: `1px solid ${colors.gray[100]}`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
          minHeight: 48,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.md,
        },
        elevation3: {
          boxShadow: shadows.lg,
        },
      },
    },
  },
});

export default theme;