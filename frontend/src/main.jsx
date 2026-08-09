import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#2563eb",
      dark: "#1d4ed8",
      light: "#60a5fa",
    },

    secondary: {
      main: "#7c3aed",
    },

    background: {
      default: "#f6f8fc",
      paper: "#ffffff",
    },

    text: {
      primary: "#172033",
      secondary: "#6b7280",
    },
  },

  typography: {
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',

    h4: {
      fontWeight: 800,
      letterSpacing: "-0.6px",
    },

    h6: {
      fontWeight: 750,
    },

    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },

  shape: {
    borderRadius: 16,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);