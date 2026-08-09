import { jwtDecode } from "jwt-decode";

import api from "../api/axiosConfig";

import {
  getToken,
  removeToken,
  saveToken,
} from "../utils/tokenUtils";

/*
 * Login user and save the JWT token.
 */
const login = async (email, password) => {
  const response = await api.post(
    "/auth/login",
    {
      email,
      password,
    }
  );

  const token = response.data?.token;

  if (!token) {
    throw new Error(
      "JWT token was not included in the login response."
    );
  }

  saveToken(token);

  const decodedUser = jwtDecode(token);

  return {
    token,
    user: decodedUser,
    response: response.data,
  };
};

/*
 * Register a new customer account.
 */
const register = async (registrationData) => {
  const response = await api.post(
    "/auth/register",
    registrationData
  );

  return response.data;
};

/*
 * Remove the saved token.
 */
const logout = () => {
  removeToken();
};

/*
 * Read the current user from the saved JWT token.
 */
const getCurrentUser = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const decodedUser = jwtDecode(token);

    const expirationTime =
      decodedUser.exp * 1000;

    if (expirationTime <= Date.now()) {
      removeToken();
      return null;
    }

    return decodedUser;
  } catch (error) {
    console.error(
      "Unable to decode saved JWT token:",
      error
    );

    removeToken();
    return null;
  }
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
};

export default authService;