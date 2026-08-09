import api from "../api/axiosConfig";

const getMyProfile = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

const updateMyProfile = async (profileData) => {
  const response = await api.put(
    "/users/me",
    profileData
  );

  return response.data;
};

const changePassword = async (passwordData) => {
  const response = await api.put(
    "/users/me/password",
    passwordData
  );

  return response.data;
};

const uploadProfileImage = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.put(
    "/users/me/profile-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

const removeProfileImage = async () => {
  const response = await api.delete(
    "/users/me/profile-image"
  );

  return response.data;
};

/*
 * The profile image endpoint is protected.
 * Therefore, load it through Axios so the JWT header is included.
 */
const getProtectedImage = async (fileUrl) => {
  if (!fileUrl) {
    return null;
  }

  let endpoint = fileUrl;

  // Axios base URL already ends with /api.
  // Convert /api/files/... into /files/...
  if (endpoint.startsWith("/api/")) {
    endpoint = endpoint.substring(4);
  }

  const response = await api.get(endpoint, {
    responseType: "blob",
  });

  return response.data;
};

const userService = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  uploadProfileImage,
  removeProfileImage,
  getProtectedImage,
};

export default userService;