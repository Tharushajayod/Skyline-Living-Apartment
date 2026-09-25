import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, FileText, Wallet, Heart, ArrowRight, Bell,
  Clock, MapPin, Plus, ChevronRight, TrendingUp, Calendar,
  Star, MessageSquareQuote, CheckCircle2, ShieldCheck, KeyRound,
  ExternalLink, Sparkles, AlertCircle, CheckCheck, Compass, Building2
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import { appointmentService } from '@/shared/services/appointmentService';
import { reservationService } from '@/shared/services/reservationService';
import { paymentService } from '@/shared/services/paymentService';
import { apartmentService } from '@/shared/services/apartmentService';
import { inquiryService } from '@/shared/services/inquiryService';
import type { Appointment, Reservation, Payment, Apartment, Inquiry } from '@/shared/types';
import { formatCurrency, formatDate, countdownTo, timeAgo } from '@/shared/utils/format';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import EmptyState from '@/shared/components/ui/EmptyState';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { count: favCount } = useFavorites();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh: refreshNotifications } = useNotifications();

  // Instant SWR state hydration from local cache
  const cachedAppts = user?.email ? appointmentService.getCachedByCustomer(user.email) : null;
  const cachedRsvs = user?.email ? reservationService.getCachedByCustomer(user.email) : null;
  const cachedPays = user?.email ? paymentService.getCachedByCustomer(user.email) : null;

  const [appointments, setAppointments] = useState<Appointment[]>(cachedAppts || []);
  const [reservations, setReservations] = useState<Reservation[]>(cachedRsvs || []);
  const [payments, setPayments] = useState<Payment[]>(cachedPays || []);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // Granular loading states for non-blocking asynchronous updates
  const [loadingAppts, setLoadingAppts] = useState<boolean>(!cachedAppts);
  const [loadingRsvs, setLoadingRsvs] = useState<boolean>(!cachedRsvs);
  const [loadingPays, setLoadingPays] = useState<boolean>(!cachedPays);

  // Background asynchronous concurrent data fetching
  useEffect(() => {
    if (!user?.email) return;
    let active = true;

    // 1. Appointments
    appointmentService.getByCustomer(user.email)
      .then((data) => {
        if (!active) return;
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error loading customer appointments:', err))
      .finally(() => { if (active) setLoadingAppts(false); });

    // 2. Reservations
    reservationService.getByCustomer(user.email)
      .then((data) => {
        if (!active) return;
        setReservations(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error loading customer reservations:', err))
      .finally(() => { if (active) setLoadingRsvs(false); });

    // 3. Payments
    paymentService.getByCustomer(user.email)
      .then((data) => {
        if (!active) return;
        setPayments(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error loading customer payments:', err))
      .finally(() => { if (active) setLoadingPays(false); });

    // 4. Apartments (for rich preview images & details)
    apartmentService.getAll()
      .then((data) => {
        if (!active) return;
        setApartments(Array.isArray(data) ? data : []);
      })
      .catch(() => { });

    // 5. Inquiries
    inquiryService.getByCustomer(user.email)
      .then((data) => {
        if (!active) return;
        setInquiries(Array.isArray(data) ? data : []);
      })
      .catch(() => { });

    refreshNotifications();

    return () => { active = false; };
  }, [user?.email, refreshNotifications]);

  // Contextual greeting based on user's local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // KPIs
  const activeAppointments = useMemo(() => {
    return appointments.filter((a) => ['Pending', 'Approved', 'Rescheduled'].includes(a.status)).length;
  }, [appointments]);

  const pendingReservations = useMemo(() => {
    return reservations.filter((r) => ['Pending', 'Confirmed'].includes(r.status)).length;
  }, [reservations]);

  const outstandingBalance = useMemo(() => {
    return payments
      .filter((p) => p.status === 'Pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  // Primary active reservation spotlight
  const featuredReservation = useMemo(() => {
    const active = reservations.filter((r) => ['Pending', 'Confirmed'].includes(r.status));
    if (active.length === 0) return null;
    // Pick the most urgent hold (closest to expiration)
    return [...active].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];
  }, [reservations]);

  // Apartment matching helper
  const getApartmentDetail = (aptId?: string, title?: string) => {
    if (!apartments.length) return null;
    return apartments.find((a) => a.id === aptId || (title && a.title?.toLowerCase() === title.toLowerCase()));
  };

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
      .slice(0, 3);
  }, [appointments]);

  const activeReservationsList = useMemo(() => {
    return reservations
      .filter((r) => ['Pending', 'Confirmed'].includes(r.status))
      .slice(0, 3);
  }, [reservations]);

  const recentInquiriesList = useMemo(() => {
    return [...inquiries]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 2);
  }, [inquiries]);

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 8);
  }, [notifications]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200/80 pt-8 pb-7 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Greeting & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                {greeting}, {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 font-normal">
                Here's what is happening with your active property holds, scheduled viewing appointments, and saved units.
              </p>
            </div>

            {/* Top Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">

              <Link
                to="/my-apartments"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>My Apartments</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ======================================================== */}
          {/* LEFT / MAIN DASHBOARD CANVAS (8 cols on lg, 9 on xl) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-7 min-w-0">

            {/* 1. Overview / Key Statistics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

              {/* Stat 1: Active Viewings */}
              <Link
                to="/appointments"
                className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Viewings
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {loadingAppts ? (
                      <span className="inline-block w-8 h-7 bg-slate-100 rounded-md animate-pulse" />
                    ) : (
                      activeAppointments
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Active Appointments</p>
                </div>
              </Link>

              {/* Stat 2: Active Holds */}
              <Link
                to="/reservations"
                className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Holds
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {loadingRsvs ? (
                      <span className="inline-block w-8 h-7 bg-slate-100 rounded-md animate-pulse" />
                    ) : (
                      pendingReservations
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Active 48-Hour Holds</p>
                </div>
              </Link>

              {/* Stat 3: Balance / Payments */}
              <Link
                to="/payments"
                className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Balance
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight tabular-nums truncate">
                    {loadingPays ? (
                      <span className="inline-block w-20 h-7 bg-slate-100 rounded-md animate-pulse" />
                    ) : (
                      formatCurrency(outstandingBalance)
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Pending Hold Balance</p>
                </div>
              </Link>

              {/* Stat 4: Saved Residences */}
              <Link
                to="/favorites"
                className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Shortlist
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {favCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Favorite Residences</p>
                </div>
              </Link>

            </div>

            {/* 2. Featured Active Hold or Spotlight Banner */}
            {featuredReservation ? (
              (() => {
                const aptObj = getApartmentDetail(featuredReservation.apartmentId, featuredReservation.apartmentTitle);
                const cd = countdownTo(featuredReservation.expiresAt);
                const aptImg = aptObj?.images?.[0]?.url || aptObj?.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Active 48-Hour Residence Hold</span>
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                          {featuredReservation.apartmentTitle}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cd.expired ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{cd.expired ? 'Hold Expired' : cd.text}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={aptImg}
                          alt={featuredReservation.apartmentTitle}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-100 border border-slate-200/60 shrink-0"
                        />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">
                            {aptObj?.district || aptObj?.city || 'Colombo'} • Floor {aptObj?.floor || 1} • {aptObj?.type || 'Residence'}
                          </p>
                          <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                            Hold Fee: {formatCurrency(featuredReservation.reservationFee)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Placed on {formatDate(featuredReservation.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link
                          to={`/reservations`}
                          className="flex-1 md:flex-initial text-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition"
                        >
                          Manage Hold
                        </Link>
                        {featuredReservation.apartmentId && (
                          <Link
                            to={`/apartments/${featuredReservation.apartmentId}`}
                            className="flex-1 md:flex-initial text-center px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition"
                          >
                            View Property
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Discovery Banner when no active hold */
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="max-w-xl relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold mb-2">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Signature Collection</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Discover Verified Residences & Penthouses
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Compare architectural floor plans, place guaranteed 48-hour purchasing holds, or book private on-site viewings.
                  </p>
                </div>
                <Link
                  to="/apartments"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition shrink-0 relative z-10"
                >
                  <span>Explore Residences</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* 3. Mid-Deck Two-Column Grid: Appointments & Reservations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Box A: Recent / Upcoming Appointments */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Viewing Appointments</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Scheduled on-site residence walkthroughs</p>
                    </div>
                    <Link to="/appointments" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {loadingAppts ? (
                    <div className="space-y-2.5">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : recentAppointments.length === 0 ? (
                    <div className="py-6 text-center">
                      <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No appointments scheduled</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Schedule a private viewing of any available residence.</p>
                      <Link
                        to="/apartments"
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                      >
                        <span>Browse Residences</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recentAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                        >
                          <div className="min-w-0 pr-3">
                            <Link
                              to={`/apartments/${apt.apartmentId}`}
                              className="font-bold text-slate-900 text-xs sm:text-sm hover:text-amber-600 transition truncate block"
                            >
                              {apt.apartmentTitle}
                            </Link>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-amber-600" />
                                {formatDate(apt.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {apt.timeSlot}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Badge variant={statusToVariant(apt.status)} size="sm" dot>
                              {apt.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100">
                  <Link
                    to="/appointments"
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition block text-center"
                  >
                    <span>Schedule New Appointment</span>
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Box B: Active Holds / Reservations */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Purchasing Holds</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">48-Hour reserved apartment locks</p>
                    </div>
                    <Link to="/reservations" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {loadingRsvs ? (
                    <div className="space-y-2.5">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : activeReservationsList.length === 0 ? (
                    <div className="py-6 text-center">
                      <KeyRound className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No active holds</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Place a 48-hour purchasing hold on signature apartments.</p>
                      <Link
                        to="/apartments"
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                      >
                        <span>Explore Residences</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeReservationsList.map((rsv) => {
                        const cd = countdownTo(rsv.expiresAt);
                        return (
                          <div
                            key={rsv.id}
                            className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {rsv.apartmentTitle}
                              </p>
                              <Badge variant={statusToVariant(rsv.status)} size="sm" dot>
                                {rsv.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/50">
                              <span className="text-slate-500 font-medium">
                                Fee: <span className="font-bold text-slate-900">{formatCurrency(rsv.reservationFee)}</span>
                              </span>
                              <span className={`font-semibold flex items-center gap-1 ${cd.expired ? 'text-rose-600' : 'text-amber-700'
                                }`}>
                                <Clock className="w-3 h-3" />
                                {cd.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100">
                  <Link
                    to="/reservations"
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition block text-center"
                  >
                    <span>Manage All Holds</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

            {/* 4. Quick Portal Navigation Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3 pb-2.5 border-b border-slate-100">
                Quick Portal Navigation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link
                  to="/apartments"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-amber-50/60 border border-slate-100 hover:border-amber-300 transition group flex flex-col justify-between"
                >
                  <MapPin className="w-4 h-4 text-amber-600 mb-2" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Catalogue</p>
                    <p className="text-[10px] text-slate-400">View all units</p>
                  </div>
                </Link>

                <Link
                  to="/compare"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-amber-50/60 border border-slate-100 hover:border-amber-300 transition group flex flex-col justify-between"
                >
                  <TrendingUp className="w-4 h-4 text-amber-600 mb-2" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Compare</p>
                    <p className="text-[10px] text-slate-400">Side-by-side</p>
                  </div>
                </Link>

                <Link
                  to="/inquiries"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-amber-50/60 border border-slate-100 hover:border-amber-300 transition group flex flex-col justify-between"
                >
                  <FileText className="w-4 h-4 text-amber-600 mb-2" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Inquiries</p>
                    <p className="text-[10px] text-slate-400">Support tickets</p>
                  </div>
                </Link>

                <Link
                  to="/payments"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-amber-50/60 border border-slate-100 hover:border-amber-300 transition group flex flex-col justify-between"
                >
                  <Wallet className="w-4 h-4 text-amber-600 mb-2" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Payments</p>
                    <p className="text-[10px] text-slate-400">Bank slips & logs</p>
                  </div>
                </Link>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDE: COMPACT VERTICAL NOTIFICATIONS PANEL */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">

              {/* Notification Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Updates</h3>
                    <p className="text-[10px] text-slate-400">Real-time alerts</p>
                  </div>
                </div>

                {unreadCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      {unreadCount} new
                    </span>
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">All caught up</span>
                )}
              </div>

              {/* Notification Items List */}
              {recentNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No recent updates</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Your reservation & viewing alerts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-3 rounded-2xl border transition text-left cursor-pointer ${notif.read
                        ? 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                        : 'bg-amber-50/30 border-amber-200/80 hover:bg-amber-50/50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-xs font-bold truncate ${notif.read ? 'text-slate-800' : 'text-slate-900'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{timeAgo(notif.createdAt)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Notification Footer Link */}
              <div className="pt-3.5 mt-3 border-t border-slate-100">
                <Link
                  to="/notifications"
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition block text-center"
                >
                  <span>View All Notifications</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Resident Security & Support Badge */}
            <div className="p-4 rounded-3xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">Bank-Grade Verification</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All deposits & deeds legally protected</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}