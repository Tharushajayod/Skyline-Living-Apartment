import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import authService from "../services/authService";

import {
  hasModuleAccess,
  isInternalRole,
} from "../config/roleAccess";

const AuthContext = createContext(null);

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const currentUser =
      authService.getCurrentUser();

    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (
    email,
    password
  ) => {
    const result =
      await authService.login(
        email,
        password
      );

    setUser(result.user);

    return result.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (
    updatedData
  ) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...updatedData,

      sub:
        updatedData?.email ||
        currentUser?.sub ||
        "",
    }));
  };

  const hasRole = (
    ...allowedRoles
  ) => {
    if (!user?.role) {
      return false;
    }

    return allowedRoles.includes(
      user.role
    );
  };

  const canAccess = (
    moduleName
  ) => {
    return hasModuleAccess(
      user?.role,
      moduleName
    );
  };

  const value = useMemo(
    () => ({
      user,
      loading,

      login,
      logout,
      updateUser,

      hasRole,
      canAccess,

      isInternalUser:
        isInternalRole(user?.role),

      isAuthenticated:
        Boolean(user),
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};