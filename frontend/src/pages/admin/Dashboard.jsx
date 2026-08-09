import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWalletRounded,
  CheckCircleRounded,
  PendingActionsRounded,
  ReceiptLongRounded,
  GroupsRounded,
  BarChartRounded,
  ArrowForwardRounded,
  DashboardRounded,
} from "@mui/icons-material";

import api from "../../api/axiosConfig";
import { useAuth } from "../../contexts/AuthContext";

/* =========================================================
   CARD STYLE
========================================================= */

const glassCard = {
  borderRadius: "24px",
  border: "1px solid rgba(148, 163, 184, 0.12)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
};

/* =========================================================
   FORMAT CURRENCY
========================================================= */

const formatCurrency = (value) => {
  const numberValue = Number(value || 0);

  return `LKR ${numberValue.toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;
};

/* =========================================================
   STATUS COLOR
========================================================= */

const getStatusColor = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  switch (normalizedStatus) {
    case "PAID":
    case "COMPLETED":
    case "SUCCESS":
    case "SUCCESSFUL":
      return "success";

    case "PENDING":
      return "warning";

    case "REJECTED":
    case "FAILED":
      return "error";

    case "PARTIALLY_PAID":
      return "info";

    default:
      return "default";
  }
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  icon,
  title,
  value,
  subtitle,
  iconBackground,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        ...glassCard,
        height: "100%",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2.5,
            md: 3,
          },
          "&:last-child": {
            pb: {
              xs: 2.5,
              md: 3,
            },
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
              width: 64,
              height: 64,
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#ffffff",
              background: iconBackground,
              boxShadow:
                "0 12px 24px rgba(15, 23, 42, 0.10)",

              "& svg": {
                fontSize: 30,
              },
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#334155",
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "1.55rem",
                  md: "1.8rem",
                },
                lineHeight: 1.2,
                mt: 0.4,
                color: "#172033",
                fontWeight: 500,
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                fontSize: "0.82rem",
                color: "#64748b",
                mt: 0.8,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

/* =========================================================
   QUICK ACTION BUTTON
========================================================= */

const QuickAction = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        borderRadius: "18px",
        border: "1px solid #a9c2ff",
        px: 2,
        py: 1.5,
        color: "#2563eb",
        backgroundColor: "#ffffff",

        "&:hover": {
          backgroundColor: "#f8faff",
          borderColor: "#7da2ff",
        },
      }}
    >
      <Box
        sx={{
          mr: 1.5,
          display: "flex",
          alignItems: "center",
          color: "#2563eb",
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          flex: 1,
          textAlign: "left",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontSize: "0.74rem",
            color: "#2563eb",
            mt: 0.2,
          }}
        >
          {description}
        </Typography>
      </Box>

      <ArrowForwardRounded
        sx={{
          fontSize: 19,
          opacity: 0.7,
        }}
      />
    </Button>
  );
};

/* =========================================================
   DASHBOARD
========================================================= */

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [summary, setSummary] = useState({});
  const [recentPayments, setRecentPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =======================================================
     ROLE CHECK
  ======================================================= */

  const role = user?.role || "";

  /*
   * Only ADMIN and FINANCE_OFFICER currently have
   * payment dashboard backend access.
   *
   * Other roles MUST NOT call payment APIs.
   */
  const canSeeFinanceData =
    role === "ADMIN" ||
    role === "FINANCE_OFFICER";

  const isAdmin = role === "ADMIN";

  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  useEffect(() => {
    /*
     * Sales Manager
     * Marketing Executive
     * Customer Relations Officer
     * Operations Manager
     *
     * do not have payment dashboard permission.
     *
     * Therefore stop here without calling the API.
     */
    if (!canSeeFinanceData) {
      setLoading(false);
      setErrorMessage("");
      setSummary({});
      setRecentPayments([]);

      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          summaryResponse,
          paymentsResponse,
        ] = await Promise.all([
          api.get(
            "/payments/dashboard-summary"
          ),

          api.get("/payments"),
        ]);

        setSummary(
          summaryResponse?.data || {}
        );

        const payments = Array.isArray(
          paymentsResponse?.data
        )
          ? paymentsResponse.data
          : [];

        /*
         * Sort newest payments first.
         */
        const sortedPayments = [...payments].sort(
          (a, b) => {
            const dateA = new Date(
              a.paymentDate || 0
            );

            const dateB = new Date(
              b.paymentDate || 0
            );

            return dateB - dateA;
          }
        );

        /*
         * Only display latest 5.
         */
        setRecentPayments(
          sortedPayments.slice(0, 5)
        );
      } catch (error) {
        console.error(
          "Unable to load dashboard:",
          error
        );

        setErrorMessage(
          error?.response?.data?.message ||
            "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [canSeeFinanceData]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      {/* ===================================================
          PAGE TITLE
      =================================================== */}

      <Box
        sx={{
          mb: 3.5,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            color: "#172033",
            fontSize: {
              xs: "2rem",
              md: "2.5rem",
            },
            lineHeight: 1.15,
          }}
        >
          Overview
        </Typography>

        <Typography
          sx={{
            mt: 0.8,
            color: "#334155",
            fontSize: {
              xs: "0.95rem",
              md: "1rem",
            },
          }}
        >
          Access the management functions available for
          your account.
        </Typography>
      </Box>

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "16px",
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* ===================================================
          ADMIN / FINANCE DASHBOARD
      =================================================== */}

      {canSeeFinanceData && (
        <>
          {/* SUMMARY CARDS */}

          <Grid
            container
            spacing={2.5}
            sx={{
              mb: 3,
            }}
          >
            <Grid
              size={{
                xs: 12,
                sm: 6,
                xl: 3,
              }}
            >
              <SummaryCard
                icon={
                  <AccountBalanceWalletRounded />
                }
                title="Total Payments"
                value={
                  summary.totalPayments ?? 0
                }
                subtitle="All recorded payments"
                iconBackground="linear-gradient(135deg, #2585e8, #52a8ff)"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                xl: 3,
              }}
            >
              <SummaryCard
                icon={<CheckCircleRounded />}
                title="Completed"
                value={
                  summary.paidPayments ?? 0
                }
                subtitle="Successfully verified"
                iconBackground="linear-gradient(135deg, #20ad84, #55d0ad)"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                xl: 3,
              }}
            >
              <SummaryCard
                icon={<PendingActionsRounded />}
                title="Awaiting Review"
                value={
                  summary.pendingPayments ?? 0
                }
                subtitle="Pending verification"
                iconBackground="linear-gradient(135deg, #f1a11f, #ffc65b)"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                xl: 3,
              }}
            >
              <SummaryCard
                icon={<ReceiptLongRounded />}
                title="Total Revenue"
                value={formatCurrency(
                  summary.totalRevenue
                )}
                subtitle="Verified payment value"
                iconBackground="linear-gradient(135deg, #7655e8, #9d82ff)"
              />
            </Grid>
          </Grid>

          {/* =================================================
              RECENT PAYMENTS + QUICK ACTIONS
          ================================================= */}

          <Grid
            container
            spacing={2.5}
          >
            {/* RECENT PAYMENTS */}

            <Grid
              size={{
                xs: 12,
                lg: isAdmin ? 8 : 9,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  ...glassCard,
                  height: "100%",
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2.5,
                      md: 3,
                    },

                    "&:last-child": {
                      pb: {
                        xs: 2.5,
                        md: 3,
                      },
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: "#172033",
                    }}
                  >
                    Recent Payments
                  </Typography>

                  <Typography
                    sx={{
                      color: "#64748b",
                      mt: 0.4,
                      mb: 2.5,
                      fontSize: "0.9rem",
                    }}
                  >
                    Latest payment activity across the
                    system.
                  </Typography>

                  {recentPayments.length === 0 ? (
                    <Typography
                      sx={{
                        color: "#64748b",
                        py: 2,
                      }}
                    >
                      No payment records available.
                    </Typography>
                  ) : (
                    <Stack spacing={1.3}>
                      {recentPayments.map(
                        (payment) => (
                          <Box
                            key={
                              payment.paymentId
                            }
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              border:
                                "1px solid #e5eaf2",
                              backgroundColor:
                                "#fbfcfe",
                              display: "flex",
                              alignItems: {
                                xs: "flex-start",
                                sm: "center",
                              },
                              justifyContent:
                                "space-between",
                              flexDirection: {
                                xs: "column",
                                sm: "row",
                              },
                              gap: 1.5,
                            }}
                          >
                            <Box>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    color:
                                      "#334155",
                                  }}
                                >
                                  {payment.paymentReference ||
                                    `PAY-${String(
                                      payment.paymentId
                                    ).padStart(
                                      3,
                                      "0"
                                    )}`}
                                </Typography>

                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    color:
                                      "#334155",
                                  }}
                                >
                                  {formatCurrency(
                                    payment.amount
                                  )}
                                </Typography>
                              </Stack>

                              <Typography
                                sx={{
                                  mt: 0.5,
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "0.8rem",
                                }}
                              >
                                {payment.paymentType ||
                                  "Payment"}
                              </Typography>
                            </Box>

                            <Chip
                              label={
                                payment.paymentStatus ||
                                "Unknown"
                              }
                              color={getStatusColor(
                                payment.paymentStatus
                              )}
                              size="small"
                              sx={{
                                minWidth: 90,
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                        )
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* QUICK ACTIONS */}

            <Grid
              size={{
                xs: 12,
                lg: isAdmin ? 4 : 3,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  ...glassCard,
                  height: "100%",
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2.5,
                      md: 3,
                    },

                    "&:last-child": {
                      pb: {
                        xs: 2.5,
                        md: 3,
                      },
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: "#172033",
                    }}
                  >
                    Quick Actions
                  </Typography>

                  <Typography
                    sx={{
                      color: "#64748b",
                      mt: 0.4,
                      mb: 2.5,
                      fontSize: "0.9rem",
                    }}
                  >
                    Open frequently used management
                    functions.
                  </Typography>

                  <Stack spacing={1.3}>
                    {/* ADMIN ONLY */}

                    {isAdmin && (
                      <QuickAction
                        icon={<GroupsRounded />}
                        title="Manage Users and Staff"
                        description="View accounts, staff records and access"
                        onClick={() =>
                          navigate(
                            "/admin/users-staff/users"
                          )
                        }
                      />
                    )}

                    {/* ADMIN + FINANCE */}

                    <QuickAction
                      icon={
                        <AccountBalanceWalletRounded />
                      }
                      title="Payment and Transaction"
                      description="Review payments and financial transactions"
                      onClick={() =>
                        navigate(
                          "/admin/payment-transaction/payments"
                        )
                      }
                    />

                    <QuickAction
                      icon={<BarChartRounded />}
                      title="View Reports"
                      description="Open financial and operational analytics"
                      onClick={() =>
                        navigate(
                          "/admin/reports"
                        )
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* ===================================================
          OTHER STAFF ROLES
          
          No payment API calls.
          No fake statistics.
          No Access Denied message.
      =================================================== */}

      {!canSeeFinanceData && (
        <Card
          elevation={0}
          sx={{
            ...glassCard,
            maxWidth: 850,
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 3,
                md: 4,
              },

              "&:last-child": {
                pb: {
                  xs: 3,
                  md: 4,
                },
              },
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2.5}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                  background:
                    "linear-gradient(135deg, #4f46e5, #818cf8)",
                  boxShadow:
                    "0 12px 25px rgba(79,70,229,0.20)",
                }}
              >
                <DashboardRounded
                  sx={{
                    fontSize: 32,
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: "#172033",
                  }}
                >
                  Welcome to Skyline Living
                </Typography>

                <Typography
                  sx={{
                    color: "#64748b",
                    mt: 0.8,
                    lineHeight: 1.7,
                  }}
                >
                  Use the navigation menu to access the
                  management functions available for your
                  role.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdminDashboard;