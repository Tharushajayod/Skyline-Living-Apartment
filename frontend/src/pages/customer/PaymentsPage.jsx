import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  AccountBalanceWalletRounded,
  CheckCircleRounded,
  CloudUploadRounded,
  FilterListRounded,
  OpenInNewRounded,
  PendingActionsRounded,
  ReceiptLongRounded,
  SearchRounded,
} from "@mui/icons-material";

import {
  Alert,
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

import api from "../../api/axiosConfig";

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

const paymentStatusColors = {
  PAID: "success",
  PENDING: "warning",
  REJECTED: "error",
  PARTIALLY_PAID: "info",
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const formatLabel = (value) => {
  if (!value) {
    return "Not available";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const PaymentsPage = () => {
  const navigate = useNavigate();

  const [payments, setPayments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const [sortOrder, setSortOrder] =
    useState("NEWEST");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get(
        "/payments/my-payments"
      );

      setPayments(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Unable to load payments:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load your payments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const paymentTypes = useMemo(() => {
    return [
      ...new Set(
        payments
          .map(
            (payment) =>
              payment.paymentType
          )
          .filter(Boolean)
      ),
    ];
  }, [payments]);

  const summary = useMemo(() => {
    const paidPayments = payments.filter(
      (payment) =>
        payment.paymentStatus === "PAID"
    );

    const pendingPayments =
      payments.filter(
        (payment) =>
          payment.paymentStatus ===
          "PENDING"
      );

    const totalPaid =
      paidPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    return {
      totalPayments: payments.length,
      completedPayments:
        paidPayments.length,
      pendingPayments:
        pendingPayments.length,
      verifiedAmount: totalPaid,
    };
  }, [payments]);

  const summaryCards = [
    {
      title: "Total payments",
      value: summary.totalPayments,
      subtitle: "All submitted payments",

      icon: (
        <AccountBalanceWalletRounded />
      ),

      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },

    {
      title: "Completed",
      value: summary.completedPayments,
      subtitle: "Successfully verified",

      icon: <CheckCircleRounded />,

      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },

    {
      title: "Awaiting review",
      value: summary.pendingPayments,
      subtitle: "Pending verification",

      icon: <PendingActionsRounded />,

      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },

    {
      title: "Verified amount",

      value: `LKR ${summary.verifiedAmount.toLocaleString()}`,

      subtitle: "Total verified value",

      icon: <ReceiptLongRounded />,

      gradient:
        "linear-gradient(145deg, #7356d9, #a793ff)",
    },
  ];

  const filteredPayments = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    const matchingPayments =
      payments.filter((payment) => {
        const searchableValues = [
          payment.paymentReference,
          payment.paymentType,
          payment.paymentMethod,
          payment.paymentStatus,
        ]
          .filter(Boolean)
          .map((value) =>
            value.toLowerCase()
          );

        const matchesSearch =
          !normalizedSearch ||
          searchableValues.some((value) =>
            value.includes(
              normalizedSearch
            )
          );

        const matchesStatus =
          statusFilter === "ALL" ||
          payment.paymentStatus ===
            statusFilter;

        const matchesType =
          typeFilter === "ALL" ||
          payment.paymentType ===
            typeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );
      });

    return [...matchingPayments].sort(
      (firstPayment, secondPayment) => {
        const firstDate =
          new Date(
            firstPayment.paymentDate || 0
          ).getTime() || 0;

        const secondDate =
          new Date(
            secondPayment.paymentDate ||
              0
          ).getTime() || 0;

        if (sortOrder === "OLDEST") {
          return firstDate - secondDate;
        }

        return secondDate - firstDate;
      }
    );
  }, [
    payments,
    searchText,
    statusFilter,
    typeFilter,
    sortOrder,
  ]);

  return (
    <Stack
      spacing={3}
      sx={{
        maxWidth: 1500,
        mx: "auto",
      }}
    >
      {/* Page heading */}
      <Box>
        <Typography
          variant="h4"
          fontWeight={900}
          color="#172033"
          sx={{
            letterSpacing: "-0.7px",
          }}
        >
          My Payments
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.7 }}
        >
          Review your submitted payments and
          verification status.
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

      {/* Dashboard-matching summary cards */}
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
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.07,
                  duration: 0.4,
                }}
                whileHover={{
                  y: -5,
                  scale: 1.012,
                }}
                whileTap={{
                  scale: 0.985,
                }}
                sx={{
                  ...glassCard,

                  height: "100%",

                  cursor: "default",

                  transition:
                    "box-shadow 180ms ease",

                  "&:hover": {
                    boxShadow:
                      "0 24px 65px rgba(70,112,156,0.18)",
                  },
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

                        borderRadius: "18px",

                        display: "grid",
                        placeItems: "center",

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
                          width={100}
                          height={38}
                        />
                      ) : (
                        <Typography
                          variant="h5"
                          fontWeight={900}
                          color="#17263a"
                          sx={{ mt: 0.3 }}
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

      {/* Filters */}
      <Card
        elevation={0}
        sx={glassCard}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.25,
              sm: 2.75,
            },

            "&:last-child": {
              pb: {
                xs: 2.25,
                sm: 2.75,
              },
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 2.25 }}
          >
            <FilterListRounded
              color="primary"
            />

            <Typography
              fontWeight={800}
              color="#172033"
            >
              Search and filter
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                fullWidth
                label="Search payments"
                placeholder="Reference, type or method"
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
                sm: 4,
                md: 2.66,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Status
                </InputLabel>

                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="ALL">
                    All statuses
                  </MenuItem>

                  <MenuItem value="PENDING">
                    Pending
                  </MenuItem>

                  <MenuItem value="PAID">
                    Paid
                  </MenuItem>

                  <MenuItem value="REJECTED">
                    Rejected
                  </MenuItem>

                  <MenuItem value="PARTIALLY_PAID">
                    Partially Paid
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 4,
                md: 2.66,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Payment type
                </InputLabel>

                <Select
                  value={typeFilter}
                  label="Payment type"
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="ALL">
                    All payment types
                  </MenuItem>

                  {paymentTypes.map(
                    (paymentType) => (
                      <MenuItem
                        key={paymentType}
                        value={paymentType}
                      >
                        {formatLabel(
                          paymentType
                        )}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 4,
                md: 2.66,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Sort
                </InputLabel>

                <Select
                  value={sortOrder}
                  label="Sort"
                  onChange={(event) =>
                    setSortOrder(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="NEWEST">
                    Newest first
                  </MenuItem>

                  <MenuItem value="OLDEST">
                    Oldest first
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payment records */}
      <Stack spacing={1.5}>
        {loading ? (
          [1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={145}
              sx={{
                borderRadius: "22px",
              }}
            />
          ))
        ) : filteredPayments.length ===
          0 ? (
          <Card
            elevation={0}
            sx={{
              ...glassCard,

              textAlign: "center",
            }}
          >
            <CardContent
              sx={{
                py: 8,

                "&:last-child": {
                  pb: 8,
                },
              }}
            >
              <Typography
                variant="h6"
                fontWeight={850}
                color="#172033"
              >
                No payments found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.7 }}
              >
                There are no payment records
                matching your current filters.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map(
            (payment, index) => (
              <MotionCard
                key={payment.paymentId}
                elevation={0}
                initial={{
                  opacity: 0,
                  y: 14,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.04,
                }}
                whileHover={{
                  y: -3,
                }}
                sx={glassCard}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2.25,
                      sm: 2.75,
                    },

                    "&:last-child": {
                      pb: {
                        xs: 2.25,
                        sm: 2.75,
                      },
                    },
                  }}
                >
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid
                      size={{
                        xs: 12,
                        md: 4,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Payment Reference
                      </Typography>

                      <Typography
                        fontWeight={850}
                        color="#172033"
                        sx={{ mt: 0.4 }}
                      >
                        {payment.paymentReference ||
                          "Not available"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {formatLabel(
                          payment.paymentType
                        )}
                      </Typography>
                    </Grid>

                    <Grid
                      size={{
                        xs: 6,
                        md: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Amount
                      </Typography>

                      <Typography
                        fontWeight={800}
                        color="#172033"
                        sx={{ mt: 0.4 }}
                      >
                        LKR{" "}
                        {Number(
                          payment.amount || 0
                        ).toLocaleString()}
                      </Typography>
                    </Grid>

                    <Grid
                      size={{
                        xs: 6,
                        md: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Status
                      </Typography>

                      <Box sx={{ mt: 0.6 }}>
                        <Chip
                          size="small"
                          label={formatLabel(
                            payment.paymentStatus
                          )}
                          color={
                            paymentStatusColors[
                              payment
                                .paymentStatus
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
                        xs: 12,
                        md: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Submitted
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={650}
                        color="#445268"
                        sx={{ mt: 0.4 }}
                      >
                        {formatDate(
                          payment.paymentDate
                        )}
                      </Typography>
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        md: 2,
                      }}
                    >
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={
                            <OpenInNewRounded />
                          }
                          onClick={() =>
                            navigate(
                              `/customer/payments/${payment.paymentId}`
                            )
                          }
                          sx={{
                            minHeight: 38,
                            borderRadius: "12px",
                          }}
                        >
                          View details
                        </Button>

                        {payment.paymentStatus ===
                          "PENDING" && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              <CloudUploadRounded />
                            }
                            onClick={() =>
                              navigate(
                                `/customer/payments/${payment.paymentId}/evidence`
                              )
                            }
                            sx={{
                              minHeight: 38,
                              borderRadius:
                                "12px",
                            }}
                          >
                            Upload evidence
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>

                  {payment.rejectionReason && (
                    <Alert
                      severity="error"
                      sx={{
                        mt: 2,
                        borderRadius: "14px",
                      }}
                    >
                      {payment.rejectionReason}
                    </Alert>
                  )}
                </CardContent>
              </MotionCard>
            )
          )
        )}
      </Stack>
    </Stack>
  );
};

export default PaymentsPage;