import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  AccountBalanceWalletRounded,
  AssessmentRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DownloadRounded,
  FilterListRounded,
  PaymentsRounded,
  PendingActionsRounded,
  PrintRounded,
  ReceiptLongRounded,
  SearchRounded,
  TrendingUpRounded,
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

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import adminReportService from "../../services/adminReportService";

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

const chartCard = {
  ...glassCard,
  height: "100%",
};

const STATUS_COLORS = {
  PAID: "#22a06b",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
  PARTIALLY_PAID: "#3b82f6",
};

const METHOD_COLORS = [
  "#4f46e5",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#d97706",
  "#9333ea",
];

const monthOrder = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const monthShortNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

const formatMoney = (value) =>
  `LKR ${Number(value || 0).toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;

const formatCompactMoney = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    return `LKR ${(amount / 1_000_000_000).toFixed(
      1
    )}B`;
  }

  if (amount >= 1_000_000) {
    return `LKR ${(amount / 1_000_000).toFixed(
      1
    )}M`;
  }

  if (amount >= 1_000) {
    return `LKR ${(amount / 1_000).toFixed(
      1
    )}K`;
  }

  return `LKR ${amount.toLocaleString()}`;
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

const downloadCsv = (
  filename,
  rows
) => {
  if (!rows.length) {
    return;
  }

  const headers =
    Object.keys(rows[0]);

  const escapeValue = (value) => {
    const stringValue =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return `"${stringValue.replaceAll(
      '"',
      '""'
    )}"`;
  };

  const csvContent = [
    headers
      .map(escapeValue)
      .join(","),

    ...rows.map((row) =>
      headers
        .map((header) =>
          escapeValue(row[header])
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};

const CustomTooltip = ({
  active,
  payload,
  label,
}) => {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 1.5,
        minWidth: 150,
        borderRadius: "14px",
        backgroundColor:
          "rgba(255,255,255,0.98)",
        border:
          "1px solid rgba(148,163,184,0.18)",
        boxShadow:
          "0 12px 30px rgba(15,23,42,0.14)",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>

      {payload.map((item) => (
        <Typography
          key={
            item.dataKey ||
            item.name
          }
          variant="body2"
          fontWeight={800}
          sx={{ mt: 0.4 }}
        >
          {item.name}:{" "}
          {item.dataKey === "revenue" ||
          item.dataKey ===
            "totalRevenue"
            ? formatMoney(item.value)
            : Number(
                item.value || 0
              ).toLocaleString()}
        </Typography>
      ))}
    </Box>
  );
};

const AdminReportsPage = () => {
  const currentYear =
    new Date().getFullYear();

  const [selectedYear, setSelectedYear] =
    useState(currentYear);

  const [summary, setSummary] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    rejectedPayments: 0,
    partiallyPaidPayments: 0,
    totalRevenue: 0,
    totalOutstandingAmount: 0,
  });

  const [
    monthlyRevenue,
    setMonthlyRevenue,
  ] = useState([]);

  const [
    statusReport,
    setStatusReport,
  ] = useState({
    paid: 0,
    pending: 0,
    rejected: 0,
    partiallyPaid: 0,
  });

  const [
    paymentMethodRevenue,
    setPaymentMethodRevenue,
  ] = useState([]);

  const [
    outstandingPayments,
    setOutstandingPayments,
  ] = useState([]);

  const [
    recentTransactions,
    setRecentTransactions,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    outstandingSearch,
    setOutstandingSearch,
  ] = useState("");

  const [
    outstandingStatus,
    setOutstandingStatus,
  ] = useState("ALL");

  const loadReports = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        summaryData,
        monthlyData,
        statusData,
        methodData,
        outstandingData,
        transactionData,
      ] = await Promise.all([
        adminReportService
          .getDashboardSummary(),

        adminReportService
          .getMonthlyRevenue(
            selectedYear
          ),

        adminReportService
          .getPaymentStatusReport(),

        adminReportService
          .getRevenueByPaymentMethod(),

        adminReportService
          .getOutstandingPayments(),

        adminReportService
          .getRecentTransactions(10),
      ]);

      setSummary(summaryData || {});
      setMonthlyRevenue(monthlyData);
      setStatusReport(statusData || {});
      setPaymentMethodRevenue(
        methodData
      );
      setOutstandingPayments(
        outstandingData
      );
      setRecentTransactions(
        transactionData
      );
    } catch (error) {
      console.error(
        "Unable to load reports:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedYear]);

  const availableYears = useMemo(
    () =>
      Array.from(
        { length: 6 },
        (_, index) =>
          currentYear - index
      ),
    [currentYear]
  );

  const monthlyChartData = useMemo(() => {
    const valuesByMonth =
      new Map(
        monthlyRevenue.map(
          (item) => [
            Number(item.month),
            Number(item.revenue || 0),
          ]
        )
      );

    return monthShortNames.map(
      (monthName, index) => ({
        month: monthName,
        revenue:
          valuesByMonth.get(
            index + 1
          ) || 0,
      })
    );
  }, [monthlyRevenue]);

  const statusChartData = useMemo(
    () => [
      {
        key: "PAID",
        name: "Paid",
        value: Number(
          statusReport.paid ??
            summary.paidPayments ??
            0
        ),
      },
      {
        key: "PENDING",
        name: "Pending",
        value: Number(
          statusReport.pending ??
            summary.pendingPayments ??
            0
        ),
      },
      {
        key: "PARTIALLY_PAID",
        name: "Partially Paid",
        value: Number(
          statusReport.partiallyPaid ??
            statusReport.partiallyPaidPayments ??
            summary.partiallyPaidPayments ??
            0
        ),
      },
      {
        key: "REJECTED",
        name: "Rejected",
        value: Number(
          statusReport.rejected ??
            summary.rejectedPayments ??
            0
        ),
      },
    ],
    [statusReport, summary]
  );

  const methodChartData = useMemo(
    () =>
      paymentMethodRevenue.map(
        (item) => ({
          method: formatLabel(
            item.paymentMethod ??
              item.method
          ),

          count: Number(
            item.paymentCount ??
              item.count ??
              item.transactionCount ??
              0
          ),

          totalRevenue: Number(
            item.totalRevenue ??
              item.revenue ??
              item.amount ??
              0
          ),
        })
      ),
    [paymentMethodRevenue]
  );

  const totalStatusRecords =
    statusChartData.reduce(
      (total, item) =>
        total + item.value,
      0
    );

  const filteredOutstandingPayments =
    useMemo(() => {
      const search =
        outstandingSearch
          .trim()
          .toLowerCase();

      return outstandingPayments.filter(
        (payment) => {
          const searchableValues = [
            payment.paymentId,
            payment.customerId,
            payment.paymentReference,
            payment.paymentType,
            payment.paymentMethod,
            payment.paymentStatus,
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
            outstandingStatus ===
              "ALL" ||
            normalizeStatus(
              payment.paymentStatus
            ) === outstandingStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      outstandingPayments,
      outstandingSearch,
      outstandingStatus,
    ]);

  const summaryCards = [
    {
      title: "Total Revenue",
      value: formatCompactMoney(
        summary.totalRevenue
      ),
      fullValue: formatMoney(
        summary.totalRevenue
      ),
      subtitle:
        "Total verified payment value",
      icon: <TrendingUpRounded />,

      gradient:
        "linear-gradient(145deg, #1674dc, #5baeff)",
    },
    {
      title: "Outstanding",
      value: formatCompactMoney(
        summary.totalOutstandingAmount
      ),
      fullValue: formatMoney(
        summary.totalOutstandingAmount
      ),
      subtitle:
        "Pending collection amount",
      icon: <PendingActionsRounded />,

      gradient:
        "linear-gradient(145deg, #e29b29, #ffc86a)",
    },
    {
      title: "Completed Payments",
      value:
        summary.paidPayments || 0,
      subtitle:
        "Successfully verified records",
      icon: <CheckCircleRounded />,

      gradient:
        "linear-gradient(145deg, #1e9e78, #59d6ad)",
    },
    {
      title: "Total Payments",
      value:
        summary.totalPayments || 0,
      subtitle:
        "All submitted payment records",
      icon:
        <AccountBalanceWalletRounded />,

      gradient:
        "linear-gradient(145deg, #7356d9, #a793ff)",
    },
  ];

  const handleExportReport = () => {
    const reportRows = [
      {
        reportSection:
          "Summary",
        metric: "Total Payments",
        value:
          summary.totalPayments || 0,
      },
      {
        reportSection:
          "Summary",
        metric: "Paid Payments",
        value:
          summary.paidPayments || 0,
      },
      {
        reportSection:
          "Summary",
        metric: "Pending Payments",
        value:
          summary.pendingPayments || 0,
      },
      {
        reportSection:
          "Summary",
        metric:
          "Partially Paid Payments",
        value:
          summary.partiallyPaidPayments ||
          0,
      },
      {
        reportSection:
          "Summary",
        metric: "Rejected Payments",
        value:
          summary.rejectedPayments ||
          0,
      },
      {
        reportSection:
          "Summary",
        metric: "Total Revenue",
        value:
          summary.totalRevenue || 0,
      },
      {
        reportSection:
          "Summary",
        metric:
          "Outstanding Amount",
        value:
          summary.totalOutstandingAmount ||
          0,
      },

      ...monthlyChartData.map(
        (item) => ({
          reportSection:
            "Monthly Revenue",
          metric: `${item.month} ${selectedYear}`,
          value: item.revenue,
        })
      ),

      ...methodChartData.map(
        (item) => ({
          reportSection:
            "Payment Method",
          metric: item.method,
          value: item.totalRevenue,
        })
      ),
    ];

    downloadCsv(
      `skyline-payment-report-${selectedYear}.csv`,
      reportRows
    );
  };

  const handleExportOutstanding = () => {
    const rows =
      filteredOutstandingPayments.map(
        (payment) => ({
          paymentId:
            payment.paymentId,

          customerId:
            payment.customerId,

          paymentReference:
            payment.paymentReference,

          paymentType:
            formatLabel(
              payment.paymentType
            ),

          paymentMethod:
            formatLabel(
              payment.paymentMethod
            ),

          status:
            formatLabel(
              payment.paymentStatus
            ),

          totalPayableAmount:
            payment.totalPayableAmount ??
            payment.amount ??
            0,

          paidAmount:
            payment.paidAmount ?? 0,

          outstandingAmount:
            payment.outstandingAmount ??
            payment.totalPayableAmount ??
            payment.amount ??
            0,

          paymentDate:
            payment.paymentDate,
        })
      );

    downloadCsv(
      `outstanding-payments-${selectedYear}.csv`,
      rows
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Stack
      spacing={3}
      sx={{
        maxWidth: 1500,
        mx: "auto",

        "@media print": {
          "& button": {
            display: "none",
          },
        },
      }}
    >
      {/* Heading */}
      <Stack
            direction={{
                xs: "column",
                lg: "row",
            }}
            justifyContent="space-between"
            alignItems={{
                xs: "stretch",
                lg: "center",
            }}
            spacing={2}
            >
            <Box>
                <Typography
                variant="h4"
                fontWeight={900}
                color="#172033"
                sx={{
                    letterSpacing: "-0.7px",
                }}
                >
                Reports and Analytics
                </Typography>

                <Typography
                color="text.secondary"
                sx={{ mt: 0.65 }}
                >
                Monitor revenue, payment performance, outstanding balances and
                transaction activity.
                </Typography>
            </Box>

            <Stack
                direction={{
                xs: "column",
                sm: "row",
                }}
                spacing={1}
                sx={{
                flexShrink: 0,
                alignItems: "stretch",
                }}
            >
                <FormControl
                size="small"
                sx={{
                    width: {
                    xs: "100%",
                    sm: 160,
                    },

                    "& .MuiOutlinedInput-root": {
                    height: 48,
                    borderRadius: "14px",
                    backgroundColor:
                        "rgba(255,255,255,0.88)",

                    backdropFilter:
                        "blur(16px)",

                    boxShadow:
                        "0 8px 24px rgba(51,65,85,0.06)",
                    },
                }}
                >
                <InputLabel>
                    Report Year
                </InputLabel>

                <Select
                    value={selectedYear}
                    label="Report Year"
                    onChange={(event) =>
                    setSelectedYear(
                        Number(event.target.value)
                    )
                    }
                    startAdornment={
                    <InputAdornment position="start">
                        <CalendarMonthRounded
                        fontSize="small"
                        />
                    </InputAdornment>
                    }
                >
                    {availableYears.map((year) => (
                    <MenuItem
                        key={year}
                        value={year}
                    >
                        {year}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>

                <Button
                variant="outlined"
                startIcon={<PrintRounded />}
                onClick={handlePrint}
                sx={{
                    width: {
                    xs: "100%",
                    sm: 160,
                    },

                    height: 48,
                    borderRadius: "14px",
                    fontWeight: 800,
                    textTransform: "none",

                    backgroundColor:
                    "rgba(255,255,255,0.82)",

                    backdropFilter:
                    "blur(16px)",

                    borderColor:
                    "rgba(79,70,229,0.28)",

                    boxShadow:
                    "0 8px 24px rgba(51,65,85,0.06)",

                    "&:hover": {
                    borderColor: "#4f46e5",
                    backgroundColor:
                        "rgba(79,70,229,0.05)",

                    transform:
                        "translateY(-2px)",
                    },

                    "&:active": {
                    transform: "scale(0.97)",
                    },
                }}
                >
                Print
                </Button>

                <Button
                variant="contained"
                startIcon={<DownloadRounded />}
                onClick={handleExportReport}
                disabled={loading}
                sx={{
                    width: {
                    xs: "100%",
                    sm: 160,
                    },

                    height: 48,
                    borderRadius: "14px",
                    fontWeight: 800,
                    textTransform: "none",

                    background:
                    "linear-gradient(135deg, #4f46e5, #6366f1)",

                    boxShadow:
                    "0 10px 25px rgba(79,70,229,0.24)",

                    "&:hover": {
                    background:
                        "linear-gradient(135deg, #4338ca, #5b5ce8)",

                    transform:
                        "translateY(-2px)",

                    boxShadow:
                        "0 13px 29px rgba(79,70,229,0.30)",
                    },

                    "&:active": {
                    transform: "scale(0.97)",
                    },
                }}
                >
                Export Report
                </Button>
            </Stack>
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

      {/* Summary */}
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
                  scale: 1.008,
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

                        borderRadius:
                          "18px",

                        color: "#ffffff",

                        background:
                          card.gradient,

                        boxShadow:
                          "0 12px 25px rgba(55,108,168,0.20)",
                      }}
                    >
                      {card.icon}
                    </Box>

                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={650}
                      >
                        {card.title}
                      </Typography>

                      {loading ? (
                        <Skeleton
                          width={110}
                          height={38}
                        />
                      ) : (
                        <Typography
                          variant="h5"
                          fontWeight={900}
                          color="#17263a"
                          title={
                            card.fullValue
                          }
                          noWrap
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

      {/* Revenue charts */}
      <Grid container spacing={2.5}>
        <Grid
          size={{
            xs: 12,
            xl: 8,
          }}
        >
          <Card
            elevation={0}
            sx={chartCard}
          >
            <CardContent
              sx={{
                p: 3,

                "&:last-child": {
                  pb: 3,
                },
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 2.5 }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={850}
                    color="#172033"
                  >
                    Monthly Revenue
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.4 }}
                  >
                    Verified revenue
                    performance during{" "}
                    {selectedYear}.
                  </Typography>
                </Box>

                <Chip
                  icon={
                    <TrendingUpRounded />
                  }
                  label={`${selectedYear} Revenue`}
                  color="primary"
                  variant="outlined"
                  sx={{
                    alignSelf:
                      "flex-start",
                    fontWeight: 750,
                  }}
                />
              </Stack>

              {loading ? (
                <Skeleton
                  variant="rounded"
                  height={350}
                  sx={{
                    borderRadius: "18px",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >
                  <ResponsiveContainer>
                    <LineChart
                      data={
                        monthlyChartData
                      }
                      margin={{
                        top: 10,
                        right: 20,
                        left: 5,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="rgba(148,163,184,0.20)"
                      />

                      <XAxis
                        dataKey="month"
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tickFormatter={(
                          value
                        ) =>
                          Number(value) >=
                          1_000_000
                            ? `${(
                                Number(
                                  value
                                ) /
                                1_000_000
                              ).toFixed(
                                1
                              )}M`
                            : `${(
                                Number(
                                  value
                                ) / 1000
                              ).toFixed(
                                0
                              )}K`
                        }
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        content={
                          <CustomTooltip />
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: "#ffffff",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            xl: 4,
          }}
        >
          <Card
            elevation={0}
            sx={chartCard}
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
                Payment Status
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.4 }}
              >
                Current payment status
                distribution.
              </Typography>

              {loading ? (
                <Skeleton
                  variant="circular"
                  width={250}
                  height={250}
                  sx={{
                    mx: "auto",
                    mt: 3,
                  }}
                />
              ) : (
                <>
                  <Box
                    sx={{
                      height: 270,
                      mt: 1,
                      position:
                        "relative",
                    }}
                  >
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={
                            statusChartData
                          }
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={72}
                          outerRadius={105}
                          paddingAngle={3}
                        >
                          {statusChartData.map(
                            (item) => (
                              <Cell
                                key={
                                  item.key
                                }
                                fill={
                                  STATUS_COLORS[
                                    item
                                      .key
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(
                            value,
                            name
                          ) => [
                            Number(
                              value
                            ).toLocaleString(),
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <Box
                      sx={{
                        position:
                          "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems:
                          "center",
                        pointerEvents:
                          "none",
                      }}
                    >
                      <Box
                        textAlign="center"
                      >
                        <Typography
                          variant="h4"
                          fontWeight={900}
                        >
                          {
                            totalStatusRecords
                          }
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Payments
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Grid
                    container
                    spacing={1.2}
                  >
                    {statusChartData.map(
                      (item) => (
                        <Grid
                          key={item.key}
                          size={{
                            xs: 6,
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.3,

                              borderRadius:
                                "13px",

                              backgroundColor:
                                "#f8fafc",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 9,
                                  height: 9,

                                  borderRadius:
                                    "50%",

                                  backgroundColor:
                                    STATUS_COLORS[
                                      item
                                        .key
                                    ],
                                }}
                              />

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.name}
                              </Typography>
                            </Stack>

                            <Typography
                              fontWeight={850}
                              sx={{ mt: 0.3 }}
                            >
                              {item.value}
                            </Typography>
                          </Box>
                        </Grid>
                      )
                    )}
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment method revenue */}
      <Card
        elevation={0}
        sx={chartCard}
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
            Revenue by Payment Method
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.4,
              mb: 2.5,
            }}
          >
            Compare revenue collected through
            each payment method.
          </Typography>

          {loading ? (
            <Skeleton
              variant="rounded"
              height={330}
              sx={{
                borderRadius: "18px",
              }}
            />
          ) : methodChartData.length ===
            0 ? (
            <Box
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <PaymentsRounded
                sx={{
                  fontSize: 50,
                  color: "#94a3b8",
                }}
              />

              <Typography
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                No payment-method revenue data
                is available.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                height: 330,
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={methodChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 5,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(148,163,184,0.20)"
                  />

                  <XAxis
                    dataKey="method"
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tickFormatter={(
                      value
                    ) =>
                      Number(value) >=
                      1_000_000
                        ? `${(
                            Number(value) /
                            1_000_000
                          ).toFixed(1)}M`
                        : `${(
                            Number(value) /
                            1000
                          ).toFixed(0)}K`
                    }
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={
                      <CustomTooltip />
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="totalRevenue"
                    name="Revenue"
                    radius={[
                      9,
                      9,
                      0,
                      0,
                    ]}
                  >
                    {methodChartData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            METHOD_COLORS[
                              index %
                                METHOD_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Outstanding */}
      <Card
        elevation={0}
        sx={glassCard}
      >
        <CardContent
          sx={{
            p: 3,

            "&:last-child": {
              pb: 3,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={850}
                color="#172033"
              >
                Outstanding Payments
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.4 }}
              >
                Pending and partially paid
                payment records.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={
                <DownloadRounded />
              }
              onClick={
                handleExportOutstanding
              }
              disabled={
                filteredOutstandingPayments.length ===
                0
              }
              sx={{
                borderRadius: "13px",
              }}
            >
              Export Outstanding
            </Button>
          </Stack>

          <Grid
            container
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Grid
              size={{
                xs: 12,
                md: 8,
              }}
            >
              <TextField
                fullWidth
                label="Search outstanding payments"
                placeholder="Reference, customer, type or method"
                value={outstandingSearch}
                onChange={(event) =>
                  setOutstandingSearch(
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
                md: 4,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Payment Status
                </InputLabel>

                <Select
                  value={
                    outstandingStatus
                  }
                  label="Payment Status"
                  onChange={(event) =>
                    setOutstandingStatus(
                      event.target.value
                    )
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListRounded
                        fontSize="small"
                      />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="ALL">
                    All outstanding
                  </MenuItem>

                  <MenuItem value="PENDING">
                    Pending
                  </MenuItem>

                  <MenuItem value="PARTIALLY_PAID">
                    Partially Paid
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Stack spacing={1.3}>
              {[1, 2, 3].map(
                (item) => (
                  <Skeleton
                    key={item}
                    variant="rounded"
                    height={105}
                    sx={{
                      borderRadius: "17px",
                    }}
                  />
                )
              )}
            </Stack>
          ) : filteredOutstandingPayments.length ===
            0 ? (
            <Box
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <CheckCircleRounded
                sx={{
                  fontSize: 50,
                  color: "#94a3b8",
                }}
              />

              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ mt: 1 }}
              >
                No outstanding payments
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                No outstanding payment records
                match the selected filters.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.3}>
              {filteredOutstandingPayments.map(
                (payment) => {
                  const totalPayable =
                    Number(
                      payment.totalPayableAmount ??
                        payment.amount ??
                        0
                    );

                  const paidAmount =
                    Number(
                      payment.paidAmount ??
                        0
                    );

                  const outstandingAmount =
                    Number(
                      payment.outstandingAmount ??
                        totalPayable -
                          paidAmount
                    );

                  const paidPercentage =
                    totalPayable > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (paidAmount /
                              totalPayable) *
                              100
                          )
                        )
                      : 0;

                  const status =
                    normalizeStatus(
                      payment.paymentStatus
                    );

                  return (
                    <MotionCard
                      key={
                        payment.paymentId
                      }
                      elevation={0}
                      whileHover={{
                        y: -3,
                      }}
                      sx={{
                        borderRadius:
                          "18px",

                        border:
                          "1px solid rgba(148,163,184,0.14)",

                        backgroundColor:
                          "rgba(248,250,252,0.82)",

                        boxShadow: "none",
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 2.2,

                          "&:last-child": {
                            pb: 2.2,
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
                              spacing={1.4}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  width: 46,
                                  height: 46,

                                  color:
                                    "#2563eb",

                                  backgroundColor:
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
                              lg: 1.5,
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
                                totalPayable
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
                              Paid
                            </Typography>

                            <Typography
                              fontWeight={800}
                              color="success.main"
                            >
                              {formatMoney(
                                paidAmount
                              )}
                            </Typography>
                          </Grid>

                          <Grid
                            size={{
                              xs: 6,
                              sm: 3,
                              lg: 1.8,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Outstanding
                            </Typography>

                            <Typography
                              fontWeight={850}
                              color="warning.dark"
                            >
                              {formatMoney(
                                outstandingAmount
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

                            <Box
                              sx={{ mt: 0.45 }}
                            >
                              <Chip
                                size="small"
                                label={formatLabel(
                                  status
                                )}
                                color={
                                  paymentStatusColors[
                                    status
                                  ] ||
                                  "default"
                                }
                                sx={{
                                  fontWeight:
                                    750,
                                }}
                              />
                            </Box>
                          </Grid>

                          <Grid
                            size={{
                              xs: 12,
                              lg: 2.9,
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              sx={{ mb: 0.7 }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Payment progress
                              </Typography>

                              <Typography
                                variant="caption"
                                fontWeight={800}
                              >
                                {paidPercentage.toFixed(
                                  0
                                )}
                                %
                              </Typography>
                            </Stack>

                            <Box
                              sx={{
                                height: 8,
                                overflow:
                                  "hidden",

                                borderRadius:
                                  "999px",

                                backgroundColor:
                                  "rgba(148,163,184,0.20)",
                              }}
                            >
                              <Box
                                sx={{
                                  height:
                                    "100%",

                                  width: `${paidPercentage}%`,

                                  borderRadius:
                                    "999px",

                                  background:
                                    "linear-gradient(90deg, #4f46e5, #60a5fa)",

                                  transition:
                                    "width 300ms ease",
                                }}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </MotionCard>
                  );
                }
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card
        elevation={0}
        sx={glassCard}
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
            Recent Transactions
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.4,
              mb: 2.5,
            }}
          >
            Latest processed transaction
            activity across the platform.
          </Typography>

          {loading ? (
            <Stack spacing={1.3}>
              {[1, 2, 3].map(
                (item) => (
                  <Skeleton
                    key={item}
                    variant="rounded"
                    height={92}
                    sx={{
                      borderRadius: "17px",
                    }}
                  />
                )
              )}
            </Stack>
          ) : recentTransactions.length ===
            0 ? (
            <Box
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <AssessmentRounded
                sx={{
                  fontSize: 50,
                  color: "#94a3b8",
                }}
              />

              <Typography
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                No recent transactions are
                available.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.2}>
              {recentTransactions.map(
                (transaction) => (
                  <Box
                    key={
                      transaction.transactionId
                    }
                    sx={{
                      p: 2,

                      borderRadius: "17px",

                      backgroundColor:
                        "rgba(248,250,252,0.84)",

                      border:
                        "1px solid rgba(148,163,184,0.13)",
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
                          md: 3,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.4}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,

                              color:
                                "#4f46e5",

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
                              {transaction.transactionNumber ||
                                `Transaction #${transaction.transactionId}`}
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
                        </Stack>
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
                          Customer
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={750}
                        >
                          {transaction.customerName ||
                            "Not available"}
                        </Typography>
                      </Grid>

                      <Grid
                        size={{
                          xs: 6,
                          md: 1.6,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Payment ID
                        </Typography>

                        <Typography
                          fontWeight={750}
                        >
                          #
                          {transaction.paymentId ||
                            "N/A"}
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
                          md: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Status
                        </Typography>

                        <Box
                          sx={{ mt: 0.4 }}
                        >
                          <Chip
                            size="small"
                            label={formatLabel(
                              transaction.transactionStatus
                            )}
                            color={
                              normalizeStatus(
                                transaction.transactionStatus
                              ) ===
                              "SUCCESS"
                                ? "success"
                                : "default"
                            }
                            sx={{
                              fontWeight:
                                750,
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          md: 2.1,
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
                    </Grid>
                  </Box>
                )
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default AdminReportsPage;