import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import ModuleRoute from "./ModuleRoute";

import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import RegisterPage from "../pages/auth/RegisterPage";

import ProfilePage from "../pages/customer/ProfilePage";
import PaymentsPage from "../pages/customer/PaymentsPage";
import TransactionsPage from "../pages/customer/TransactionsPage";
import PaymentDetailsPage from "../pages/customer/PaymentDetailsPage";
import TransactionDetailsPage from "../pages/customer/TransactionDetailsPage";

import CustomerDashboardLayout from "../layouts/CustomerDashboardLayout";
import CustomerDashboard from "../pages/customer/Dashboard";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminDashboardLayout from "../layouts/AdminDashboardLayout";

import UsersPage from "../pages/admin/UsersPage";
import StaffPage from "../pages/admin/StaffPage";
import CreateStaffPage from "../pages/admin/CreateStaffPage";

import AdminPaymentsPage from "../pages/admin/PaymentsPage";
import AdminTransactionsPage from "../pages/admin/TransactionsPage";
import AdminReportsPage from "../pages/admin/ReportsPage";

import UsersStaffManagementLayout from "../layouts/UsersStaffManagementLayout";

import PaymentTransactionManagementLayout from "../layouts/PaymentTransactionManagementLayout";

import UnauthorizedPage from "../pages/errors/UnauthorizedPage";
import NotFoundPage from "../pages/errors/NotFoundPage";

const INTERNAL_ROLES = [
  "ADMIN",
  "SALES_MANAGER",
  "CUSTOMER_RELATIONS_OFFICER",
  "OPERATIONS_MANAGER",
  "MARKETING_EXECUTIVE",
  "FINANCE_OFFICER",
];

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/forgot-password"
        element={
          <ForgotPasswordPage />
        }
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      {/* =========================
          CUSTOMER PORTAL
      ========================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "CUSTOMER",
            ]}
          />
        }
      >
        <Route
          path="/customer"
          element={
            <CustomerDashboardLayout />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="/customer/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <CustomerDashboard />
            }
          />

          <Route
            path="payments"
            element={<PaymentsPage />}
          />

          <Route
            path="payments/:paymentId"
            element={
              <PaymentDetailsPage />
            }
          />

          <Route
            path="transactions"
            element={
              <TransactionsPage />
            }
          />

          <Route
            path="transactions/:transactionId"
            element={
              <TransactionDetailsPage />
            }
          />

          <Route
            path="profile"
            element={<ProfilePage />}
          />
        </Route>
      </Route>

      {/* =========================
          SHARED MANAGEMENT PORTAL
      ========================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={
              INTERNAL_ROLES
            }
          />
        }
      >
        <Route
          path="/admin"
          element={
            <AdminDashboardLayout />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Overview - all staff */}
          <Route
            path="dashboard"
            element={
              <AdminDashboard />
            }
          />

          {/* =====================
              USERS & STAFF
              ADMIN ONLY
          ====================== */}

          <Route
            element={
              <ModuleRoute
                moduleName="usersStaff"
              />
            }
          >
            <Route
              path="users-staff"
              element={
                <UsersStaffManagementLayout />
              }
            >
              <Route
                index
                element={
                  <Navigate
                    to="/admin/users-staff/users"
                    replace
                  />
                }
              />

              <Route
                path="users"
                element={
                  <UsersPage />
                }
              />

              <Route
                path="staff"
                element={
                  <StaffPage />
                }
              />

              <Route
                path="create"
                element={
                  <CreateStaffPage />
                }
              />
            </Route>
          </Route>

          {/* =====================
              PAYMENT & TRANSACTION
          ====================== */}

          <Route
            element={
              <ModuleRoute
                moduleName="paymentsTransactions"
              />
            }
          >
            <Route
              path="payment-transaction"
              element={
                <PaymentTransactionManagementLayout />
              }
            >
              <Route
                index
                element={
                  <Navigate
                    to="/admin/payment-transaction/payments"
                    replace
                  />
                }
              />

              <Route
                path="payments"
                element={
                  <AdminPaymentsPage />
                }
              />

              <Route
                path="transactions"
                element={
                  <AdminTransactionsPage />
                }
              />
            </Route>
          </Route>

          {/* =====================
              REPORTS
          ====================== */}

          <Route
            element={
              <ModuleRoute
                moduleName="reports"
              />
            }
          >
            <Route
              path="reports"
              element={
                <AdminReportsPage />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="/unauthorized"
        element={
          <UnauthorizedPage />
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
};

export default AppRoutes;