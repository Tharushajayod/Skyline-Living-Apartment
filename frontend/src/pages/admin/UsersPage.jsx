import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  BlockRounded,
  CheckCircleRounded,
  CloseRounded,
  GroupRounded,
  ManageAccountsRounded,
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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
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
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.88))",

  backdropFilter: "blur(22px)",

  border:
    "1px solid rgba(255,255,255,0.96)",

  boxShadow:
    "0 14px 40px rgba(53,79,108,0.08)",

  overflow: "hidden",
};

const statusColors = {
  ACTIVE: "success",
  INACTIVE: "warning",
  BLOCKED: "error",
};

const normalizeStatus = (status) =>
  status?.trim().toUpperCase() || "";

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

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [statusDialogOpen, setStatusDialogOpen] =
    useState(false);

  const [newStatus, setNewStatus] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data =
        await adminUserService.getAllUsers();

      setUsers(data);
    } catch (error) {
      console.error(
        "Unable to load users:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load user accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const roles = useMemo(() => {
    return [
      ...new Set(
        users
          .map((user) => user.role)
          .filter(Boolean)
      ),
    ];
  }, [users]);

  const summary = useMemo(() => {
    return {
      total: users.length,

      active: users.filter(
        (user) =>
          normalizeStatus(user.status) ===
          "ACTIVE"
      ).length,

      inactive: users.filter(
        (user) =>
          normalizeStatus(user.status) ===
          "INACTIVE"
      ).length,

      blocked: users.filter(
        (user) =>
          normalizeStatus(user.status) ===
          "BLOCKED"
      ).length,
    };
  }, [users]);

  const summaryCards = [
    {
      title: "Total Users",
      value: summary.total,
      subtitle: "All registered accounts",
      icon: <GroupRounded />,
      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },
    {
      title: "Active Users",
      value: summary.active,
      subtitle: "Accounts with access",
      icon: <CheckCircleRounded />,
      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },
    {
      title: "Inactive Users",
      value: summary.inactive,
      subtitle: "Temporarily inactive",
      icon: <PersonRounded />,
      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
    {
      title: "Blocked Users",
      value: summary.blocked,
      subtitle: "Access has been blocked",
      icon: <BlockRounded />,
      gradient:
        "linear-gradient(145deg, #dc2626, #fb7185)",
    },
  ];

  const filteredUsers = useMemo(() => {
    const search =
      searchText.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.fullName
          ?.toLowerCase()
          .includes(search) ||
        user.email
          ?.toLowerCase()
          .includes(search) ||
        user.phone
          ?.toLowerCase()
          .includes(search) ||
        String(user.userId).includes(search);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizeStatus(user.status) ===
          statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    searchText,
    roleFilter,
    statusFilter,
  ]);

  const handleViewUser = async (userId) => {
    try {
      setLoadingDetails(true);
      setErrorMessage("");

      const data =
        await adminUserService.getUserById(
          userId
        );

      setSelectedUser(data);
      setDetailsOpen(true);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load user details."
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const openStatusDialog = (user) => {
    setSelectedUser(user);

    setNewStatus(
      normalizeStatus(user.status)
    );

    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (
      !selectedUser?.userId ||
      !newStatus
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedUser =
        await adminUserService.updateUserStatus(
          selectedUser.userId,
          newStatus
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.userId === updatedUser.userId
            ? updatedUser
            : user
        )
      );

      setSelectedUser(updatedUser);
      setStatusDialogOpen(false);

      setSuccessMessage(
        `User status changed to ${formatLabel(
          updatedUser.status
        )}.`
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to update user status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <>
      <Stack
        spacing={3}
        sx={{
          maxWidth: 1500,
          mx: "auto",
        }}
      >


        {successMessage && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccessMessage("")
            }
            sx={{ borderRadius: "16px" }}
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
                    y: 16,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.06,
                  }}
                  whileHover={{
                    y: -4,
                  }}
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
                          color: "#ffffff",
                          background:
                            card.gradient,

                          boxShadow:
                            "0 12px 25px rgba(55,108,168,0.20)",
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
                            width={75}
                            height={38}
                          />
                        ) : (
                          <Typography
                            variant="h5"
                            fontWeight={900}
                            color="#17263a"
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
                  label="Search users"
                  placeholder="Name, email, phone or ID"
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

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>

                  <Select
                    label="Status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="ALL">
                      All statuses
                    </MenuItem>

                    <MenuItem value="ACTIVE">
                      Active
                    </MenuItem>

                    <MenuItem value="INACTIVE">
                      Inactive
                    </MenuItem>

                    <MenuItem value="BLOCKED">
                      Blocked
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                variant="rounded"
                height={105}
                sx={{
                  borderRadius: "20px",
                }}
              />
            ))}
          </Stack>
        ) : filteredUsers.length === 0 ? (
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
                No users found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.7 }}
              >
                No users match the selected
                search and filter options.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.4}>
            {filteredUsers.map(
              (user, index) => {
                const status =
                  normalizeStatus(
                    user.status
                  );

                return (
                  <MotionCard
                    key={user.userId}
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
                      delay:
                        Math.min(
                          index * 0.035,
                          0.3
                        ),
                    }}
                    whileHover={{
                      y: -3,
                    }}
                    sx={glassCard}
                  >
                    <CardContent
                      sx={{
                        p: 2.25,

                        "&:last-child": {
                          pb: 2.25,
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
                            md: 4,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,

                                background:
                                  "linear-gradient(135deg, #4f46e5, #818cf8)",
                              }}
                            >
                              {user.fullName
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
                            </Avatar>

                            <Box>
                              <Typography
                                fontWeight={850}
                                color="#172033"
                              >
                                {user.fullName}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {user.email}
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
                            User ID
                          </Typography>

                          <Typography
                            fontWeight={750}
                          >
                            #{user.userId}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            md: 1.8,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Role
                          </Typography>

                          <Typography
                            fontWeight={750}
                          >
                            {formatLabel(
                              user.role
                            )}
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
                            Status
                          </Typography>

                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={formatLabel(
                                user.status
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
                          </Box>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            md: 1.8,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Registered
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={650}
                          >
                            {formatDate(
                              user.createdAt
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 12,
                            md: 1.2,
                          }}
                        >
                          <Stack spacing={0.8}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                loadingDetails ? (
                                  <CircularProgress
                                    size={15}
                                  />
                                ) : (
                                  <VisibilityRounded />
                                )
                              }
                              onClick={() =>
                                handleViewUser(
                                  user.userId
                                )
                              }
                              sx={{
                                borderRadius:
                                  "11px",
                              }}
                            >
                              View
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              startIcon={
                                <ManageAccountsRounded />
                              }
                              onClick={() =>
                                openStatusDialog(
                                  user
                                )
                              }
                              sx={{
                                borderRadius:
                                  "11px",
                              }}
                            >
                              Status
                            </Button>
                          </Stack>
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

      {/* User details dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() =>
          setDetailsOpen(false)
        }
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
            },
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={850}
              >
                User Details
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Account and access information
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setDetailsOpen(false)
              }
            >
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selectedUser && (
            <Stack spacing={2}>
              <Stack
                alignItems="center"
                sx={{ py: 1 }}
              >
                <Avatar
                  sx={{
                    width: 82,
                    height: 82,
                    mb: 1.5,
                    fontSize: 30,

                    background:
                      "linear-gradient(135deg, #4f46e5, #818cf8)",
                  }}
                >
                  {selectedUser.fullName
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </Avatar>

                <Typography
                  variant="h6"
                  fontWeight={850}
                >
                  {selectedUser.fullName}
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {selectedUser.email}
                </Typography>
              </Stack>

              {[
                [
                  "User ID",
                  `#${selectedUser.userId}`,
                ],
                [
                  "Phone",
                  selectedUser.phone ||
                    "Not available",
                ],
                [
                  "Role",
                  formatLabel(
                    selectedUser.role
                  ),
                ],
                [
                  "Status",
                  formatLabel(
                    selectedUser.status
                  ),
                ],
                [
                  "Registered",
                  formatDate(
                    selectedUser.createdAt
                  ),
                ],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    p: 1.8,
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 2,
                    borderRadius: "15px",
                    backgroundColor:
                      "#f8fafc",
                  }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    {label}
                  </Typography>

                  <Typography
                    fontWeight={750}
                    textAlign="right"
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() =>
              setDetailsOpen(false)
            }
          >
            Close
          </Button>

          <Button
            variant="contained"
            startIcon={
              <ManageAccountsRounded />
            }
            onClick={() => {
              setDetailsOpen(false);
              openStatusDialog(
                selectedUser
              );
            }}
          >
            Manage Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status update dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() =>
          !updatingStatus &&
          setStatusDialogOpen(false)
        }
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
            },
          },
        }}
      >
        <DialogTitle>
          <Typography
            variant="h6"
            fontWeight={850}
          >
            Update Account Status
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Select the new status for{" "}
            {selectedUser?.fullName}.
          </Typography>
        </DialogTitle>

        <DialogContent>
          <FormControl
            fullWidth
            sx={{ mt: 1 }}
          >
            <InputLabel>
              Account Status
            </InputLabel>

            <Select
              label="Account Status"
              value={newStatus}
              onChange={(event) =>
                setNewStatus(
                  event.target.value
                )
              }
            >
              <MenuItem value="ACTIVE">
                Active
              </MenuItem>

              <MenuItem value="INACTIVE">
                Inactive
              </MenuItem>

              <MenuItem value="BLOCKED">
                Blocked
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            color="inherit"
            disabled={updatingStatus}
            onClick={() =>
              setStatusDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              updatingStatus ||
              !newStatus
            }
            onClick={handleUpdateStatus}
          >
            {updatingStatus
              ? "Updating..."
              : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UsersPage;