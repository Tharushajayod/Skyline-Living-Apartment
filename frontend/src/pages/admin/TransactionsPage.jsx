import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  AccountBalanceRounded,
  CancelRounded,
  CheckCircleRounded,
  CloseRounded,
  DeleteOutlineRounded,
  FilterListRounded,
  ManageSearchRounded,
  OpenInNewRounded,
  PendingActionsRounded,
  ReceiptLongRounded,
  ReplayRounded,
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

import adminTransactionService from "../../services/adminTransactionService";

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

const statusColors = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "error",
  CANCELLED: "default",
  REFUNDED: "info",
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

const formatMoney = (value) =>
  `LKR ${Number(value || 0).toLocaleString(
    "en-LK",
    {
      maximumFractionDigits: 2,
    }
  )}`;

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

const InformationRow = ({
  label,
  value,
}) => (
  <Box
    sx={{
      p: 1.7,
      display: "flex",
      justifyContent: "space-between",
      gap: 2,
      borderRadius: "15px",
      backgroundColor: "#f8fafc",
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
      textAlign="right"
      sx={{
        wordBreak: "break-word",
      }}
    >
      {value || "Not available"}
    </Typography>
  </Box>
);

const AdminTransactionsPage = () => {
  const navigate = useNavigate();

  const [
    transactions,
    setTransactions,
  ] = useState([]);

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

  const [sortOrder, setSortOrder] =
    useState("NEWEST");

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);

  const [
    detailsDialogOpen,
    setDetailsDialogOpen,
  ] = useState(false);

  const [
    statusDialogOpen,
    setStatusDialogOpen,
  ] = useState(false);

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [newStatus, setNewStatus] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const [statusError, setStatusError] =
    useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    deletingTransaction,
    setDeletingTransaction,
  ] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data =
        await adminTransactionService
          .getAllTransactions();

      setTransactions(data);
    } catch (error) {
      console.error(
        "Unable to load transactions:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load transaction records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const transactionTypes = useMemo(
    () => [
      ...new Set(
        transactions
          .map(
            (transaction) =>
              transaction.transactionType
          )
          .filter(Boolean)
      ),
    ],
    [transactions]
  );

  const summary = useMemo(() => {
    const successful =
      transactions.filter(
        (transaction) =>
          normalizeStatus(
            transaction.transactionStatus
          ) === "SUCCESS"
      );

    return {
      total: transactions.length,

      successful: successful.length,

      pending: transactions.filter(
        (transaction) =>
          normalizeStatus(
            transaction.transactionStatus
          ) === "PENDING"
      ).length,

      totalValue: successful.reduce(
        (total, transaction) =>
          total +
          Number(
            transaction.transactionAmount ||
              0
          ),
        0
      ),
    };
  }, [transactions]);

  const summaryCards = [
    {
      title: "Total Transactions",
      value: summary.total,
      subtitle: "All transaction records",
      icon: <ReceiptLongRounded />,

      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },
    {
      title: "Successful",
      value: summary.successful,
      subtitle: "Completed transactions",
      icon: <CheckCircleRounded />,

      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },
    {
      title: "Pending",
      value: summary.pending,
      subtitle: "Awaiting completion",
      icon: <PendingActionsRounded />,

      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
    {
      title: "Successful Value",
      value: formatMoney(
        summary.totalValue
      ),
      subtitle: "Total successful amount",
      icon: <AccountBalanceRounded />,

      gradient:
        "linear-gradient(145deg, #7356d9, #a793ff)",
    },
  ];

  const filteredTransactions =
    useMemo(() => {
      const search =
        searchText.trim().toLowerCase();

      const result =
        transactions.filter(
          (transaction) => {
            const searchableValues = [
              transaction.transactionNumber,
              transaction.receiptNumber,
              transaction.bankReference,
              transaction.gatewayReference,
              transaction.chequeNumber,
              transaction.transactionType,
              transaction.transactionStatus,
              transaction.paymentId,
              transaction.processedByName,
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
              searchableValues.some(
                (value) =>
                  value.includes(search)
              );

            const matchesStatus =
              statusFilter === "ALL" ||
              normalizeStatus(
                transaction
                  .transactionStatus
              ) === statusFilter;

            const matchesType =
              typeFilter === "ALL" ||
              transaction.transactionType ===
                typeFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesType
            );
          }
        );

      return [...result].sort(
        (first, second) => {
          const firstDate =
            new Date(
              first.processedDate || 0
            ).getTime() || 0;

          const secondDate =
            new Date(
              second.processedDate || 0
            ).getTime() || 0;

          return sortOrder === "OLDEST"
            ? firstDate - secondDate
            : secondDate - firstDate;
        }
      );
    }, [
      transactions,
      searchText,
      statusFilter,
      typeFilter,
      sortOrder,
    ]);

  const getReference = (transaction) => {
    if (transaction.bankReference) {
      return {
        label: "Bank Reference",
        value: transaction.bankReference,
      };
    }

    if (transaction.gatewayReference) {
      return {
        label: "Gateway Reference",
        value:
          transaction.gatewayReference,
      };
    }

    if (transaction.chequeNumber) {
      return {
        label: "Cheque Number",
        value: transaction.chequeNumber,
      };
    }

    return {
      label: "External Reference",
      value: "Not available",
    };
  };

  const getAvailableStatuses = (
    currentStatus
  ) => {
    const status =
      normalizeStatus(currentStatus);

    if (status === "PENDING") {
      return [
        "SUCCESS",
        "FAILED",
        "CANCELLED",
      ];
    }

    if (status === "SUCCESS") {
      return ["REFUNDED"];
    }

    return [];
  };

  const openDetailsDialog = (
    transaction
  ) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(true);
  };

  const openStatusDialog = (
    transaction
  ) => {
    setSelectedTransaction(transaction);
    setNewStatus("");
    setReason("");
    setRemarks("");
    setStatusError("");
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    setStatusError("");

    if (!newStatus) {
      setStatusError(
        "Select a new transaction status."
      );

      return;
    }

    if (
      ["FAILED", "CANCELLED", "REFUNDED"]
        .includes(newStatus) &&
      !reason.trim()
    ) {
      setStatusError(
        `A reason is required for ${formatLabel(
          newStatus
        )}.`
      );

      return;
    }

    try {
      setUpdatingStatus(true);

      const updatedTransaction =
        await adminTransactionService
          .updateTransactionStatus(
            selectedTransaction
              .transactionId,
            newStatus,
            reason,
            remarks
          );

      setTransactions(
        (currentTransactions) =>
          currentTransactions.map(
            (transaction) =>
              transaction.transactionId ===
              updatedTransaction.transactionId
                ? updatedTransaction
                : transaction
          )
      );

      setStatusDialogOpen(false);

      setSuccessMessage(
        `Transaction ${updatedTransaction.transactionNumber} changed to ${formatLabel(
          updatedTransaction
            .transactionStatus
        )}.`
      );
    } catch (error) {
      console.error(
        "Unable to update transaction:",
        error
      );

      setStatusError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update transaction status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (
      !selectedTransaction?.transactionId
    ) {
      return;
    }

    try {
      setDeletingTransaction(true);

      await adminTransactionService
        .deleteTransaction(
          selectedTransaction
            .transactionId
        );

      setTransactions(
        (currentTransactions) =>
          currentTransactions.filter(
            (transaction) =>
              transaction.transactionId !==
              selectedTransaction
                .transactionId
          )
      );

      setDeleteDialogOpen(false);

      setSuccessMessage(
        "Transaction deleted successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to delete transaction."
      );
    } finally {
      setDeletingTransaction(false);
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
            Transaction Management
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.65 }}
          >
            Review, control and manage all financial transaction records.
          </Typography>
        </Box>

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
                          color: "#ffffff",
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
                            width={95}
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
              >
                Search and filter
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  lg: 5,
                }}
              >
                <TextField
                  fullWidth
                  label="Search transactions"
                  placeholder="Transaction, receipt, payment or reference"
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
                  lg: 2.33,
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

                    {[
                      "PENDING",
                      "SUCCESS",
                      "FAILED",
                      "CANCELLED",
                      "REFUNDED",
                    ].map((status) => (
                      <MenuItem
                        key={status}
                        value={status}
                      >
                        {formatLabel(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                  lg: 2.33,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>
                    Transaction Type
                  </InputLabel>

                  <Select
                    label="Transaction Type"
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

                    {transactionTypes.map(
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
                  sm: 4,
                  lg: 2.33,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Sort</InputLabel>

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
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                variant="rounded"
                height={135}
                sx={{
                  borderRadius: "21px",
                }}
              />
            ))}
          </Stack>
        ) : filteredTransactions.length ===
          0 ? (
          <Card
            elevation={0}
            sx={{
              ...glassCard,
              textAlign: "center",
            }}
          >
            <CardContent sx={{ py: 8 }}>
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
                No transactions found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.7 }}
              >
                No transaction records match
                the selected filters.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.4}>
            {filteredTransactions.map(
              (transaction, index) => {
                const status =
                  normalizeStatus(
                    transaction
                      .transactionStatus
                  );

                const availableStatuses =
                  getAvailableStatuses(
                    status
                  );

                return (
                  <MotionCard
                    key={
                      transaction.transactionId
                    }
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
                    whileHover={{ y: -3 }}
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
                                color: "#4f46e5",

                                backgroundColor:
                                  "rgba(79,70,229,0.10)",
                              }}
                            >
                              <ReceiptLongRounded />
                            </Avatar>

                            <Box>
                              <Typography
                                fontWeight={850}
                              >
                                {
                                  transaction.transactionNumber
                                }
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Payment #
                                {
                                  transaction.paymentId
                                }
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            lg: 1.5,
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
                          >
                            {formatMoney(
                              transaction.transactionAmount
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
                            lg: 1.4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Type
                          </Typography>

                          <Typography
                            fontWeight={700}
                          >
                            {formatLabel(
                              transaction.transactionType
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 6,
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
                                status
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
                            lg: 1.8,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Receipt
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={700}
                          >
                            {transaction.receiptNumber ||
                              "Not available"}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 12,
                            lg: 1.8,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Processed
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={650}
                          >
                            {formatDate(
                              transaction.processedDate
                            )}
                          </Typography>
                        </Grid>

                        <Grid
                          size={{
                            xs: 12,
                            lg: 1.6,
                          }}
                        >
                          <Stack spacing={0.7}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <VisibilityRounded />
                              }
                              onClick={() =>
                                openDetailsDialog(
                                  transaction
                                )
                              }
                              sx={{
                                borderRadius:
                                  "11px",
                              }}
                            >
                              Details
                            </Button>

                            {availableStatuses
                              .length > 0 && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={
                                  <ReplayRounded />
                                }
                                onClick={() =>
                                  openStatusDialog(
                                    transaction
                                  )
                                }
                                sx={{
                                  borderRadius:
                                    "11px",
                                }}
                              >
                                Manage
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
                            onClick={() => {
                              setSelectedTransaction(
                                transaction
                              );

                              setDeleteDialogOpen(
                                true
                              );
                            }}
                          >
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Grid>
                      </Grid>

                      {transaction.failureReason && (
                        <Alert
                          severity={
                            status === "REFUNDED"
                              ? "info"
                              : "error"
                          }
                          sx={{
                            mt: 2,
                            borderRadius:
                              "14px",
                          }}
                        >
                          Reason:{" "}
                          {
                            transaction.failureReason
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

      {/* Details dialog */}
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
            <Typography
              variant="h6"
              fontWeight={850}
            >
              Transaction Details
            </Typography>

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
          {selectedTransaction && (
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
                      label="Transaction ID"
                      value={`#${selectedTransaction.transactionId}`}
                    />

                    <InformationRow
                      label="Transaction Number"
                      value={
                        selectedTransaction.transactionNumber
                      }
                    />

                    <InformationRow
                      label="Payment ID"
                      value={`#${selectedTransaction.paymentId}`}
                    />

                    <InformationRow
                      label="Amount"
                      value={formatMoney(
                        selectedTransaction.transactionAmount
                      )}
                    />

                    <InformationRow
                      label="Type"
                      value={formatLabel(
                        selectedTransaction.transactionType
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
                      label="Status"
                      value={formatLabel(
                        selectedTransaction.transactionStatus
                      )}
                    />

                    <InformationRow
                      label="Receipt Number"
                      value={
                        selectedTransaction.receiptNumber
                      }
                    />

                    <InformationRow
                      label={
                        getReference(
                          selectedTransaction
                        ).label
                      }
                      value={
                        getReference(
                          selectedTransaction
                        ).value
                      }
                    />

                    <InformationRow
                      label="Processed By"
                      value={
                        selectedTransaction.processedByName ||
                        "Not available"
                      }
                    />

                    <InformationRow
                      label="Processed Date"
                      value={formatDate(
                        selectedTransaction.processedDate
                      )}
                    />
                  </Stack>
                </Grid>
              </Grid>

              {selectedTransaction
                .failureReason && (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: "15px",
                  }}
                >
                  Reason:{" "}
                  {
                    selectedTransaction.failureReason
                  }
                </Alert>
              )}

              {selectedTransaction.remarks && (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "15px",
                  }}
                >
                  Remarks:{" "}
                  {
                    selectedTransaction.remarks
                  }
                </Alert>
              )}
            </Stack>
          )}
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

          <Button
            variant="outlined"
            endIcon={<OpenInNewRounded />}
            onClick={() => {
              setDetailsDialogOpen(false);

              navigate(
                "/admin/payment-transaction/payments"
              );
            }}
          >
            Open Payments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() =>
          !updatingStatus &&
          setStatusDialogOpen(false)
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
            Manage Transaction
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {
              selectedTransaction
                ?.transactionNumber
            }
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            {statusError && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: "14px",
                }}
              >
                {statusError}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>
                New Status
              </InputLabel>

              <Select
                label="New Status"
                value={newStatus}
                onChange={(event) => {
                  setNewStatus(
                    event.target.value
                  );

                  setReason("");
                  setStatusError("");
                }}
              >
                {getAvailableStatuses(
                  selectedTransaction
                    ?.transactionStatus
                ).map((status) => (
                  <MenuItem
                    key={status}
                    value={status}
                  >
                    {formatLabel(status)}
                  </MenuItem>
                ))}
              </Select>

              <FormHelperText>
                Available statuses depend on
                the current transaction status.
              </FormHelperText>
            </FormControl>

            {[
              "FAILED",
              "CANCELLED",
              "REFUNDED",
            ].includes(newStatus) && (
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={`${formatLabel(
                  newStatus
                )} Reason`}
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                required
              />
            )}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Remarks"
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value
                )
              }
              placeholder="Optional notes about this update"
            />

            {newStatus === "REFUNDED" && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: "14px",
                }}
              >
                This marks the transaction as
                refunded. The current version
                does not automatically change
                the related payment balance.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
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
            color={
              ["FAILED", "CANCELLED"]
                .includes(newStatus)
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
              ) : newStatus ===
                "CANCELLED" ? (
                <CancelRounded />
              ) : (
                <CheckCircleRounded />
              )
            }
            onClick={handleUpdateStatus}
          >
            {updatingStatus
              ? "Updating..."
              : "Confirm Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() =>
          !deletingTransaction &&
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
            Delete Transaction
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
              {
                selectedTransaction
                  ?.transactionNumber
              }
            </strong>
            . This operation cannot be undone.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            color="inherit"
            disabled={deletingTransaction}
            onClick={() =>
              setDeleteDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={deletingTransaction}
            startIcon={
              deletingTransaction ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
              ) : (
                <DeleteOutlineRounded />
              )
            }
            onClick={handleDelete}
          >
            {deletingTransaction
              ? "Deleting..."
              : "Delete Transaction"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminTransactionsPage;