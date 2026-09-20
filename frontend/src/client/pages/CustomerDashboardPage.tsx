import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, FileText, Wallet, Heart, ArrowRight, Bell,
  Clock, MapPin, Plus, ChevronRight, TrendingUp, Calendar,
  Star, MessageSquareQuote
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import { appointmentService } from '@/shared/services/appointmentService';
import { reservationService } from '@/shared/services/reservationService';
import { paymentService } from '@/shared/services/paymentService';
import type { Appointment, Reservation, Payment } from '@/shared/types';
import { formatCurrency, formatDate, countdownTo, timeAgo } from '@/shared/utils/format';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import EmptyState from '@/shared/components/ui/EmptyState';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { count: favCount } = useFavorites();
  const { notifications, unreadCount } = useNotifications();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    Promise.all([
      appointmentService.getByCustomer(user.email).catch(() => []),
      reservationService.getByCustomer(user.email).catch(() => []),
      paymentService.getByCustomer(user.email).catch(() => []),
    ]).then(([appts, rsvs, pays]) => {
      if (!active) return;
      setAppointments(Array.isArray(appts) ? appts : []);
      setReservations(Array.isArray(rsvs) ? rsvs : []);
      setPayments(Array.isArray(pays) ? pays : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  if (!user) return null;

  // KPIs
  const activeAppointments = appointments.filter(
    (a) => ['Pending', 'Approved', 'Rescheduled'].includes(a.status),
  ).length;

  const pendingReservations = reservations.filter(
    (r) => ['Pending', 'Confirmed'].includes(r.status),
  ).length;

  const outstandingBalance = payments
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3);

  const activeReservations = reservations
    .filter((r) => ['Pending', 'Confirmed'].includes(r.status))
    .slice(0, 3);

  const recentNotifications = notifications.slice(0, 4);

  // Quick Navigation links - මෙතනට Reviews link එක දැම්මා
  const quickActions = [
    { label: 'Browse Apartments', to: '/apartments', icon: <MapPin className="w-4 h-4 text-amber-600" /> },
    { label: 'Book Viewing', to: '/appointments', icon: <CalendarCheck className="w-4 h-4 text-amber-600" /> },
    { label: 'Compare Properties', to: '/compare', icon: <TrendingUp className="w-4 h-4 text-amber-600" /> },
    { label: 'Submit Inquiry', to: '/inquiries', icon: <FileText className="w-4 h-4 text-amber-600" /> },
    { label: 'My Reviews & Feedback', to: '/reviews', icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                My Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Overview of your residence appointments, reservations, and saved units.
              </p>
            </div>
            
            {/* Header Buttons */}
            <div className="flex items-center gap-3">
              {/* මෙන්න කෙළින්ම Reviews Page එකට යන Button එක */}
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-amber-50 hover:border-amber-300 text-slate-800 font-bold text-xs transition cursor-pointer shadow-sm"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>My Reviews</span>
              </Link>

              <Link to="/apartments">
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
                >
                  Browse Residences
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Card 1 */}
          <Link 
            to="/appointments" 
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Viewings</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : activeAppointments}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Active Appointments</p>
          </Link>

          {/* Card 2 */}
          <Link 
            to="/reservations" 
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Holds</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : pendingReservations}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Pending Reservations</p>
          </Link>

          {/* Card 3 */}
          <Link 
            to="/payments" 
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Balance</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
              {loading ? '-' : formatCurrency(outstandingBalance)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Outstanding Balance</p>
          </Link>

          {/* Card 4 */}
          <Link 
            to="/favorites" 
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {favCount}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Favorite Units</p>
          </Link>

        </div>

        {/* Main Content Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Appointments & Reservations */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recent Appointments Block */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recent Appointments</h2>
                  <p className="text-xs text-slate-500">Upcoming and concluded residence visits</p>
                </div>
                <Link to="/appointments" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentAppointments.length === 0 ? (
                <EmptyState
                  variant="inbox"
                  title="No appointments scheduled"
                  description="You haven't booked any viewing appointments yet."
                  action={
                    <Link to="/apartments">
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 mt-2">
                        Browse Residences
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {recentAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition gap-3"
                    >
                      <div>
                        <Link to={`/apartments/${apt.apartmentId}`} className="font-bold text-slate-900 text-sm hover:text-amber-600 transition">
                          {apt.apartmentTitle}
                        </Link>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            {formatDate(apt.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {apt.timeSlot}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Badge variant={statusToVariant(apt.status)} dot size="sm">
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Reservations Block */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active Reservations</h2>
                  <p className="text-xs text-slate-500">48-hour property holds under your account</p>
                </div>
                <Link to="/reservations" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : activeReservations.length === 0 ? (
                <EmptyState
                  variant="inbox"
                  title="No active reservations"
                  description="Reserve an apartment to place a guaranteed 48-hour purchasing hold."
                />
              ) : (
                <div className="space-y-3">
                  {activeReservations.map((rsv) => {
                    const cd = countdownTo(rsv.expiresAt);
                    return (
                      <div key={rsv.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-slate-900 text-sm">{rsv.apartmentTitle}</p>
                          <Badge variant={statusToVariant(rsv.status)} dot size="sm">
                            {rsv.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/50">
                          <span className="text-slate-500">
                            Hold Fee: <span className="font-bold text-slate-900">{formatCurrency(rsv.reservationFee)}</span>
                          </span>
                          <span className={`font-semibold flex items-center gap-1 ${cd.expired ? 'text-rose-600' : 'text-amber-700'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {cd.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Quick Navigation & Notifications */}
          <div className="space-y-8">
            
            {/* Quick Navigation Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Quick Navigation
              </h2>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/60 border border-transparent hover:border-amber-200 transition group"
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                      {action.icon}
                      {action.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                {unreadCount > 0 && (
                  <Badge variant="error" size="sm" dot>
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {recentNotifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent updates</p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${
                        notif.read ? 'bg-slate-50/50 border-slate-100' : 'bg-amber-50/40 border-amber-200/60'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  <Link to="/notifications" className="block pt-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-amber-700 hover:bg-amber-50">
                      View All Notifications
                    </Button>
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}