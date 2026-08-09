import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  ApartmentRounded,
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
    user,
  } = useAuth();

  const [email, setEmail] = useState(
    localStorage.getItem("rememberedEmail") || ""
  );

  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("rememberedEmail"))
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectByRole = (role) => {
    if (role === "CUSTOMER") {
      navigate("/customer/dashboard", {
        replace: true,
      });

      return;
    }

    const internalRoles = [
      "ADMIN",
      "SALES_MANAGER",
      "CUSTOMER_RELATIONS_OFFICER",
      "OPERATIONS_MANAGER",
      "MARKETING_EXECUTIVE",
      "FINANCE_OFFICER",
    ];

    if (internalRoles.includes(role)) {
      navigate("/admin/dashboard", {
        replace: true,
      });

      return;
    }

    navigate("/unauthorized", {
      replace: true,
    });
  };

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      const loggedInUser = await login(
        normalizedEmail,
        password
      );

      if (rememberMe) {
        localStorage.setItem(
          "rememberedEmail",
          normalizedEmail
        );
      } else {
        localStorage.removeItem(
          "rememberedEmail"
        );
      }

      redirectByRole(loggedInUser.role);
    } catch (error) {

        console.error("LOGIN ERROR:", error);
        console.error("BACKEND RESPONSE:", error.response?.data);

      const backendMessage =
        error.response?.data?.message;

      if (error.response?.status === 401) {
        setErrorMessage(
          backendMessage ||
            "Invalid email or password."
        );
      } else if (error.response?.status === 403) {
        setErrorMessage(
          backendMessage ||
            "Your account does not have permission to sign in."
        );
      } else if (!error.response) {
        setErrorMessage(
          "Cannot connect to the server. Make sure the backend is running."
        );
      } else {
        setErrorMessage(
          backendMessage ||
            "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "1.1fr 0.9fr",
        },
        background:
          "linear-gradient(135deg, #041429 0%, #092c52 48%, #0d5c9d 100%)",
      }}
    >
      {/* Left side */}
      <Box
        sx={{
          display: {
            xs: "none",
            md: "flex",
          },
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          px: 8,
          color: "white",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "rgba(45, 170, 255, 0.16)",
            filter: "blur(4px)",
            top: -100,
            left: -100,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "rgba(115, 220, 255, 0.13)",
            bottom: -80,
            right: -50,
          }}
        />

        <Stack
          spacing={4}
          sx={{
            position: "relative",
            maxWidth: 600,
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: 82,
              height: 82,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              background:
                "rgba(255,255,255,0.13)",
              border:
                "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(14px)",
            }}
          >
            <ApartmentRounded
              sx={{
                fontSize: 46,
              }}
            />
          </Box>

          <Box>
            <Typography
            variant="h2"
            fontWeight={800}
            sx={{
                lineHeight: 1.08,
                letterSpacing: "-1.5px",
            }}
            >
            Skyline Living
            </Typography>

            <Typography
            variant="h4"
            fontWeight={500}
            sx={{
                color: "rgba(255,255,255,0.82)",
            }}
            >
            Apartment Sales Portal
            </Typography>

            <Typography
            sx={{
                maxWidth: 520,
                fontSize: 18,
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.72)",
            }}
            >
            Manage apartment listings, reservations,
            payments and customer services through one
            connected platform.
            </Typography>
          </Box>

        </Stack>
      </Box>

      {/* Login side */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: {
            xs: 2,
            sm: 4,
            md: 6,
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 480,
            p: {
              xs: 3,
              sm: 5,
            },
            borderRadius: 5,
            background:
              "rgba(255,255,255,0.96)",
            border:
              "1px solid rgba(255,255,255,0.5)",
            boxShadow:
              "0 28px 80px rgba(0,0,0,0.32)",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  mb: 3,
                  display: {
                    xs: "flex",
                    md: "none",
                  },
                }}
              >
                <ApartmentRounded
                  color="primary"
                  sx={{ fontSize: 34 }}
                />

                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  Skyline Living
                </Typography>
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                    fontSize: {
                    xs: 32,
                    sm: 40,
                    },
                }}
                >
                Welcome to Skyline Living
                </Typography>

                <Typography
                color="text.secondary"
                sx={{ mt: 1 }}
                >
                Sign in to continue to your account.
                </Typography>
            </Box>

            {errorMessage && (
              <Alert
                severity="error"
                onClose={() =>
                  setErrorMessage("")
                }
              >
                {errorMessage}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
            >
              <Stack spacing={2.5}>
                <TextField
                  label="Email address"
                  type="email"
                  fullWidth
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  disabled={loading}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  fullWidth
                  required
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),

                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          onClick={() =>
                            setShowPassword(
                              (current) =>
                                !current
                            )
                          }
                        >
                          {showPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  alignItems={{
                    xs: "flex-start",
                    sm: "center",
                  }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        disabled={loading}
                        onChange={(event) =>
                          setRememberMe(
                            event.target.checked
                          )
                        }
                      />
                    }
                    label="Remember my email"
                  />

                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    disabled={loading}
                    onClick={() =>
                      navigate(
                        "/forgot-password"
                      )
                    }
                    sx={{
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </Link>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    minHeight: 54,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontSize: 16,
                    fontWeight: 800,
                    boxShadow:
                      "0 12px 28px rgba(21,101,192,0.28)",
                  }}
                >
                  {loading ? (
                    <CircularProgress
                      size={25}
                      color="inherit"
                    />
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <Typography
                variant="body2"
                textAlign="center"
                color="text.secondary"
                >
                New to Skyline Living?{" "}
                <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() =>
                    navigate("/register")
                    }
                    sx={{
                    fontWeight: 800,
                    }}
                >
                    Create account
                </Link>
                </Typography>

              </Stack>
            </Box>

          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginPage;