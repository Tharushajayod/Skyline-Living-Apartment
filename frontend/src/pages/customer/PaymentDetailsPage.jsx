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
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DescriptionRounded,
  OpenInNewRounded,
  PaymentsRounded,
  PersonRounded,
  ReceiptLongRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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

const statusColors = {
  PAID: "success",
  PENDING: "warning",
  REJECTED: "error",
  PARTIALLY_PAID: "info",
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

        <Box>
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

const PaymentDetailsPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] =
    useState(null);

  const [evidenceImages, setEvidenceImages] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get(
          `/payments/${paymentId}/details`
        );

        setDetails(response.data);
      } catch (error) {
        console.error(
          "Unable to load payment details:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load payment details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, [paymentId]);

  useEffect(() => {
    const loadEvidenceImages = async () => {
      const evidenceList =
        details?.evidence || [];

      const loadedImages = {};

      for (const evidence of evidenceList) {
        if (!evidence.fileUrl) {
          continue;
        }

        try {
          let endpoint = evidence.fileUrl;

          if (endpoint.startsWith("/api/")) {
            endpoint = endpoint.substring(4);
          }

          const response = await api.get(
            endpoint,
            {
              responseType: "blob",
            }
          );

          loadedImages[
            evidence.paymentEvidenceId
          ] = URL.createObjectURL(
            response.data
          );
        } catch (error) {
          console.error(
            "Unable to load evidence:",
            error
          );
        }
      }

      setEvidenceImages(loadedImages);
    };

    if (details) {
      loadEvidenceImages();
    }

    return () => {
      Object.values(
        evidenceImages
      ).forEach((url) => {
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [details]);

  const payment = details?.payment;
  const evidence = details?.evidence || [];
  const transactions =
    details?.transactions || [];

  const paymentSummary = useMemo(() => {
    return [
      {
        label: "Payment Reference",
        value:
          payment?.paymentReference,
        icon: <PaymentsRounded />,
      },
      {
        label: "Payment Type",
        value: formatLabel(
          payment?.paymentType
        ),
        icon: <DescriptionRounded />,
      },
      {
        label: "Payment Method",
        value: formatLabel(
          payment?.paymentMethod
        ),
        icon: <ReceiptLongRounded />,
      },
      {
        label: "Submitted Date",
        value: formatDate(
          payment?.paymentDate
        ),
        icon: <CalendarMonthRounded />,
      },
      {
        label: "Verified By",
        value:
          payment?.verifiedByName ||
          "Not verified",
        icon: <PersonRounded />,
      },
      {
        label: "Verified Date",
        value: formatDate(
          payment?.verifiedAt
        ),
        icon: <CheckCircleRounded />,
      },
    ];
  }, [payment]);

  if (loading) {
    return (
      <Stack
        spacing={3}
        sx={{
          maxWidth: 1450,
          mx: "auto",
        }}
      >
        <Skeleton
          width={260}
          height={50}
        />

        <Skeleton
          variant="rounded"
          height={210}
          sx={{ borderRadius: "22px" }}
        />

        <Skeleton
          variant="rounded"
          height={320}
          sx={{ borderRadius: "22px" }}
        />
      </Stack>
    );
  }

  return (
    <Stack
      spacing={3}
      sx={{
        maxWidth: 1450,
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
            startIcon={<ArrowBackRounded />}
            onClick={() =>
              navigate(
                "/customer/payments"
              )
            }
            sx={{
              mb: 1,
              px: 0,
            }}
          >
            Back to payments
          </Button>

          <Typography
            variant="h4"
            fontWeight={900}
            color="#172033"
            sx={{
              letterSpacing: "-0.7px",
            }}
          >
            Payment Details
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.7 }}
          >
            View payment, verification,
            evidence and transaction
            information.
          </Typography>
        </Box>

        {payment && (
          <Chip
            label={formatLabel(
              payment.paymentStatus
            )}
            color={
              statusColors[
                payment.paymentStatus
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

      {!errorMessage && payment && (
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Payment Amount
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={900}
                    color="#172033"
                    sx={{
                      mt: 0.7,
                      fontSize: {
                        xs: 34,
                        sm: 42,
                      },
                    }}
                  >
                    LKR{" "}
                    {Number(
                      payment.amount || 0
                    ).toLocaleString()}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {formatLabel(
                      payment.paymentType
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
                    {paymentSummary.map(
                      (item) => (
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
                      )
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {payment.remarks && (
                <>
                  <Divider sx={{ my: 3 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Remarks
                  </Typography>

                  <Typography
                    color="#172033"
                    sx={{ mt: 0.6 }}
                  >
                    {payment.remarks}
                  </Typography>
                </>
              )}

              {payment.rejectionReason && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 3,
                    borderRadius: "16px",
                  }}
                >
                  {payment.rejectionReason}
                </Alert>
              )}
            </CardContent>
          </MotionCard>

          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                lg: 6,
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
                    Payment Evidence
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      mb: 2.5,
                    }}
                  >
                    Uploaded proof of payment.
                  </Typography>

                  {evidence.length === 0 ? (
                    <Box
                      sx={{
                        minHeight: 230,
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <Box>
                        <DescriptionRounded
                          sx={{
                            fontSize: 48,
                            color: "#94a3b8",
                          }}
                        />

                        <Typography
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          No payment evidence
                          uploaded.
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Grid
                      container
                      spacing={2}
                    >
                      {evidence.map(
                        (item) => (
                          <Grid
                            key={
                              item.paymentEvidenceId
                            }
                            size={{
                              xs: 12,
                              sm: 6,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.3,

                                borderRadius:
                                  "18px",

                                backgroundColor:
                                  "#f8fafc",

                                border:
                                  "1px solid rgba(148,163,184,0.16)",
                              }}
                            >
                              {evidenceImages[
                                item
                                  .paymentEvidenceId
                              ] ? (
                                <Box
                                  component="img"
                                  src={
                                    evidenceImages[
                                      item
                                        .paymentEvidenceId
                                    ]
                                  }
                                  alt={
                                    item.fileName
                                  }
                                  sx={{
                                    width: "100%",
                                    height: 210,

                                    objectFit:
                                      "cover",

                                    borderRadius:
                                      "14px",
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    height: 210,
                                    display:
                                      "grid",
                                    placeItems:
                                      "center",
                                  }}
                                >
                                  <CircularProgress
                                    size={25}
                                  />
                                </Box>
                              )}

                              <Typography
                                variant="body2"
                                fontWeight={750}
                                color="#172033"
                                sx={{
                                  mt: 1.2,
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {item.fileName}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Uploaded by{" "}
                                {item.uploadedByName ||
                                  "Customer"}
                              </Typography>
                            </Box>
                          </Grid>
                        )
                      )}
                    </Grid>
                  )}
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid
              size={{
                xs: 12,
                lg: 6,
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
                    Related Transactions
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      mb: 2.5,
                    }}
                  >
                    Transactions created from
                    this payment.
                  </Typography>

                  {transactions.length ===
                  0 ? (
                    <Box
                      sx={{
                        minHeight: 230,
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <Box>
                        <ReceiptLongRounded
                          sx={{
                            fontSize: 48,
                            color: "#94a3b8",
                          }}
                        />

                        <Typography
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          No related transactions
                          available.
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {transactions.map(
                        (transaction) => (
                          <Box
                            key={
                              transaction.transactionId
                            }
                            sx={{
                              p: 2,

                              borderRadius:
                                "16px",

                              backgroundColor:
                                "rgba(247,250,255,0.8)",

                              border:
                                "1px solid rgba(148,163,184,0.13)",
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              spacing={2}
                            >
                              <Box>
                                <Typography
                                  fontWeight={800}
                                  color="#172033"
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
                                  {transaction.receiptNumber ||
                                    "Not available"}
                                </Typography>
                              </Box>

                              <Chip
                                size="small"
                                label={formatLabel(
                                  transaction.transactionStatus
                                )}
                                color={
                                  transactionStatusColors[
                                    transaction
                                      .transactionStatus
                                  ] ||
                                  "default"
                                }
                                sx={{
                                  fontWeight: 750,
                                }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mt: 1.5 }}
                            >
                              <Typography
                                fontWeight={800}
                                color="#2563eb"
                              >
                                LKR{" "}
                                {Number(
                                  transaction.transactionAmount ||
                                    0
                                ).toLocaleString()}
                              </Typography>

                              <Button
                                size="small"
                                endIcon={
                                  <OpenInNewRounded />
                                }
                                onClick={() =>
                                  navigate(
                                    `/customer/transactions/${transaction.transactionId}`
                                  )
                                }
                              >
                                View
                              </Button>
                            </Stack>
                          </Box>
                        )
                      )}
                    </Stack>
                  )}
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
};

export default PaymentDetailsPage;