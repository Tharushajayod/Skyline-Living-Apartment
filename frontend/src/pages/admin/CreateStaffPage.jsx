import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  BadgeRounded,
  BusinessRounded,
  CalendarMonthRounded,
  EmailRounded,
  LockRounded,
  PersonAddRounded,
  PersonRounded,
  PhoneRounded,
  RefreshRounded,
  VisibilityOffRounded,
  VisibilityRounded,
  GroupRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import adminUserService from "../../services/adminUserService";

const MotionCard = motion.create(Card);

const departments = [
  "Sales",
  "Customer Relations",
  "Operations",
  "Marketing",
  "Finance",
];

const staffRoles = [
  {
    value: "SALES_MANAGER",
    label: "Sales Manager",
    department: "Sales",
    designation: "Sales Manager",
  },
  {
    value: "CUSTOMER_RELATIONS_OFFICER",
    label: "Customer Relations Officer",
    department: "Customer Relations",
    designation: "Customer Relations Officer",
  },
  {
    value: "OPERATIONS_MANAGER",
    label: "Operations Manager",
    department: "Operations",
    designation: "Operations Manager",
  },
  {
    value: "MARKETING_EXECUTIVE",
    label: "Marketing Executive",
    department: "Marketing",
    designation: "Marketing Executive",
  },
  {
    value: "FINANCE_OFFICER",
    label: "Finance Officer",
    department: "Finance",
    designation: "Finance Officer",
  },
];

const initialFormData = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  employeeNumber: "",
  department: "",
  designation: "",
  role: "",
  hireDate: new Date().toISOString().split("T")[0],
};

const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,100}$/;

const CreateStaffPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState(initialFormData);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const selectedRole = useMemo(
    () =>
      staffRoles.find(
        (role) => role.value === formData.role
      ),
    [formData.role]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const handleRoleChange = (event) => {
    const roleValue = event.target.value;

    const roleDetails = staffRoles.find(
      (role) => role.value === roleValue
    );

    setFormData((current) => ({
      ...current,
      role: roleValue,
      department:
        roleDetails?.department ||
        current.department,
      designation:
        roleDetails?.designation ||
        current.designation,
    }));

    setFieldErrors((current) => ({
      ...current,
      role: "",
      department: "",
      designation: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName =
        "Full name is required.";
    }

    if (!formData.email.trim()) {
      errors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone =
        "Phone number is required.";
    }

    if (!formData.employeeNumber.trim()) {
      errors.employeeNumber =
        "Employee number is required.";
    }

    if (!formData.role) {
      errors.role =
        "Staff role is required.";
    }

    if (!formData.department) {
      errors.department =
        "Department is required.";
    }

    if (!formData.designation.trim()) {
      errors.designation =
        "Designation is required.";
    }

    if (!formData.password) {
      errors.password =
        "Password is required.";
    } else if (
      !strongPasswordPattern.test(
        formData.password
      )
    ) {
      errors.password =
        "Password must include uppercase, lowercase, number and special character.";
    }

    if (!formData.hireDate) {
      errors.hireDate =
        "Hire date is required.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const generatePassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const special = "@#$%&+=!";

    const pick = (characters) =>
      characters[
        Math.floor(
          Math.random() * characters.length
        )
      ];

    const allCharacters =
      uppercase +
      lowercase +
      numbers +
      special;

    let password =
      pick(uppercase) +
      pick(lowercase) +
      pick(numbers) +
      pick(special);

    while (password.length < 12) {
      password += pick(allCharacters);
    }

    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setFormData((current) => ({
      ...current,
      password,
    }));

    setFieldErrors((current) => ({
      ...current,
      password: "",
    }));

    setShowPassword(true);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setFieldErrors({});
    setErrorMessage("");
    setSuccessMessage("");
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await adminUserService.createStaff({
          fullName:
            formData.fullName.trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          password: formData.password,

          phone: formData.phone.trim(),

          employeeNumber:
            formData.employeeNumber
              .trim()
              .toUpperCase(),

          department:
            formData.department.trim(),

          designation:
            formData.designation.trim(),

          role: formData.role,

          hireDate: formData.hireDate,
        });

      setSuccessMessage(
        response?.message ||
          "Staff account created successfully."
      );

      setFormData(initialFormData);
      setFieldErrors({});
      setShowPassword(false);
    } catch (error) {
      console.error(
        "Unable to create staff account:",
        error
      );

      const backendData =
        error.response?.data;

      setErrorMessage(
        backendData?.message ||
          backendData?.error ||
          "Unable to create staff account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      spacing={3}
      sx={{
        maxWidth: 1250,
        mx: "auto",
      }}
    >


      {successMessage && (
        <Alert
          severity="success"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{
            borderRadius: "16px",
          }}
        >
          {successMessage}
        </Alert>
      )}

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

      <MotionCard
        elevation={0}
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        sx={{
          borderRadius: "26px",

          background:
            "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.9))",

          border:
            "1px solid rgba(255,255,255,0.96)",

          boxShadow:
            "0 18px 55px rgba(53,79,108,0.09)",

          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              sm: 4,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                sm: 4,
              },
            },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
          >
            <Stack spacing={3.5}>
              <Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "14px",
                      color: "#4f46e5",
                      backgroundColor:
                        "rgba(79,70,229,0.09)",
                    }}
                  >
                    <PersonRounded />
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={850}
                    >
                      Personal Information
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Enter the staff member's
                      contact details.
                    </Typography>
                  </Box>
                </Stack>

                <Grid
                  container
                  spacing={2.25}
                  sx={{ mt: 1 }}
                >
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
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors.fullName
                        )
                      }
                      helperText={
                        fieldErrors.fullName
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonRounded />
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
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors.email
                        )
                      }
                      helperText={
                        fieldErrors.email
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailRounded />
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
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors.phone
                        )
                      }
                      helperText={
                        fieldErrors.phone
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneRounded />
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
                      name="employeeNumber"
                      label="Employee Number"
                      fullWidth
                      required
                      value={
                        formData.employeeNumber
                      }
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors
                            .employeeNumber
                        )
                      }
                      helperText={
                        fieldErrors
                          .employeeNumber
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeRounded />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "14px",
                      color: "#2563eb",
                      backgroundColor:
                        "rgba(37,99,235,0.09)",
                    }}
                  >
                    <BusinessRounded />
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={850}
                    >
                      Employment Information
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Assign department,
                      designation and role.
                    </Typography>
                  </Box>
                </Stack>

                <Grid
                  container
                  spacing={2.25}
                  sx={{ mt: 1 }}
                >
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <FormControl
                      fullWidth
                      required
                      error={
                        Boolean(
                          fieldErrors.role
                        )
                      }
                    >
                      <InputLabel>
                        Staff Role
                      </InputLabel>

                      <Select
                        name="role"
                        label="Staff Role"
                        value={formData.role}
                        onChange={
                          handleRoleChange
                        }
                        disabled={loading}
                      >
                        {staffRoles.map(
                          (role) => (
                            <MenuItem
                              key={role.value}
                              value={role.value}
                            >
                              {role.label}
                            </MenuItem>
                          )
                        )}
                      </Select>

                      <FormHelperText>
                        {fieldErrors.role}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <FormControl
                      fullWidth
                      required
                      error={
                        Boolean(
                          fieldErrors.department
                        )
                      }
                    >
                      <InputLabel>
                        Department
                      </InputLabel>

                      <Select
                        name="department"
                        label="Department"
                        value={
                          formData.department
                        }
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {departments.map(
                          (department) => (
                            <MenuItem
                              key={department}
                              value={department}
                            >
                              {department}
                            </MenuItem>
                          )
                        )}
                      </Select>

                      <FormHelperText>
                        {
                          fieldErrors.department
                        }
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <TextField
                      name="designation"
                      label="Designation"
                      fullWidth
                      required
                      value={
                        formData.designation
                      }
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors.designation
                        )
                      }
                      helperText={
                        fieldErrors.designation
                      }
                    />
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                    }}
                  >
                    <TextField
                      name="hireDate"
                      label="Hire Date"
                      type="date"
                      fullWidth
                      required
                      value={formData.hireDate}
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors.hireDate
                        )
                      }
                      helperText={
                        fieldErrors.hireDate
                      }
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },

                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonthRounded />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "14px",
                      color: "#7c3aed",
                      backgroundColor:
                        "rgba(124,58,237,0.09)",
                    }}
                  >
                    <LockRounded />
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={850}
                    >
                      Account Security
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Create the initial staff
                      login password.
                    </Typography>
                  </Box>
                </Stack>

                <Grid
                  container
                  spacing={2.25}
                  sx={{ mt: 1 }}
                >
                  <Grid
                    size={{
                      xs: 12,
                      md: 8,
                    }}
                  >
                    <TextField
                      name="password"
                      label="Initial Password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      fullWidth
                      required
                      value={
                        formData.password
                      }
                      onChange={handleChange}
                      disabled={loading}
                      error={
                        Boolean(
                          fieldErrors.password
                        )
                      }
                      helperText={
                        fieldErrors.password ||
                        "Use at least 8 characters with uppercase, lowercase, number and special character."
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockRounded />
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
                      }}
                    />
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      md: 4,
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      onClick={generatePassword}
                      disabled={loading}
                      startIcon={
                        <RefreshRounded />
                      }
                      sx={{
                        minHeight: 56,
                        borderRadius: "14px",
                      }}
                    >
                      Generate Password
                    </Button>
                  </Grid>
                </Grid>

                {selectedRole && (
                  <Alert
                    severity="info"
                    sx={{
                      mt: 2.25,
                      borderRadius: "15px",
                    }}
                  >
                    This account will receive{" "}
                    <strong>
                      {selectedRole.label}
                    </strong>{" "}
                    access.
                  </Alert>
                )}
              </Box>

              <Stack
                direction={{
                  xs: "column-reverse",
                  sm: "row",
                }}
                justifyContent="flex-end"
                spacing={1.5}
              >
                <Button
                  type="button"
                  color="inherit"
                  variant="outlined"
                  onClick={handleReset}
                  disabled={loading}
                  sx={{
                    minHeight: 48,
                    borderRadius: "14px",
                  }}
                >
                  Reset Form
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : (
                      <PersonAddRounded />
                    )
                  }
                  sx={{
                    minHeight: 48,
                    px: 3,
                    borderRadius: "14px",

                    background:
                      "linear-gradient(135deg, #4f46e5, #6366f1)",

                    boxShadow:
                      "0 12px 28px rgba(79,70,229,0.24)",

                    transition:
                      "all 180ms ease",

                    "&:hover": {
                      transform:
                        "translateY(-2px)",

                      boxShadow:
                        "0 16px 34px rgba(79,70,229,0.30)",
                    },

                    "&:active": {
                      transform:
                        "scale(0.98)",
                    },
                  }}
                >
                  {loading
                    ? "Creating..."
                    : "Create Staff Account"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </MotionCard>
    </Stack>
  );
};

export default CreateStaffPage;