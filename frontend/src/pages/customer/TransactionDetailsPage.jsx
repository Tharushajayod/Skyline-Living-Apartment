import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { motion } from "motion/react";

import {
  AccountBalanceRounded,
  ArrowBackRounded,
  CalendarMonthRounded,
  CreditCardRounded,
  DescriptionRounded,
  OpenInNewRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  TagRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
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

const DetailItem = ({
  label,
  value,
  icon,
}) => {
  return (
    <Box
      sx={{
        p: 2,

        borderRadius: "16px",

        backgroundColor:
          "rgba(247,250,255,0.78)",

        border:
          "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <Stack
        direction="row"
        spacing={1.3}
        alignItems="flex-start"
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            flexShrink: 0,

            display: "grid",
            placeItems: "center",

            borderRadius: "12px",

            color: "#2563eb",

            backgroundColor:
              "rgba(37,99,235,0.08)",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {label}
          </Typography>

          <Typography
            variant="body2"
            fontWeight={750}
            color="#172033"
            sx={{
              mt: 0.35,
              wordBreak: "break-word",
            }}
          >
            {value || "Not available"}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

const TransactionDetailsPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get(
          `/transactions/${transactionId}`
        );

        setTransaction(response.data);
      } catch (error) {
        console.error(
          "Unable to load transaction details:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load transaction details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [transactionId]);

  const referenceDetails = useMemo(() => {
    if (!transaction) {
      return {
        label: "External Reference",
        value: "Not available",
      };
    }

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
  }, [transaction]);

  const detailItems = useMemo(() => {
    if (!transaction) {
      return [];
    }

    return [
      {
        label: "Transaction Number",
        value:
          transaction.transactionNumber,
        icon: <TagRounded />,
      },
      {
        label: "Receipt Number",
        value: transaction.receiptNumber,
        icon: <ReceiptLongRounded />,
      },
      {
        label: "Transaction Type",
        value: formatLabel(
          transaction.transactionType
        ),
        icon: <DescriptionRounded />,
      },
      {
        label: "Processed Date",
        value: formatDate(
          transaction.processedDate
        ),
        icon: <CalendarMonthRounded />,
      },
      {
        label: referenceDetails.label,
        value: referenceDetails.value,
        icon: <AccountBalanceRounded />,
      },
      {
        label: "Payment ID",
        value:
          transaction.paymentId?.toString(),
        icon: <PaymentsRounded />,
      },
    ];
  }, [transaction, referenceDetails]);

  if (loading) {
    return (
      <Stack
        spacing={3}
        sx={{
          maxWidth: 1300,
          mx: "auto",
        }}
      >
        <Skeleton
          width={280}
          height={52}
        />

        <Skeleton
          variant="rounded"
          height={230}
          sx={{
            borderRadius: "22px",
          }}
        />

        <Skeleton
          variant="rounded"
          height={280}
          sx={{
            borderRadius: "22px",
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack
      spacing={3}
      sx={{
        maxWidth: 1300,
        mx: "auto",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        spacing={2}
      >
        <Box>
          <Button
            color="inherit"
            startIcon={
              <ArrowBackRounded />
            }
            onClick={() =>
              navigate(
                "/customer/transactions"
              )
            }
            sx={{
              mb: 1,
              px: 0,
            }}
          >
            Back to transactions
          </Button>

          <Typography
            variant="h4"
            fontWeight={900}
            color="#172033"
            sx={{
              letterSpacing: "-0.7px",
            }}
          >
            Transaction Details
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.7 }}
          >
            View the complete transaction and
            receipt information.
          </Typography>
        </Box>

        {transaction && (
          <Chip
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
              minHeight: 36,
              px: 1,
              fontWeight: 800,
              fontSize: 14,
            }}
          />
        )}
      </Stack>

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

      {!errorMessage && transaction && (
        <>
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
            sx={glassCard}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2.5,
                  sm: 3,
                },

                "&:last-child": {
                  pb: {
                    xs: 2.5,
                    sm: 3,
                  },
                },
              }}
            >
              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    md: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 58,
                      height: 58,

                      display: "grid",
                      placeItems: "center",

                      borderRadius: "18px",

                      color: "#ffffff",

                      background:
                        "linear-gradient(145deg, #1674dc, #5baeff)",

                      boxShadow:
                        "0 12px 28px rgba(37,99,235,0.22)",
                    }}
                  >
                    <CreditCardRounded />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Transaction Amount
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={900}
                    color="#172033"
                    sx={{
                      mt: 0.6,

                      fontSize: {
                        xs: 34,
                        sm: 42,
                      },
                    }}
                  >
                    LKR{" "}
                    {Number(
                      transaction.transactionAmount ||
                        0
                    ).toLocaleString()}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {formatLabel(
                      transaction.transactionType
                    )}
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 8,
                  }}
                >
                  <Grid
                    container
                    spacing={1.5}
                  >
                    {detailItems.map((item) => (
                      <Grid
                        key={item.label}
                        size={{
                          xs: 12,
                          sm: 6,
                        }}
                      >
                        <DetailItem
                          {...item}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>

          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 7,
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
                  delay: 0.08,
                }}
                sx={{
                  ...glassCard,
                  height: "100%",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,

                    "&:last-child": {
                      pb: 3,
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={850}
                    color="#172033"
                  >
                    Receipt Information
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      mb: 2.5,
                    }}
                  >
                    Official receipt and
                    reference details for this
                    transaction.
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        p: 2,

                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,

                        borderRadius: "16px",

                        backgroundColor:
                          "rgba(247,250,255,0.8)",

                        border:
                          "1px solid rgba(148,163,184,0.13)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Receipt Number
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={800}
                        color="#172033"
                        textAlign="right"
                      >
                        {transaction.receiptNumber ||
                          "Not available"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 2,

                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,

                        borderRadius: "16px",

                        backgroundColor:
                          "rgba(247,250,255,0.8)",

                        border:
                          "1px solid rgba(148,163,184,0.13)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {referenceDetails.label}
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={800}
                        color="#172033"
                        textAlign="right"
                        sx={{
                          wordBreak: "break-word",
                        }}
                      >
                        {referenceDetails.value}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 2,

                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,

                        borderRadius: "16px",

                        backgroundColor:
                          "rgba(247,250,255,0.8)",

                        border:
                          "1px solid rgba(148,163,184,0.13)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Processed Date
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={800}
                        color="#172033"
                        textAlign="right"
                      >
                        {formatDate(
                          transaction.processedDate
                        )}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 2,

                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,

                        borderRadius: "16px",

                        backgroundColor:
                          "rgba(247,250,255,0.8)",

                        border:
                          "1px solid rgba(148,163,184,0.13)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Transaction Status
                      </Typography>

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
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 5,
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
                  delay: 0.16,
                }}
                sx={{
                  ...glassCard,
                  height: "100%",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,

                    "&:last-child": {
                      pb: 3,
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={850}
                    color="#172033"
                  >
                    Related Payment
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      mb: 2.5,
                    }}
                  >
                    View the payment associated
                    with this transaction.
                  </Typography>

                  <Box
                    sx={{
                      p: 2.5,

                      borderRadius: "18px",

                      background:
                        "linear-gradient(145deg, rgba(37,99,235,0.08), rgba(96,165,250,0.04))",

                      border:
                        "1px solid rgba(37,99,235,0.12)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        height: 46,

                        display: "grid",
                        placeItems: "center",

                        borderRadius: "14px",

                        color: "#2563eb",

                        backgroundColor:
                          "rgba(37,99,235,0.09)",
                      }}
                    >
                      <PaymentsRounded />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mt: 2,
                      }}
                    >
                      Payment ID
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight={900}
                      color="#172033"
                      sx={{ mt: 0.35 }}
                    >
                      #
                      {transaction.paymentId ||
                        "Not available"}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={
                        <OpenInNewRounded />
                      }
                      disabled={
                        !transaction.paymentId
                      }
                      onClick={() =>
                        navigate(
                          `/customer/payments/${transaction.paymentId}`
                        )
                      }
                      sx={{
                        minHeight: 46,
                        borderRadius: "14px",

                        transition:
                          "all 180ms ease",

                        "&:hover": {
                          transform:
                            "translateY(-2px)",
                        },

                        "&:active": {
                          transform:
                            "scale(0.98)",
                        },
                      }}
                    >
                      View Payment Details
                    </Button>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
};

export default TransactionDetailsPage;