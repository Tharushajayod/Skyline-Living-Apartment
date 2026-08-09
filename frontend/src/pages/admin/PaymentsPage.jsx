import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  AccountBalanceWalletRounded,
  CheckCircleRounded,
  CloseRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  FilterListRounded,
  ManageSearchRounded,
  OpenInNewRounded,
  PendingActionsRounded,
  ReceiptLongRounded,
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
  Divider,
  FormControl,
  FormHelperText,
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

import adminPaymentService from "../../services/adminPaymentService";

const MotionCard = motion.create(Card);

const glassCard = {
  borderRadius: "22px",

  background:
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.90))",

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatMoney = (value) =>
  `LKR ${Number(value || 0).toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;

const InformationRow = ({
  label,
  value,
}) => (
  <Box
    sx={{
      p: 1.7,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 2,
      borderRadius: "15px",

      backgroundColor:
        "rgba(248,250,252,0.9)",

      border:
        "1px solid rgba(148,163,184,0.12)",
    }}
  >
    <Typography
      variant="body2"
      color="text.secondary"
    >
      {label}
    </Typography>

    <Typography
      variant="body2"
      fontWeight={750}
      color="#172033"
      textAlign="right"
      sx={{
        wordBreak: "break-word",
      }}
    >
      {value || "Not available"}
    </Typography>
  </Box>
);

const AdminPaymentsPage = () => {
  const [payments, setPayments] =
    useState([]);

  const [summary, setSummary] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    rejectedPayments: 0,
    partiallyPaidPayments: 0,
    totalRevenue: 0,
    totalOutstandingAmount: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const [methodFilter, setMethodFilter] =
    useState("ALL");

  const [sortOrder, setSortOrder] =
    useState("NEWEST");

  const [
    selectedPayment,
    setSelectedPayment,
  ] = useState(null);

  const [
    paymentDetails,
    setPaymentDetails,
  ] = useState(null);

  const [
    detailsDialogOpen,
    setDetailsDialogOpen,
  ] = useState(false);

  const [
    loadingDetails,
    setLoadingDetails,
  ] = useState(false);

  const [
    reviewDialogOpen,
    setReviewDialogOpen,
  ] = useState(false);

  const [newStatus, setNewStatus] =
    useState("");

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    partialPaidAmount,
    setPartialPaidAmount,
  ] = useState("");

  const [reviewError, setReviewError] =
    useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [
    deletingPayment,
    setDeletingPayment,
  ] = useState(false);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        paymentData,
        summaryData,
      ] = await Promise.all([
        adminPaymentService.getAllPayments(),

        adminPaymentService
          .getDashboardSummary(),
      ]);

      setPayments(paymentData);
      setSummary(summaryData || {});
    } catch (error) {
      console.error(
        "Unable to load payments:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const paymentTypes = useMemo(
    () => [
      ...new Set(
        payments
          .map(
            (payment) =>
              payment.paymentType
          )
          .filter(Boolean)
      ),
    ],
    [payments]
  );

  const paymentMethods = useMemo(
    () => [
      ...new Set(
        payments
          .map(
            (payment) =>
              payment.paymentMethod
          )
          .filter(Boolean)
      ),
    ],
    [payments]
  );

  const summaryCards = [
    {
      title: "Total Payments",
      value: summary.totalPayments || 0,
      subtitle: "All payment records",
      icon: (
        <AccountBalanceWalletRounded />
      ),

      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },
    {
      title: "Completed",
      value: summary.paidPayments || 0,
      subtitle: "Verified payments",
      icon: <CheckCircleRounded />,

      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },
    {
      title: "Awaiting Review",
      value: summary.pendingPayments || 0,
      subtitle: "Pending verification",
      icon: <PendingActionsRounded />,

      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
    {
      title: "Total Revenue",

      value: formatMoney(
        summary.totalRevenue
      ),

      subtitle: "Verified payment value",
      icon: <ReceiptLongRounded />,

      gradient:
        "linear-gradient(145deg, #7356d9, #a793ff)",
    },
  ];

  const filteredPayments = useMemo(() => {
    const search =
      searchText.trim().toLowerCase();

    const result = payments.filter(
      (payment) => {
        const searchableValues = [
          payment.paymentReference,
          payment.paymentType,
          payment.paymentMethod,
          payment.paymentStatus,
          payment.customerId,
          payment.verifiedByName,
          payment.remarks,
        ]
          .filter(
            (value) =>
              value !== null &&
              value !== undefined
          )
          .map((value) =>
            String(value).toLowerCase()
          );

        const matchesSearch =
          !search ||
          searchableValues.some((value) =>
            value.includes(search)
          );

        const matchesStatus =
          statusFilter === "ALL" ||
          normalizeStatus(
            payment.paymentStatus
          ) === statusFilter;

        const matchesType =
          typeFilter === "ALL" ||
          payment.paymentType ===
            typeFilter;

        const matchesMethod =
          methodFilter === "ALL" ||
          payment.paymentMethod ===
            methodFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType &&
          matchesMethod
        );
      }
    );

    return [...result].sort(
      (first, second) => {
        const firstDate =
          new Date(
            first.paymentDate || 0
          ).getTime() || 0;

        const secondDate =
          new Date(
            second.paymentDate || 0
          ).getTime() || 0;

        return sortOrder === "OLDEST"
          ? firstDate - secondDate
          : secondDate - firstDate;
      }
    );
  }, [
    payments,
    searchText,
    statusFilter,
    typeFilter,
    methodFilter,
    sortOrder,
  ]);

  const handleViewDetails = async (
    payment
  ) => {
    try {
      setSelectedPayment(payment);
      setDetailsDialogOpen(true);
      setLoadingDetails(true);
      setPaymentDetails(null);
      setErrorMessage("");

      const data =
        await adminPaymentService
          .getPaymentDetails(
            payment.paymentId
          );

      setPaymentDetails(data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load payment details."
      );

      setDetailsDialogOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openReviewDialog = (payment) => {
    setSelectedPayment(payment);
    setNewStatus("");
    setRejectionReason("");
    setPartialPaidAmount("");
    setReviewError("");
    setReviewDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    setReviewError("");

    if (!newStatus) {
      setReviewError(
        "Select the new payment status."
      );

      return;
    }

    if (
      newStatus === "REJECTED" &&
      !rejectionReason.trim()
    ) {
      setReviewError(
        "A rejection reason is required."
      );

      return;
    }

    if (
      newStatus === "PARTIALLY_PAID"
    ) {
      const receivedAmount = Number(
        partialPaidAmount
      );

      if (
        !partialPaidAmount ||
        Number.isNaN(receivedAmount) ||
        receivedAmount <= 0
      ) {
        setReviewError(
          "Enter a valid partial payment amount."
        );

        return;
      }

      const currentPaid = Number(
        selectedPayment?.paidAmount || 0
      );

      const totalPayable = Number(
        selectedPayment
          ?.totalPayableAmount ||
          selectedPayment?.amount ||
          0
      );

      if (
        currentPaid + receivedAmount >=
        totalPayable
      ) {
        setReviewError(
          "The new paid total must be less than the total payable amount. Select Paid for the full payment."
        );

        return;
      }
    }

    try {
      setUpdatingStatus(true);

      const updatedPayment =
        await adminPaymentService
          .updatePaymentStatus(
            selectedPayment.paymentId,
            newStatus,
            rejectionReason,
            partialPaidAmount
          );

      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.paymentId ===
          updatedPayment.paymentId
            ? updatedPayment
            : payment
        )
      );

      setReviewDialogOpen(false);

      setSuccessMessage(
        `Payment ${
          updatedPayment.paymentReference
        } changed to ${formatLabel(
          updatedPayment.paymentStatus
        )}.`
      );

      const newSummary =
        await adminPaymentService
          .getDashboardSummary();

      setSummary(newSummary || {});
    } catch (error) {
      console.error(
        "Unable to update payment status:",
        error
      );

      setReviewError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update payment status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openDeleteDialog = (payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment?.paymentId) {
      return;
    }

    try {
      setDeletingPayment(true);

      await adminPaymentService
        .deletePayment(
          selectedPayment.paymentId
        );

      setPayments((currentPayments) =>
        currentPayments.filter(
          (payment) =>
            payment.paymentId !==
            selectedPayment.paymentId
        )
      );

      setDeleteDialogOpen(false);

      setSuccessMessage(
        "Payment record deleted successfully."
      );

      const newSummary =
        await adminPaymentService
          .getDashboardSummary();

      setSummary(newSummary || {});
    } catch (error) {
      console.error(
        "Unable to delete payment:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to delete payment record. It may have related transactions or evidence."
      );
    } finally {
      setDeletingPayment(false);
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
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
            color="#172033"
          >
            Payment Management
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.65 }}
          >
            Review, verify and manage all customer payment records.
          </Typography>
        </Box>

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
                            width={95}
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

        <Card
          elevation={0}
          sx={glassCard}
        >
          <CardContent
            sx={{
              p: 2.75,

              "&:last-child": {
                pb: 2.75,
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
                fontWeight={850}
                color="#172033"
              >
                Search and filter
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  lg: 4,
                }}
              >
                <TextField
                  fullWidth
                  label="Search payments"
                  placeholder="Reference, customer ID, verifier or remarks"
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
                  lg: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>
                    Status
                  </InputLabel>

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

                    <MenuItem value="PENDING">
                      Pending
                    </MenuItem>

                    <MenuItem value="PAID">
                      Paid
                    </MenuItem>

                    <MenuItem value="PARTIALLY_PAID">
                      Partially Paid
                    </MenuItem>

                    <MenuItem value="REJECTED">
                      Rejected
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>
                    Payment Type
                  </InputLabel>

                  <Select
                    label="Payment Type"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="ALL">
                      All types
                    </MenuItem>

                    {paymentTypes.map(
                      (type) => (
                        <MenuItem
                          key={type}
                          value={type}
                        >
                          {formatLabel(type)}
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
                  lg: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>
                    Method
                  </InputLabel>

                  <Select
                    label="Method"
                    value={methodFilter}
                    onChange={(event) =>
                      setMethodFilter(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="ALL">
                      All methods
                    </MenuItem>

                    {paymentMethods.map(
                      (method) => (
                        <MenuItem
                          key={method}
                          value={method}
                        >
                          {formatLabel(
                            method
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
                  sm: 6,
                  lg: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>
                    Sort
                  </InputLabel>

                  <Select
                    label="Sort"
                    value={sortOrder}
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

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4].map(
              (item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={130}
                  sx={{
                    borderRadius: "21px",
                  }}
                />
              )
            )}
          </Stack>
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
              <ManageSearchRounded
                sx={{
                  fontSize: 52,
                  color: "#94a3b8",
                }}
              />

              <Typography
                variant="h6"
                fontWeight={850}
                sx={{ mt: 1 }}
              >
                No payments found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.7 }}
              >
                No payment records match the
                selected filters.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.4}>
            {filteredPayments.map(
              (payment, index) => {
                const status =
                  normalizeStatus(
                    payment.paymentStatus
                  );

                const canReview =
                  status === "PENDING" ||
                  status ===
                    "PARTIALLY_PAID";

                return (
                  <MotionCard
                    key={payment.paymentId}
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
                        p: 2.4,

                        "&:last-child": {
                          pb: 2.4,
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
                            lg: 3,
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
                                color: "#2563eb",

                                background:
                                  "rgba(37,99,235,0.10)",
                              }}
                            >
                              <ReceiptLongRounded />
                            </Avatar>

                            <Box>
                              <Typography
                                fontWeight={850}
                                color="#172033"
                              >
                                {payment.paymentReference ||
                                  `Payment #${payment.paymentId}`}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Customer #
                                {payment.customerId ||
                                  "N/A"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            sm: 3,
                            lg: 1.4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Amount
                          </Typography>

                          <Typography
                            fontWeight={850}
                            color="#172033"
                          >
                            {formatMoney(
                              payment
                                .totalPayableAmount ||
                                payment.amount
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            sm: 3,
                            lg: 1.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Type
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={700}
                          >
                            {formatLabel(
                              payment.paymentType
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            sm: 3,
                            lg: 1.4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Method
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={700}
                          >
                            {formatLabel(
                              payment.paymentMethod
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            sm: 3,
                            lg: 1.4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Status
                          </Typography>

                          <Box sx={{ mt: 0.45 }}>
                            <Chip
                              size="small"
                              label={formatLabel(
                                payment.paymentStatus
                              )}
                              color={
                                paymentStatusColors[
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
                            xs: 12,
                            sm: 6,
                            lg: 1.8,
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
                          >
                            {formatDate(
                              payment.paymentDate
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 12,
                            sm: 6,
                            lg: 1.5,
                          }}
                        >
                          <Stack spacing={0.75}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <VisibilityRounded />
                              }
                              onClick={() =>
                                handleViewDetails(
                                  payment
                                )
                              }
                              sx={{
                                borderRadius:
                                  "11px",
                              }}
                            >
                              Details
                            </Button>

                            {canReview && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={
                                  <CheckCircleRounded />
                                }
                                onClick={() =>
                                  openReviewDialog(
                                    payment
                                  )
                                }
                                sx={{
                                  borderRadius:
                                    "11px",
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </Stack>
                        </Grid>

                        <Grid
                          size={{
                            xs: 12,
                            lg: 0.5,
                          }}
                        >
                          <IconButton
                            color="error"
                            onClick={() =>
                              openDeleteDialog(
                                payment
                              )
                            }
                            sx={{
                              border:
                                "1px solid rgba(220,38,38,0.16)",

                              "&:hover": {
                                backgroundColor:
                                  "rgba(220,38,38,0.08)",
                              },
                            }}
                          >
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Grid>
                      </Grid>

                      {status ===
                        "PARTIALLY_PAID" && (
                        <Alert
                          severity="info"
                          sx={{
                            mt: 2,
                            borderRadius:
                              "14px",
                          }}
                        >
                          Paid:{" "}
                          <strong>
                            {formatMoney(
                              payment.paidAmount
                            )}
                          </strong>
                          {" · "}
                          Outstanding:{" "}
                          <strong>
                            {formatMoney(
                              payment.outstandingAmount
                            )}
                          </strong>
                        </Alert>
                      )}

                      {payment.rejectionReason && (
                        <Alert
                          severity="error"
                          sx={{
                            mt: 2,
                            borderRadius:
                              "14px",
                          }}
                        >
                          Rejection reason:{" "}
                          {
                            payment.rejectionReason
                          }
                        </Alert>
                      )}
                    </CardContent>
                  </MotionCard>
                );
              }
            )}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={detailsDialogOpen}
        onClose={() =>
          setDetailsDialogOpen(false)
        }
        fullWidth
        maxWidth="md"
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
                Payment Details
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Payment, evidence and related
                transaction information.
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setDetailsDialogOpen(false)
              }
            >
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {loadingDetails ? (
            <Stack spacing={1.5}>
              {[1, 2, 3, 4].map(
                (item) => (
                  <Skeleton
                    key={item}
                    variant="rounded"
                    height={64}
                    sx={{
                      borderRadius: "15px",
                    }}
                  />
                )
              )}
            </Stack>
          ) : paymentDetails ? (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <Stack spacing={1.2}>
                    <InformationRow
                      label="Payment ID"
                      value={`#${paymentDetails.payment?.paymentId}`}
                    />

                    <InformationRow
                      label="Customer ID"
                      value={`#${paymentDetails.payment?.customerId}`}
                    />

                    <InformationRow
                      label="Payment Reference"
                      value={
                        paymentDetails.payment
                          ?.paymentReference
                      }
                    />

                    <InformationRow
                      label="Total Payable"
                      value={formatMoney(
                        paymentDetails.payment
                          ?.totalPayableAmount ||
                          paymentDetails.payment
                            ?.amount
                      )}
                    />

                    <InformationRow
                      label="Paid Amount"
                      value={formatMoney(
                        paymentDetails.payment
                          ?.paidAmount
                      )}
                    />

                    <InformationRow
                      label="Outstanding Amount"
                      value={formatMoney(
                        paymentDetails.payment
                          ?.outstandingAmount
                      )}
                    />

                    <InformationRow
                      label="Payment Type"
                      value={formatLabel(
                        paymentDetails.payment
                          ?.paymentType
                      )}
                    />
                  </Stack>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <Stack spacing={1.2}>
                    <InformationRow
                      label="Payment Method"
                      value={formatLabel(
                        paymentDetails.payment
                          ?.paymentMethod
                      )}
                    />

                    <InformationRow
                      label="Status"
                      value={formatLabel(
                        paymentDetails.payment
                          ?.paymentStatus
                      )}
                    />

                    <InformationRow
                      label="Submitted"
                      value={formatDate(
                        paymentDetails.payment
                          ?.paymentDate
                      )}
                    />

                    <InformationRow
                      label="Verified By"
                      value={
                        paymentDetails.payment
                          ?.verifiedByName ||
                        "Not verified"
                      }
                    />

                    <InformationRow
                      label="Verified Date"
                      value={formatDate(
                        paymentDetails.payment
                          ?.verifiedAt
                      )}
                    />
                  </Stack>
                </Grid>
              </Grid>

              {paymentDetails.payment
                ?.remarks && (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "15px",
                  }}
                >
                  Remarks:{" "}
                  {
                    paymentDetails.payment
                      .remarks
                  }
                </Alert>
              )}

              {paymentDetails.payment
                ?.rejectionReason && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "15px",
                  }}
                >
                  Rejection reason:{" "}
                  {
                    paymentDetails.payment
                      .rejectionReason
                  }
                </Alert>
              )}

              <Divider />

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={850}
                >
                  Payment Evidence
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.4,
                    mb: 1.5,
                  }}
                >
                  Files uploaded as proof of
                  payment.
                </Typography>

                {paymentDetails.evidence
                  ?.length ? (
                  <Stack spacing={1.1}>
                    {paymentDetails.evidence.map(
                      (evidence) => (
                        <Box
                          key={
                            evidence.paymentEvidenceId
                          }
                          sx={{
                            p: 1.7,
                            display: "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "space-between",

                            gap: 2,

                            borderRadius:
                              "15px",

                            backgroundColor:
                              "#f8fafc",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                          >
                            <DescriptionRounded
                              color="primary"
                            />

                            <Box>
                              <Typography
                                fontWeight={750}
                              >
                                {
                                  evidence.fileName
                                }
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Uploaded by{" "}
                                {evidence.uploadedByName ||
                                  "Customer"}
                              </Typography>
                            </Box>
                          </Stack>

                          <IconButton
                            color="primary"
                            component="a"
                            href={
                              evidence.fileUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            <OpenInNewRounded />
                          </IconButton>
                        </Box>
                      )
                    )}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    No evidence files available.
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={850}
                >
                  Related Transactions
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.4,
                    mb: 1.5,
                  }}
                >
                  Transactions generated from
                  this payment.
                </Typography>

                {paymentDetails.transactions
                  ?.length ? (
                  <Stack spacing={1.1}>
                    {paymentDetails.transactions.map(
                      (transaction) => (
                        <Box
                          key={
                            transaction.transactionId
                          }
                          sx={{
                            p: 1.7,
                            borderRadius:
                              "15px",

                            backgroundColor:
                              "#f8fafc",
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Box>
                              <Typography
                                fontWeight={800}
                              >
                                {
                                  transaction.transactionNumber
                                }
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Receipt:{" "}
                                {
                                  transaction.receiptNumber
                                }
                              </Typography>
                            </Box>

                            <Box
                              textAlign="right"
                            >
                              <Typography
                                fontWeight={850}
                              >
                                {formatMoney(
                                  transaction.transactionAmount
                                )}
                              </Typography>

                              <Chip
                                size="small"
                                label={formatLabel(
                                  transaction.transactionStatus
                                )}
                                color={
                                  transaction.transactionStatus ===
                                  "SUCCESS"
                                    ? "success"
                                    : "default"
                                }
                              />
                            </Box>
                          </Stack>
                        </Box>
                      )
                    )}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    No related transactions
                    available.
                  </Typography>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            color="inherit"
            onClick={() =>
              setDetailsDialogOpen(false)
            }
          >
            Close
          </Button>

          {[
            "PENDING",
            "PARTIALLY_PAID",
          ].includes(
            normalizeStatus(
              paymentDetails?.payment
                ?.paymentStatus
            )
          ) && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailsDialogOpen(false);

                openReviewDialog(
                  paymentDetails.payment
                );
              }}
            >
              Review Payment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewDialogOpen}
        onClose={() =>
          !updatingStatus &&
          setReviewDialogOpen(false)
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
          <Typography
            variant="h6"
            fontWeight={850}
          >
            Review Payment
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {selectedPayment?.paymentReference}{" "}
            ·{" "}
            {formatMoney(
              selectedPayment
                ?.totalPayableAmount ||
                selectedPayment?.amount
            )}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2.2}
            sx={{ mt: 1 }}
          >
            {reviewError && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: "14px",
                }}
              >
                {reviewError}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>
                New Payment Status
              </InputLabel>

              <Select
                label="New Payment Status"
                value={newStatus}
                onChange={(event) => {
                  const statusValue =
                    event.target.value;

                  setNewStatus(statusValue);
                  setReviewError("");

                  if (
                    statusValue !==
                    "REJECTED"
                  ) {
                    setRejectionReason("");
                  }

                  if (
                    statusValue !==
                    "PARTIALLY_PAID"
                  ) {
                    setPartialPaidAmount(
                      ""
                    );
                  }
                }}
              >
                <MenuItem value="PAID">
                  Paid
                </MenuItem>

                <MenuItem value="PARTIALLY_PAID">
                  Partially Paid
                </MenuItem>

                {normalizeStatus(
                  selectedPayment?.paymentStatus
                ) === "PENDING" && (
                  <MenuItem value="REJECTED">
                    Rejected
                  </MenuItem>
                )}
              </Select>

              <FormHelperText>
                Pending and partially paid
                payments can be reviewed.
              </FormHelperText>
            </FormControl>

            {newStatus === "REJECTED" && (
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Rejection Reason"
                placeholder="Explain why this payment was rejected"
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                required
              />
            )}

            {newStatus ===
              "PARTIALLY_PAID" && (
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Amount Received"
                  placeholder="Enter the received amount"
                  value={partialPaidAmount}
                  onChange={(event) => {
                    setPartialPaidAmount(
                      event.target.value
                    );

                    setReviewError("");
                  }}
                  slotProps={{
                    htmlInput: {
                      min: 0.01,
                      step: 0.01,
                    },

                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          LKR
                        </InputAdornment>
                      ),
                    },
                  }}
                  helperText="Enter only the newly received amount."
                />

                <Grid container spacing={1.5}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 4,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius:
                          "14px",

                        backgroundColor:
                          "#f8fafc",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Total Payable
                      </Typography>

                      <Typography
                        fontWeight={800}
                      >
                        {formatMoney(
                          selectedPayment
                            ?.totalPayableAmount ||
                            selectedPayment
                              ?.amount
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 4,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius:
                          "14px",

                        backgroundColor:
                          "#f8fafc",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Already Paid
                      </Typography>

                      <Typography
                        fontWeight={800}
                      >
                        {formatMoney(
                          selectedPayment
                            ?.paidAmount
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid
                    size={{
                      xs: 12,
                      sm: 4,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius:
                          "14px",

                        backgroundColor:
                          "#f8fafc",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Outstanding
                      </Typography>

                      <Typography
                        fontWeight={800}
                      >
                        {formatMoney(
                          selectedPayment
                            ?.outstandingAmount ||
                            selectedPayment
                              ?.totalPayableAmount ||
                            selectedPayment
                              ?.amount
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {Number(
                  partialPaidAmount
                ) > 0 && (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius:
                        "14px",
                    }}
                  >
                    New total paid:{" "}
                    <strong>
                      {formatMoney(
                        Number(
                          selectedPayment
                            ?.paidAmount ||
                            0
                        ) +
                          Number(
                            partialPaidAmount ||
                              0
                          )
                      )}
                    </strong>

                    <br />

                    Remaining outstanding:{" "}
                    <strong>
                      {formatMoney(
                        Number(
                          selectedPayment
                            ?.totalPayableAmount ||
                            selectedPayment
                              ?.amount ||
                            0
                        ) -
                          Number(
                            selectedPayment
                              ?.paidAmount ||
                              0
                          ) -
                          Number(
                            partialPaidAmount ||
                              0
                          )
                      )}
                    </strong>
                  </Alert>
                )}
              </Stack>
            )}

            {newStatus === "PAID" && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: "14px",
                }}
              >
                This marks the full payable
                amount as paid and creates the
                successful transaction and
                receipt.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            color="inherit"
            disabled={updatingStatus}
            onClick={() =>
              setReviewDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              newStatus === "REJECTED"
                ? "error"
                : "primary"
            }
            disabled={
              updatingStatus || !newStatus
            }
            startIcon={
              updatingStatus ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
              ) : (
                <CheckCircleRounded />
              )
            }
            onClick={handleUpdateStatus}
          >
            {updatingStatus
              ? "Updating..."
              : "Confirm Status"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() =>
          !deletingPayment &&
          setDeleteDialogOpen(false)
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
            color="error.main"
          >
            Delete Payment
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Alert
            severity="warning"
            sx={{
              borderRadius: "15px",
            }}
          >
            This permanently deletes{" "}
            <strong>
              {selectedPayment?.paymentReference ||
                `Payment #${selectedPayment?.paymentId}`}
            </strong>
            . Payments with transactions or
            evidence may not be removable.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            color="inherit"
            disabled={deletingPayment}
            onClick={() =>
              setDeleteDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={deletingPayment}
            startIcon={
              deletingPayment ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
              ) : (
                <DeleteOutlineRounded />
              )
            }
            onClick={handleDeletePayment}
          >
            {deletingPayment
              ? "Deleting..."
              : "Delete Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPaymentsPage;