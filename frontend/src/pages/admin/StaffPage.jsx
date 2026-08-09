import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  AddRounded,
  BadgeRounded,
  BusinessRounded,
  GroupRounded,
  PersonRounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import adminUserService from "../../services/adminUserService";

const MotionCard = motion.create(Card);

const glassCard = {
  borderRadius: "22px",

  background:
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.90))",

  border:
    "1px solid rgba(255,255,255,0.96)",

  boxShadow:
    "0 14px 40px rgba(53,79,108,0.08)",

  overflow: "hidden",
};

const normalizeStatus = (value) =>
  value?.trim().toUpperCase() || "";

const formatLabel = (value) => {
  if (!value) {
    return "Not available";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const statusColors = {
  ACTIVE: "success",
  INACTIVE: "warning",
  BLOCKED: "error",
};

const StaffPage = () => {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data =
          await adminUserService.getAllStaff();

        setStaff(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Unable to load staff:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load staff accounts."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const departments = useMemo(
    () => [
      ...new Set(
        staff
          .map((item) => item.department)
          .filter(Boolean)
      ),
    ],
    [staff]
  );

  const roles = useMemo(
    () => [
      ...new Set(
        staff
          .map((item) => item.role)
          .filter(Boolean)
      ),
    ],
    [staff]
  );

  const summary = useMemo(() => {
    const activeStaff = staff.filter(
      (item) =>
        normalizeStatus(item.status) ===
        "ACTIVE"
    ).length;

    return {
      total: staff.length,
      active: activeStaff,
      inactive: staff.length - activeStaff,
      departments: departments.length,
    };
  }, [staff, departments]);

  const filteredStaff = useMemo(() => {
    const search =
      searchText.trim().toLowerCase();

    return staff.filter((item) => {
      const matchesSearch =
        !search ||
        item.fullName
          ?.toLowerCase()
          .includes(search) ||
        item.email
          ?.toLowerCase()
          .includes(search) ||
        item.employeeNumber
          ?.toLowerCase()
          .includes(search) ||
        item.designation
          ?.toLowerCase()
          .includes(search);

      const matchesDepartment =
        departmentFilter === "ALL" ||
        item.department === departmentFilter;

      const matchesRole =
        roleFilter === "ALL" ||
        item.role === roleFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesRole
      );
    });
  }, [
    staff,
    searchText,
    departmentFilter,
    roleFilter,
  ]);

  const summaryCards = [
    {
      title: "Total Staff",
      value: summary.total,
      subtitle: "All staff accounts",
      icon: <GroupRounded />,
      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },
    {
      title: "Active Staff",
      value: summary.active,
      subtitle: "Active system access",
      icon: <PersonRounded />,
      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },
    {
      title: "Inactive Staff",
      value: summary.inactive,
      subtitle: "Inactive or blocked",
      icon: <BadgeRounded />,
      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
    {
      title: "Departments",
      value: summary.departments,
      subtitle: "Registered departments",
      icon: <BusinessRounded />,
      gradient:
        "linear-gradient(145deg, #7356d9, #a793ff)",
    },
  ];

  return (
    <Stack
      spacing={3}
      sx={{
        maxWidth: 1500,
        mx: "auto",
      }}
    >


      {errorMessage && (
        <Alert
          severity="error"
          onClose={() =>
            setErrorMessage("")
          }
          sx={{ borderRadius: "16px" }}
        >
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        {summaryCards.map(
          (card, index) => (
            <Grid
              key={card.title}
              size={{
                xs: 12,
                sm: 6,
                xl: 3,
              }}
            >
              <MotionCard
                elevation={0}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.06,
                }}
                whileHover={{ y: -4 }}
                sx={{
                  ...glassCard,
                  height: "100%",
                }}
              >
                <CardContent
                  sx={{
                    p: 2.8,

                    "&:last-child": {
                      pb: 2.8,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 54,
                        height: 54,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "18px",
                        color: "#fff",
                        background:
                          card.gradient,
                      }}
                    >
                      {card.icon}
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={650}
                      >
                        {card.title}
                      </Typography>

                      {loading ? (
                        <Skeleton
                          width={70}
                          height={38}
                        />
                      ) : (
                        <Typography
                          variant="h5"
                          fontWeight={900}
                        >
                          {card.value}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {card.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>
          )
        )}
      </Grid>

      <Card elevation={0} sx={glassCard}>
        <CardContent sx={{ p: 2.75 }}>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                fullWidth
                label="Search staff"
                placeholder="Name, email, employee number or designation"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded />
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
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Department
                </InputLabel>

                <Select
                  label="Department"
                  value={departmentFilter}
                  onChange={(event) =>
                    setDepartmentFilter(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="ALL">
                    All departments
                  </MenuItem>

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
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>

                <Select
                  label="Role"
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="ALL">
                    All roles
                  </MenuItem>

                  {roles.map((role) => (
                    <MenuItem
                      key={role}
                      value={role}
                    >
                      {formatLabel(role)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={115}
              sx={{ borderRadius: "20px" }}
            />
          ))}
        </Stack>
      ) : filteredStaff.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            ...glassCard,
            textAlign: "center",
          }}
        >
          <CardContent sx={{ py: 8 }}>
            <GroupRounded
              sx={{
                fontSize: 50,
                color: "#94a3b8",
              }}
            />

            <Typography
              variant="h6"
              fontWeight={850}
              sx={{ mt: 1 }}
            >
              No staff found
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.7 }}
            >
              No staff accounts match the
              selected filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.4}>
          {filteredStaff.map(
            (item, index) => {
              const status =
                normalizeStatus(item.status);

              return (
                <MotionCard
                  key={item.staffId}
                  elevation={0}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: Math.min(
                      index * 0.04,
                      0.3
                    ),
                  }}
                  whileHover={{ y: -3 }}
                  sx={glassCard}
                >
                  <CardContent
                    sx={{
                      p: 2.3,

                      "&:last-child": {
                        pb: 2.3,
                      },
                    }}
                  >
                    <Grid
                      container
                      spacing={2}
                      alignItems="center"
                    >
                      <Grid
                        size={{
                          xs: 12,
                          md: 3.4,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,

                              background:
                                "linear-gradient(135deg, #4f46e5, #818cf8)",
                            }}
                          >
                            {item.fullName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "S"}
                          </Avatar>

                          <Box>
                            <Typography
                              fontWeight={850}
                            >
                              {item.fullName}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {item.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid
                        size={{
                          xs: 6,
                          md: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Employee No.
                        </Typography>

                        <Typography
                          fontWeight={750}
                        >
                          {item.employeeNumber}
                        </Typography>
                      </Grid>

                      <Grid
                        size={{
                          xs: 6,
                          md: 1.7,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Department
                        </Typography>

                        <Typography
                          fontWeight={750}
                        >
                          {item.department}
                        </Typography>
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          md: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Designation
                        </Typography>

                        <Typography
                          fontWeight={750}
                        >
                          {item.designation}
                        </Typography>
                      </Grid>

                      <Grid
                        size={{
                          xs: 6,
                          md: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Hire Date
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={700}
                        >
                          {formatDate(
                            item.hireDate
                          )}
                        </Typography>
                      </Grid>

                      <Grid
                        size={{
                          xs: 6,
                          md: 1,
                        }}
                      >
                        <Chip
                          size="small"
                          label={formatLabel(
                            item.status
                          )}
                          color={
                            statusColors[
                              status
                            ] || "default"
                          }
                          sx={{
                            fontWeight: 750,
                          }}
                        />
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          md: 0.9,
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            <VisibilityRounded />
                          }
                          onClick={() =>
                            navigate(
                              `/admin/users/${item.userId}`
                            )
                          }
                          sx={{
                            borderRadius: "11px",
                          }}
                        >
                          View
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MotionCard>
              );
            }
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default StaffPage;