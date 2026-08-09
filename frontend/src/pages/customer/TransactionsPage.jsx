import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  AccountBalanceRounded,
  CheckCircleRounded,
  FilterListRounded,
  OpenInNewRounded,
  ReceiptLongRounded,
  SearchRounded,
  SwapHorizRounded,
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

const transactionStatusColors = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "error",
  CANCELLED: "default",
  REFUNDED: "info",
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

const TransactionsPage = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] =
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

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get(
        "/transactions/my-transactions"
      );

      setTransactions(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Unable to load transactions:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load your transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const transactionTypes = useMemo(() => {
    return [
      ...new Set(
        transactions
          .map(
            (transaction) =>
              transaction.transactionType
          )
          .filter(Boolean)
      ),
    ];
  }, [transactions]);

  const summary = useMemo(() => {
    const successfulTransactions =
      transactions.filter(
        (transaction) =>
          transaction.transactionStatus ===
          "SUCCESS"
      );

    const totalSuccessfulAmount =
      successfulTransactions.reduce(
        (total, transaction) =>
          total +
          Number(
            transaction.transactionAmount || 0
          ),
        0
      );

    const latestTransaction =
      [...transactions].sort(
        (firstTransaction, secondTransaction) => {
          const firstDate =
            new Date(
              firstTransaction.processedDate || 0
            ).getTime() || 0;

          const secondDate =
            new Date(
              secondTransaction.processedDate || 0
            ).getTime() || 0;

          return secondDate - firstDate;
        }
      )[0];

    return {
      totalTransactions:
        transactions.length,

      successfulTransactions:
        successfulTransactions.length,

      totalSuccessfulAmount,

      latestTransactionDate:
        latestTransaction?.processedDate ||
        null,
    };
  }, [transactions]);

  const summaryCards = [
    {
      title: "Total transactions",
      value: summary.totalTransactions,
      subtitle: "All transaction records",

      icon: <SwapHorizRounded />,

      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },

    {
      title: "Successful",
      value:
        summary.successfulTransactions,
      subtitle: "Completed successfully",

      icon: <CheckCircleRounded />,

      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },

    {
      title: "Transaction value",

      value: `LKR ${summary.totalSuccessfulAmount.toLocaleString()}`,

      subtitle: "Successful transaction total",

      icon: <AccountBalanceRounded />,

      gradient:
        "linear-gradient(145deg, #7356d9, #a793ff)",
    },

    {
      title: "Latest activity",

      value: summary.latestTransactionDate
        ? new Intl.DateTimeFormat("en-LK", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }).format(
            new Date(
              summary.latestTransactionDate
            )
          )
        : "No activity",

      subtitle: "Most recent transaction",

      icon: <ReceiptLongRounded />,

      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
  ];

  const filteredTransactions =
    useMemo(() => {
      const normalizedSearch =
        searchText.trim().toLowerCase();

      const matchingTransactions =
        transactions.filter(
          (transaction) => {
            const searchableValues = [
              transaction.transactionNumber,
              transaction.receiptNumber,
              transaction.bankReference,
              transaction.chequeNumber,
              transaction.gatewayReference,
              transaction.transactionType,
              transaction.transactionStatus,
            ]
              .filter(Boolean)
              .map((value) =>
                String(value).toLowerCase()
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
              transaction.transactionStatus ===
                statusFilter;

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

      return [...matchingTransactions].sort(
        (
          firstTransaction,
          secondTransaction
        ) => {
          const firstDate =
            new Date(
              firstTransaction.processedDate || 0
            ).getTime() || 0;

          const secondDate =
            new Date(
              secondTransaction.processedDate ||
                0
            ).getTime() || 0;

          if (sortOrder === "OLDEST") {
            return firstDate - secondDate;
          }

          return secondDate - firstDate;
        }
      );
    }, [
      transactions,
      searchText,
      statusFilter,
      typeFilter,
      sortOrder,
    ]);

  const getReferenceDetails = (
    transaction
  ) => {
    if (transaction.bankReference) {
      return {
        label: "Bank Reference",
        value: transaction.bankReference,
      };
    }

    if (transaction.chequeNumber) {
      return {
        label: "Cheque Number",
        value: transaction.chequeNumber,
      };
    }

    if (transaction.gatewayReference) {
      return {
        label: "Gateway Reference",
        value:
          transaction.gatewayReference,
      };
    }

    return {
      label: "External Reference",
      value: "Not available",
    };
  };

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
          My Transactions
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.7 }}
        >
          View your completed payment
          transactions and receipt details.
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

      {/* Summary cards */}
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
                          width={105}
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

      {/* Search and filter */}
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
                label="Search transactions"
                placeholder="Transaction, receipt or reference"
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

                  <MenuItem value="SUCCESS">
                    Successful
                  </MenuItem>

                  <MenuItem value="PENDING">
                    Pending
                  </MenuItem>

                  <MenuItem value="FAILED">
                    Failed
                  </MenuItem>

                  <MenuItem value="CANCELLED">
                    Cancelled
                  </MenuItem>

                  <MenuItem value="REFUNDED">
                    Refunded
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
                  Transaction type
                </InputLabel>

                <Select
                  value={typeFilter}
                  label="Transaction type"
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="ALL">
                    All transaction types
                  </MenuItem>

                  {transactionTypes.map(
                    (transactionType) => (
                      <MenuItem
                        key={transactionType}
                        value={transactionType}
                      >
                        {formatLabel(
                          transactionType
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

      {/* Transaction records */}
      <Stack spacing={1.5}>
        {loading ? (
          [1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={165}
              sx={{
                borderRadius: "22px",
              }}
            />
          ))
        ) : filteredTransactions.length ===
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
              <ReceiptLongRounded
                sx={{
                  mb: 1.5,
                  fontSize: 48,
                  color: "#94a3b8",
                }}
              />

              <Typography
                variant="h6"
                fontWeight={850}
                color="#172033"
              >
                No transactions found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.7 }}
              >
                There are no transaction
                records matching your current
                filters.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map(
            (transaction, index) => {
              const reference =
                getReferenceDetails(
                  transaction
                );

              return (
                <MotionCard
                  key={
                    transaction.transactionId
                  }
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
                      spacing={2.25}
                      alignItems="center"
                    >
                      {/* Transaction number */}
                      <Grid
                        size={{
                          xs: 12,
                          md: 3,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Transaction Number
                        </Typography>

                        <Typography
                          fontWeight={850}
                          color="#172033"
                          sx={{ mt: 0.4 }}
                        >
                          {transaction.transactionNumber ||
                            "Not available"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {formatLabel(
                            transaction.transactionType
                          )}
                        </Typography>
                      </Grid>

                      {/* Amount */}
                      <Grid
                        size={{
                          xs: 6,
                          sm: 4,
                          md: 1.7,
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
                            transaction.transactionAmount ||
                              0
                          ).toLocaleString()}
                        </Typography>
                      </Grid>

                      {/* Status */}
                      <Grid
                        size={{
                          xs: 6,
                          sm: 4,
                          md: 1.5,
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
                              transaction.transactionStatus
                            )}
                            color={
                              transactionStatusColors[
                                transaction
                                  .transactionStatus
                              ] || "default"
                            }
                            sx={{
                              fontWeight: 750,
                            }}
                          />
                        </Box>
                      </Grid>

                      {/* Receipt */}
                      <Grid
                        size={{
                          xs: 12,
                          sm: 4,
                          md: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Receipt Number
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#445268"
                          sx={{ mt: 0.4 }}
                        >
                          {transaction.receiptNumber ||
                            "Not available"}
                        </Typography>
                      </Grid>

                      {/* Reference */}
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                          md: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {reference.label}
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#445268"
                          sx={{ mt: 0.4 }}
                        >
                          {reference.value}
                        </Typography>
                      </Grid>

                      {/* Processed date */}
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                          md: 1.8,
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
                          color="#445268"
                          sx={{ mt: 0.4 }}
                        >
                          {formatDate(
                            transaction.processedDate
                          )}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1.25}
                      justifyContent="flex-end"
                      sx={{
                        mt: 2.25,
                        pt: 2,
                        borderTop:
                          "1px solid rgba(148,163,184,0.14)",
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                          <OpenInNewRounded />
                        }
                        onClick={() =>
                          navigate(
                            `/customer/payments/${transaction.paymentId}`
                          )
                        }
                        sx={{
                          minHeight: 38,
                          borderRadius: "12px",
                        }}
                      >
                        View payment
                      </Button>

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          <ReceiptLongRounded />
                        }
                        onClick={() =>
                          navigate(
                            `/customer/transactions/${transaction.transactionId}`
                          )
                        }
                        sx={{
                          minHeight: 38,
                          borderRadius: "12px",
                        }}
                      >
                        View transaction
                      </Button>
                    </Stack>
                  </CardContent>
                </MotionCard>
              );
            }
          )
        )}
      </Stack>
    </Stack>
  );
};

export default TransactionsPage;