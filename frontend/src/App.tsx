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

// Lazy-loaded Client pages
const HomePage = lazy(() => import('@/client/pages/HomePage'));
const ApartmentListingPage = lazy(() => import('@/client/pages/ApartmentListingPage'));
const ApartmentDetailsPage = lazy(() => import('@/client/pages/ApartmentDetailsPage'));
const ComparePage = lazy(() => import('@/client/pages/ComparePage'));
const LoginPage = lazy(() => import('@/client/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/client/pages/RegisterPage'));
const CustomerDashboardPage = lazy(() => import('@/client/pages/CustomerDashboardPage'));
const ProfilePage = lazy(() => import('@/client/pages/ProfilePage'));
const AppointmentsPage = lazy(() => import('@/client/pages/AppointmentsPage'));
const ReservationsPage = lazy(() => import('@/client/pages/ReservationsPage'));
const PaymentsPage = lazy(() => import('@/client/pages/PaymentsPage'));
const PaymentHistoryPage = lazy(() => import('@/client/pages/PaymentHistoryPage'));
const InquiriesPage = lazy(() => import('@/client/pages/InquiriesPage'));
const FavoritesPage = lazy(() => import('@/client/pages/FavoritesPage'));
const ReviewsPage = lazy(() => import('@/client/pages/ReviewsPage'));
const NotificationsPage = lazy(() => import('@/client/pages/NotificationsPage'));

// Lazy-loaded Management pages
const ManagementDashboardPage = lazy(() => import('@/management/pages/ManagementDashboardPage'));
const ManageApartmentsPage = lazy(() => import('@/management/pages/ManageApartmentsPage'));
const ManageAppointmentsPage = lazy(() => import('@/management/pages/ManageAppointmentsPage'));
const ManageReservationsPage = lazy(() => import('@/management/pages/ManageReservationsPage'));
const VerifyPaymentsPage = lazy(() => import('@/management/pages/VerifyPaymentsPage'));
const ManageInquiriesPage = lazy(() => import('@/management/pages/ManageInquiriesPage'));
const ModerateReviewsPage = lazy(() => import('@/management/pages/ModerateReviewsPage'));
const ManageSalesPage = lazy(() => import('@/management/pages/ManageSalesPage'));
const ManageUsersPage = lazy(() => import('@/management/pages/ManageUsersPage'));
const ReportsPage = lazy(() => import('@/management/pages/ReportsPage'));

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
                    <Route path="/apartments" element={<ApartmentListingPage />} />
                    <Route path="/apartments/:id" element={<ApartmentDetailsPage />} />
                    <Route path="/compare" element={<ComparePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboardPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
                    <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
                    <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
                    <Route path="/payment-history" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
                    <Route path="/inquiries" element={<ProtectedRoute><InquiriesPage /></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                    <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  </Route>

                  {/* Management routes (staff + admin share dashboard) */}
                  <Route path="/management" element={<ProtectedRoute roles={['staff', 'admin']}><ManagementLayout /></ProtectedRoute>}>
                    <Route index element={<ManagementDashboardPage />} />
                    <Route path="apartments" element={<ManageApartmentsPage />} />
                    <Route path="appointments" element={<ManageAppointmentsPage />} />
                    <Route path="reservations" element={<ManageReservationsPage />} />
                    <Route path="payments" element={<VerifyPaymentsPage />} />
                    <Route path="inquiries" element={<ManageInquiriesPage />} />
                    <Route path="reviews" element={<ModerateReviewsPage />} />
                    <Route path="sales" element={<ManageSalesPage />} />
                    <Route path="users" element={<ProtectedRoute roles={['admin']}><ManageUsersPage /></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute roles={['admin']}><ReportsPage /></ProtectedRoute>} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
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
