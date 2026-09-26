import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/shared/contexts/AuthContext';
import { FavoritesProvider } from '@/shared/contexts/FavoritesContext';
import { NotificationsProvider } from '@/shared/contexts/NotificationsContext';
import { ToastProvider } from '@/shared/components/ui/Toast';
import ClientLayout from '@/shared/components/layout/ClientLayout';
import ManagementLayout from '@/shared/components/layout/ManagementLayout';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { PageSkeleton } from '@/shared/components/ui/Skeleton';

const HomePage = lazy(() => import('@/client/pages/HomePage'));
const LoginPage = lazy(() => import('@/client/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/client/pages/RegisterPage'));
const ProfilePage = lazy(() => import('@/client/pages/ProfilePage'));
const PaymentsPage = lazy(() => import('@/client/pages/PaymentsPage'));
const PaymentHistoryPage = lazy(() => import('@/client/pages/PaymentHistoryPage'));

const VerifyPaymentsPage = lazy(() => import('@/management/pages/VerifyPaymentsPage'));
const ReportsPage = lazy(() => import('@/management/pages/ReportsPage'));
const ManageUsersPage = lazy(() => import('@/management/pages/ManageUsersPage'));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <FavoritesProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  {/* Client routes */}
                  <Route element={<ClientLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
                    <Route path="/payment-history" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
                  </Route>

                  {/* Management routes */}
                  <Route path="/management" element={<ProtectedRoute roles={['staff', 'admin']}><ManagementLayout /></ProtectedRoute>}>
                    <Route index element={<VerifyPaymentsPage />} />
                    <Route path="payments" element={<VerifyPaymentsPage />} />
                    <Route path="reports" element={<ProtectedRoute roles={['admin']}><ReportsPage /></ProtectedRoute>} />
                    <Route path="users" element={<ProtectedRoute roles={['admin']}><ManageUsersPage /></ProtectedRoute>} />
                  </Route>

                  <Route path="*" element={<Navigate to="/payments" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NotificationsProvider>
        </FavoritesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
