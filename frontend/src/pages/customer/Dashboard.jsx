import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  AccountBalanceWalletRounded,
  CheckCircleRounded,
  PendingActionsRounded,
  ReceiptLongRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import api from "../../api/axiosConfig";
import { useAuth } from "../../contexts/AuthContext";

const MotionCard = motion.create(Card);

const glassCard = {
  borderRadius: "22px",

  background:
    "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))",

  backdropFilter: "blur(20px)",

  border:
    "1px solid rgba(255,255,255,0.95)",

  boxShadow:
    "0 12px 35px rgba(48,75,105,0.08)",

  overflow: "hidden",
};

const statusColor = {
  PAID: "success",
  PENDING: "warning",
  REJECTED: "error",
  PARTIALLY_PAID: "info",
};

const CustomerDashboard = () => {
  const { user } = useAuth();

  const canSeeFinanceData =
  user?.role === "ADMIN" ||
  user?.role === "FINANCE_OFFICER";

  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!canSeeFinanceData) {
      setLoading(false);
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
          summaryResponse.data || {}
        );

        setRecentPayments(
          Array.isArray(
            paymentsResponse.data
          )
            ? paymentsResponse.data
            : []
        );
      } catch (error) {
        console.error(
          "Unable to load dashboard:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [canSeeFinanceData]);

  const summary = useMemo(() => {
    const paidPayments = payments.filter(
      (payment) =>
        payment.paymentStatus === "PAID"
    );

    return {
      total: payments.length,

      paid: paidPayments.length,

      pending: payments.filter(
        (payment) =>
          payment.paymentStatus === "PENDING"
      ).length,

      totalPaid: paidPayments.reduce(
        (sum, payment) =>
          sum + Number(payment.amount ?? 0),
        0
      ),
    };
  }, [payments]);

  const cards = [
    {
      title: "Total payments",
      value: summary.total,
      subtitle: "All submitted payments",
      icon: <AccountBalanceWalletRounded />,
      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },
    {
      title: "Completed",
      value: summary.paid,
      subtitle: "Successfully verified",
      icon: <CheckCircleRounded />,
      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },
    {
      title: "Awaiting review",
      value: summary.pending,
      subtitle: "Pending verification",
      icon: <PendingActionsRounded />,
      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
    {
      title: "Total paid",
      value: `LKR ${summary.totalPaid.toLocaleString()}`,
      subtitle: "Verified payment value",
      icon: <ReceiptLongRounded />,
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
      <Box>
        <Typography
          variant="h4"
          fontWeight={900}
          color="#15243a"
          sx={{
            letterSpacing: "-0.8px",
          }}
        >
          Welcome back,{" "}
          {user?.fullName?.split(" ")[0] ||
            "Customer"}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.75 }}
        >
          Here is your latest payment activity.
        </Typography>
      </Box>

      {errorMessage && (
        <Alert
          severity="error"
          sx={{
            borderRadius: "18px",
            backgroundColor:
              "rgba(255,235,235,0.82)",
            backdropFilter: "blur(16px)",
          }}
        >
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        
        {cards.map((card, index) => (
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
                    p: 2.5,
                    "&:last-child": {
                    pb: 2.5,
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
                      color: "#fff",
                      background: card.gradient,
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
                        width={90}
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
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid
          size={{
            xs: 12,
            lg: 7,
          }}
        >
          <MotionCard
            elevation={0}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            sx={glassCard}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2.5,
                  sm: 3,
                },
              }}
            >
              <Typography
                variant="h6"
                fontWeight={850}
                color="#17263a"
              >
                Recent payments
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.4, mb: 2.5 }}
              >
                Your latest submitted payments
              </Typography>

              {loading ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3].map((item) => (
                    <Skeleton
                      key={item}
                      variant="rounded"
                      height={74}
                      sx={{ borderRadius: 3 }}
                    />
                  ))}
                </Stack>
              ) : payments.length === 0 ? (
                <Box
                  sx={{
                    py: 7,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  No payment records available.
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {payments
                    .slice(0, 5)
                    .map((payment) => (
                      <Box
                        component={motion.div}
                        whileHover={{
                          x: 4,
                          backgroundColor:
                            "rgba(239,246,255,0.92)",
                        }}
                        key={payment.paymentId}
                        sx={{
                          p: 1.8,
                          borderRadius: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          backgroundColor:
                            "rgba(248,251,255,0.72)",
                          border:
                            "1px solid rgba(115,154,198,0.10)",
                        }}
                      >
                        <Box>
                          <Typography
                            fontWeight={800}
                            color="#203047"
                          >
                            {payment.paymentReference}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {payment.paymentType}
                          </Typography>
                        </Box>

                        <Stack
                          spacing={0.6}
                          alignItems="flex-end"
                        >
                          <Typography
                            fontWeight={850}
                            color="#203047"
                          >
                            LKR{" "}
                            {Number(
                              payment.amount ?? 0
                            ).toLocaleString()}
                          </Typography>

                          <Chip
                            size="small"
                            label={
                              payment.paymentStatus
                            }
                            color={
                              statusColor[
                                payment
                                  .paymentStatus
                              ] || "default"
                            }
                            sx={{
                              fontWeight: 750,
                              fontSize: 11,
                            }}
                          />
                        </Stack>
                      </Box>
                    ))}
                </Stack>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 5,
          }}
        >
          <MotionCard
            elevation={0}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            sx={{
              ...glassCard,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2.5,
                  sm: 3,
                },
              }}
            >
              <Typography
                variant="h6"
                fontWeight={850}
                color="#17263a"
              >
                Recent transactions
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.4, mb: 2.5 }}
              >
                Latest successful activity
              </Typography>

              {loading ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3].map((item) => (
                    <Skeleton
                      key={item}
                      variant="rounded"
                      height={68}
                      sx={{ borderRadius: 3 }}
                    />
                  ))}
                </Stack>
              ) : transactions.length === 0 ? (
                <Box
                  sx={{
                    py: 7,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  No transaction records available.
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {transactions
                    .slice(0, 5)
                    .map((transaction) => (
                      <Box
                        component={motion.div}
                        whileHover={{ x: 4 }}
                        key={
                          transaction.transactionId
                        }
                        sx={{
                          p: 1.8,
                          borderRadius: "16px",
                          backgroundColor:
                            "rgba(248,251,255,0.72)",
                          border:
                            "1px solid rgba(115,154,198,0.10)",
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography
                              fontWeight={800}
                              color="#203047"
                            >
                              {
                                transaction.transactionNumber
                              }
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {
                                transaction.receiptNumber
                              }
                            </Typography>
                          </Box>

                          <Typography
                            fontWeight={850}
                            color="#1266d3"
                          >
                            LKR{" "}
                            {Number(
                              transaction.transactionAmount ??
                                0
                            ).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                </Stack>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {loading && (
        <Box
          sx={{
            position: "fixed",
            right: 28,
            bottom: 28,
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            backgroundColor:
              "rgba(255,255,255,0.75)",
            backdropFilter: "blur(14px)",
            boxShadow:
              "0 12px 35px rgba(60,110,165,0.20)",
          }}
        >
          <CircularProgress size={23} />
        </Box>
      )}
    </Stack>
  );
};

export default CustomerDashboard;