import Cookies from "js-cookie";

export const saveToken = (token) => {
  Cookies.set("token", token, {
    expires: 1,
    sameSite: "Strict",
  });
};

export const getToken = () => {
  return Cookies.get("token");
};

export const removeToken = () => {
  Cookies.remove("token");
};

export const isAuthenticated = () => {
  return !!Cookies.get("token");
};