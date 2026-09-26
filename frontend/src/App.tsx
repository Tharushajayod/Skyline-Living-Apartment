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
const CustomerDashboardPage = lazy(() => import('@/client/pages/CustomerDashboardPage'));
const ProfilePage = lazy(() => import('@/client/pages/ProfilePage'));
const ReservationsPage = lazy(() => import('@/client/pages/ReservationsPage'));

const ManageReservationsPage = lazy(() => import('@/management/pages/ManageReservationsPage'));
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
                    <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboardPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
                  </Route>

                  {/* Management routes */}
                  <Route path="/management" element={<ProtectedRoute roles={['staff', 'admin']}><ManagementLayout /></ProtectedRoute>}>
                    <Route index element={<ManageReservationsPage />} />
                    <Route path="reservations" element={<ManageReservationsPage />} />
                    <Route path="users" element={<ProtectedRoute roles={['admin']}><ManageUsersPage /></ProtectedRoute>} />
                  </Route>

                  <Route path="*" element={<Navigate to="/reservations" replace />} />
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
