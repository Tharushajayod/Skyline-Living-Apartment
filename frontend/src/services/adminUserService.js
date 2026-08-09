import api from "../api/axiosConfig";

const getAllUsers = async () => {
  const response = await api.get("/admin/users");

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const getUserById = async (userId) => {
  const response = await api.get(
    `/admin/users/${userId}`
  );

  return response.data;
};

const updateUserStatus = async (
  userId,
  status
) => {
  const response = await api.patch(
    `/admin/users/${userId}/status`,
    {
      status,
    }
  );

  return response.data;
};

const getAllStaff = async () => {
  const response = await api.get(
    "/admin/staff"
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

const createStaff = async (staffData) => {
  const response = await api.post(
    "/admin/staff",
    staffData
  );

  return response.data;
};

const adminUserService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllStaff,
  createStaff,
};

export default adminUserService;