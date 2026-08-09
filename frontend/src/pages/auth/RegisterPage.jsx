import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  ApartmentRounded,
  ArrowBackRounded,
  EmailOutlined,
  LockOutlined,
  PersonOutlineRounded,
  PhoneOutlined,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import authService from "../../services/authService";

const cities = [
  "Colombo",
  "Dehiwala-Mount Lavinia",
  "Moratuwa",
  "Sri Jayawardenepura Kotte",
  "Negombo",
  "Kandy",
  "Galle",
  "Matara",
  "Kurunegala",
  "Jaffna",
  "Batticaloa",
  "Trincomalee",
  "Anuradhapura",
  "Polonnaruwa",
  "Ratnapura",
  "Badulla",
  "Nuwara Eliya",
  "Hambantota",
  "Kalutara",
  "Gampaha",
];

const contactMethods = [
  {
    value: "EMAIL",
    label: "Email",
  },
  {
    value: "PHONE",
    label: "Phone Call",
  },
  {
    value: "SMS",
    label: "SMS",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    nicPassportNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    preferredContactMethod: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return "Full name is required.";
    }

    if (!formData.email.trim()) {
      return "Email address is required.";
    }

    if (!formData.phone.trim()) {
      return "Phone number is required.";
    }

    if (!formData.password) {
      return "Password is required.";
    }

    const strongPasswordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,100}$/;

    if (
      !strongPasswordPattern.test(
        formData.password
      )
    ) {
      return "Password must contain uppercase, lowercase, number and special character.";
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      return "Password and confirm password do not match.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      const response =
        await authService.register({
          fullName:
            formData.fullName.trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            formData.phone.trim(),

          password:
            formData.password,

          confirmPassword:
            formData.confirmPassword,

          nicPassportNumber:
            formData.nicPassportNumber.trim(),

          addressLine1:
            formData.addressLine1.trim(),

          addressLine2:
            formData.addressLine2.trim(),

          city:
            formData.city,

          preferredContactMethod:
            formData.preferredContactMethod,
        });

      setSuccessMessage(
        response?.message ||
          "Registration completed successfully."
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registrationSuccess: true,
          },
        });
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to create your account."
      );
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
          lg: "0.85fr 1.15fr",
        },

        background:
          "radial-gradient(circle at 10% 10%, rgba(96,165,250,0.22), transparent 26%), radial-gradient(circle at 95% 90%, rgba(167,139,250,0.14), transparent 30%), #f6f8fc",
      }}
    >
      {/* Left information panel */}
      <Box
        sx={{
          display: {
            xs: "none",
            lg: "flex",
          },

          alignItems: "center",
          justifyContent: "center",

          px: 8,

          background:
            "linear-gradient(145deg, #0f2b50 0%, #15538d 100%)",

          color: "#ffffff",
        }}
      >
        <Stack
          spacing={4}
          sx={{
            maxWidth: 520,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,

              display: "grid",
              placeItems: "center",

              borderRadius: "22px",

              background:
                "rgba(255,255,255,0.14)",

              border:
                "1px solid rgba(255,255,255,0.18)",

              backdropFilter:
                "blur(18px)",
            }}
          >
            <ApartmentRounded
              sx={{ fontSize: 40 }}
            />
          </Box>

          <Box>
            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                fontSize: {
                  lg: 48,
                  xl: 58,
                },

                lineHeight: 1.08,
                letterSpacing: "-1.6px",
              }}
            >
              Create your
              <br />
              Skyline Living account
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: 470,
                fontSize: 17,
                lineHeight: 1.75,

                color:
                  "rgba(255,255,255,0.75)",
              }}
            >
              Register to manage apartment
              reservations, payments,
              transactions and your personal
              account information.
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color:
                "rgba(255,255,255,0.52)",
            }}
          >
            Skyline Living Apartments
          </Typography>
        </Stack>
      </Box>

      {/* Registration form */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          p: {
            xs: 2,
            sm: 4,
            lg: 5,
          },
        }}
      >
        <Paper
          component={motion.div}
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 900,

            p: {
              xs: 3,
              sm: 4,
              md: 5,
            },

            borderRadius: "28px",

            background:
              "linear-gradient(145deg, rgba(255,255,255,0.97), rgba(255,255,255,0.84))",

            backdropFilter:
              "blur(26px)",

            border:
              "1px solid rgba(255,255,255,0.95)",

            boxShadow:
              "0 24px 70px rgba(48,75,105,0.12)",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Button
                color="inherit"
                startIcon={
                  <ArrowBackRounded />
                }
                onClick={() =>
                  navigate("/login")
                }
                sx={{
                  mb: 2,
                  px: 0,
                }}
              >
                Back to login
              </Button>

              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  fontSize: {
                    xs: 34,
                    sm: 42,
                  },

                  letterSpacing: "-1px",
                }}
              >
                Create account
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Enter your details to register
                as a customer.
              </Typography>
            </Box>

            {errorMessage && (
              <Alert
                severity="error"
                onClose={() =>
                  setErrorMessage("")
                }
                sx={{
                  borderRadius: "16px",
                }}
              >
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: "16px",
                }}
              >
                {successMessage}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              autoComplete="off"
            >
              <Grid container spacing={2.25}>
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="fullName"
                    label="Full Name"
                    fullWidth
                    required
                    autoFocus
                    value={formData.fullName}
                    disabled={loading}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineRounded />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    value={formData.email}
                    disabled={loading}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlined />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="phone"
                    label="Phone Number"
                    fullWidth
                    required
                    value={formData.phone}
                    disabled={loading}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneOutlined />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="nicPassportNumber"
                    label="NIC / Passport Number"
                    fullWidth
                    value={
                      formData.nicPassportNumber
                    }
                    disabled={loading}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="password"
                    label="Password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    fullWidth
                    required
                    value={formData.password}
                    disabled={loading}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined />
                          </InputAdornment>
                        ),

                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              edge="end"
                              onClick={() =>
                                setShowPassword(
                                  (current) =>
                                    !current
                                )
                              }
                            >
                              {showPassword ? (
                                <VisibilityOffRounded />
                              ) : (
                                <VisibilityRounded />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },

                      htmlInput: {
                        autoComplete:
                          "new-password",
                      },
                    }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="confirmPassword"
                    label="Confirm Password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    fullWidth
                    required
                    value={
                      formData.confirmPassword
                    }
                    disabled={loading}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined />
                          </InputAdornment>
                        ),

                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              edge="end"
                              onClick={() =>
                                setShowConfirmPassword(
                                  (current) =>
                                    !current
                                )
                              }
                            >
                              {showConfirmPassword ? (
                                <VisibilityOffRounded />
                              ) : (
                                <VisibilityRounded />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },

                      htmlInput: {
                        autoComplete:
                          "new-password",
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="addressLine1"
                    label="Address Line 1"
                    fullWidth
                    value={
                      formData.addressLine1
                    }
                    disabled={loading}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="addressLine2"
                    label="Address Line 2"
                    fullWidth
                    value={
                      formData.addressLine2
                    }
                    disabled={loading}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="city"
                    label="City"
                    select
                    fullWidth
                    value={formData.city}
                    disabled={loading}
                    onChange={handleChange}
                  >
                    <MenuItem value="">
                      Select city
                    </MenuItem>

                    {cities.map((city) => (
                      <MenuItem
                        key={city}
                        value={city}
                      >
                        {city}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    name="preferredContactMethod"
                    label="Preferred Contact Method"
                    select
                    fullWidth
                    value={
                      formData.preferredContactMethod
                    }
                    disabled={loading}
                    onChange={handleChange}
                  >
                    <MenuItem value="">
                      Select contact method
                    </MenuItem>

                    {contactMethods.map(
                      (method) => (
                        <MenuItem
                          key={method.value}
                          value={method.value}
                        >
                          {method.label}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Password must contain at
                    least one uppercase letter,
                    lowercase letter, number and
                    special character.
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{
                      minHeight: 54,

                      borderRadius: "16px",

                      fontSize: 16,
                      fontWeight: 800,

                      boxShadow:
                        "0 13px 30px rgba(37,99,235,0.24)",

                      transition:
                        "all 180ms ease",

                      "&:hover": {
                        transform:
                          "translateY(-2px)",

                        boxShadow:
                          "0 17px 36px rgba(37,99,235,0.3)",
                      },

                      "&:active": {
                        transform:
                          "scale(0.985)",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress
                        size={24}
                        color="inherit"
                      />
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Typography
              variant="body2"
              textAlign="center"
              color="text.secondary"
            >
              Already have an account?{" "}
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() =>
                  navigate("/login")
                }
                sx={{
                  fontWeight: 800,
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegisterPage;