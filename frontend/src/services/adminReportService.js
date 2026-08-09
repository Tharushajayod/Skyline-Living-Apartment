import api from "../api/axiosConfig";

const getDashboardSummary = async () => {
  const response = await api.get(
    "/payments/dashboard-summary"
  );

  return response.data;
};

const getMonthlyRevenue = async (year) => {
  const response = await api.get(
    "/payments/reports/monthly-revenue",
    {
      params: {
        year,
      },
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const getPaymentStatusReport = async () => {
  const response = await api.get(
    "/payments/reports/status"
  );

  return response.data;
};

const getOutstandingPayments = async () => {
  const response = await api.get(
    "/payments/reports/outstanding"
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const getRevenueByPaymentMethod = async () => {
  const response = await api.get(
    "/payments/reports/payment-methods"
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const getRecentTransactions = async (
  limit = 10
) => {
  const response = await api.get(
    "/payments/reports/recent-transactions",
    {
      params: {
        limit,
      },
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const adminReportService = {
  getDashboardSummary,
  getMonthlyRevenue,
  getPaymentStatusReport,
  getOutstandingPayments,
  getRevenueByPaymentMethod,
  getRecentTransactions,
};

export default adminReportService;