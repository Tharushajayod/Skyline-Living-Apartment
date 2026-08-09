import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  Box,
  CircularProgress,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";

const ModuleRoute = ({
  moduleName,
}) => {
  const {
    loading,
    isAuthenticated,
    canAccess,
  } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!canAccess(moduleName)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return <Outlet />;
};

export default ModuleRoute;