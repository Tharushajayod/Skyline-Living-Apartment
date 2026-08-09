import api from "../api/axiosConfig";

const getAllPayments = async () => {
  const response = await api.get("/payments");

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const getDashboardSummary = async () => {
  const response = await api.get(
    "/payments/dashboard-summary"
  );

  return response.data;
};

const getPaymentDetails = async (paymentId) => {
  const response = await api.get(
    `/payments/${paymentId}/details`
  );

  return response.data;
};

const updatePaymentStatus = async (
  paymentId,
  paymentStatus,
  rejectionReason = "",
  paidAmount = null
) => {
  const response = await api.put(
    `/payments/${paymentId}/status`,
    {
      paymentStatus,

      rejectionReason:
        paymentStatus === "REJECTED"
          ? rejectionReason.trim()
          : null,

      paidAmount:
        paymentStatus === "PARTIALLY_PAID"
          ? Number(paidAmount)
          : null,
    }
  );

  return response.data;
};

const deletePayment = async (paymentId) => {
  await api.delete(`/payments/${paymentId}`);
};

const getPendingPayments = async () => {
  const response = await api.get(
    "/payments/pending"
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const adminPaymentService = {
  getAllPayments,
  getDashboardSummary,
  getPaymentDetails,
  updatePaymentStatus,
  deletePayment,
  getPendingPayments,
};

export default adminPaymentService;