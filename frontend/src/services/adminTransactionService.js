import api from "../api/axiosConfig";

const getAllTransactions = async () => {
  const response = await api.get(
    "/transactions"
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const getTransactionById = async (
  transactionId
) => {
  const response = await api.get(
    `/transactions/${transactionId}`
  );

  return response.data;
};

const getTransactionsByPayment = async (
  paymentId
) => {
  const response = await api.get(
    `/transactions/payment/${paymentId}`
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const updateTransactionStatus = async (
  transactionId,
  transactionStatus,
  reason = "",
  remarks = ""
) => {
  const response = await api.patch(
    `/transactions/${transactionId}/status`,
    {
      transactionStatus,

      reason:
        ["FAILED", "CANCELLED", "REFUNDED"]
          .includes(transactionStatus)
          ? reason.trim()
          : null,

      remarks: remarks.trim() || null,
    }
  );

  return response.data;
};

const deleteTransaction = async (
  transactionId
) => {
  await api.delete(
    `/transactions/${transactionId}`
  );
};

const adminTransactionService = {
  getAllTransactions,
  getTransactionById,
  getTransactionsByPayment,
  updateTransactionStatus,
  deleteTransaction,
};

export default adminTransactionService;