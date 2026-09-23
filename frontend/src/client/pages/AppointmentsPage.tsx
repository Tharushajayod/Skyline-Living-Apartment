import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CalendarPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  CalendarClock,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Compass,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  X,
  FileCheck,
} from 'lucide-react';
import type { Appointment, Apartment, AppointmentStatus } from '@/shared/types';
import { appointmentService } from '@/shared/services/appointmentService';
import { apartmentService } from '@/shared/services/apartmentService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import AppointmentRescheduleModal from '@/management/components/AppointmentRescheduleModal';
import { formatDate } from '@/shared/utils/format';

type AppointmentTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

function parseDateParts(dateStr: string) {
  if (!dateStr) return { day: '--', month: '---', year: '----' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '--', month: '---', year: '----' };
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
  return { day, month, year };
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Instant SWR initial data from cache (0ms)
  const [appts, setAppts] = useState<Appointment[]>(() => {
    if (user?.email) {
      return appointmentService.getCachedByCustomer(user.email) || [];
    }
    return [];
  });

  const [apartments, setApartments] = useState<Apartment[]>(() => {
    return apartmentService.getCached('apartments_all') || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (user?.email && appointmentService.getCachedByCustomer(user.email)) {
      return false;
    }
    return true;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  // Filters & Search
  const activeTab = (searchParams.get('tab') as AppointmentTab) || 'upcoming';
  const [searchQuery, setSearchQuery] = useState('');

  // Map apartment ID to apartment object for fast specs and image lookups
  const aptMap = useMemo(() => {
    const map = new Map<string, Apartment>();
    apartments.forEach((apt) => {
      map.set(apt.id, apt);
    });
    return map;
  }, [apartments]);

  // Fetch Data Concurrently
  const loadData = useCallback(
    async (showRefreshing = false) => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const [apptRes, aptRes] = await Promise.allSettled([
          appointmentService.getByCustomer(user.email),
          apartmentService.getAll({ includeSold: true }),
        ]);

        if (apptRes.status === 'fulfilled' && Array.isArray(apptRes.value)) {
          setAppts(apptRes.value);
        } else if (apptRes.status === 'rejected') {
          console.error('Failed to load customer appointments:', apptRes.reason);
          if (appts.length === 0) {
            setError('Unable to load viewing appointments. Please check your network connection.');
          }
        }

        if (aptRes.status === 'fulfilled' && Array.isArray(aptRes.value)) {
          setApartments(aptRes.value);
        }
      } catch (err: any) {
        console.error('Error fetching appointments page data:', err);
        if (appts.length === 0) {
          setError(err?.message || 'Error communicating with the viewing schedule server.');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.email, appts.length]
  );

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  // Tab change
  const handleTabChange = (tab: AppointmentTab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'upcoming') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params, { replace: true });
  };

  // Reschedule Proposal Accept / Decline handlers for Customer
  const handleAcceptReschedule = async (apptId: string) => {
    try {
      await appointmentService.acceptReschedule(apptId);
      toast('Reschedule proposal accepted! Your viewing is now confirmed for the new time.', 'success');
      loadData(false);
    } catch (err: any) {
      toast(err.message || 'Failed to accept reschedule proposal', 'error');
    }
  };

  const handleDeclineReschedule = async (apptId: string) => {
    try {
      await appointmentService.rejectReschedule(apptId);
      toast('Reschedule proposal declined. Your viewing remains at the original time.', 'info');
      loadData(false);
    } catch (err: any) {
      toast(err.message || 'Failed to decline reschedule proposal', 'error');
    }
  };

  // Appointment Cancellation Handler
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      const updated = await appointmentService.updateStatus(cancelTarget.id, 'Cancelled');
      setAppts((prev) => prev.map((a) => (a.id === cancelTarget.id ? updated : a)));
      toast('Viewing appointment cancelled successfully', 'success');
      loadData(false);
    } catch (err: any) {
      toast(err.message || 'Failed to cancel viewing appointment', 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const canModify = (status: AppointmentStatus) =>
    status === 'Pending' || status === 'Approved' || status === 'Rescheduled';

  // Sort and identify the earliest upcoming appointment for the Spotlight Hero
  const nextUpcomingAppointment = useMemo(() => {
    const activeOnes = appts
      .filter((a) => a.status === 'Pending' || a.status === 'Approved' || a.status === 'Rescheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return activeOnes.length > 0 ? activeOnes[0] : null;
  }, [appts]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appts.filter((appt) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'upcoming') {
        matchesTab = ['Pending', 'Approved', 'Rescheduled'].includes(appt.status);
      } else if (activeTab === 'completed') {
        matchesTab = ['Completed', 'No-show'].includes(appt.status);
      } else if (activeTab === 'cancelled') {
        matchesTab = ['Cancelled', 'Rejected'].includes(appt.status);
      }

      // Search filter
      const apt = aptMap.get(appt.apartmentId);
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        appt.apartmentTitle?.toLowerCase().includes(query) ||
        appt.id?.toLowerCase().includes(query) ||
        appt.timeSlot?.toLowerCase().includes(query) ||
        apt?.buildingName?.toLowerCase().includes(query) ||
        apt?.address?.toLowerCase().includes(query) ||
        apt?.city?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [appts, activeTab, searchQuery, aptMap]);

  // Helper for Status Badge
  const getStatusBadge = (appt: Appointment) => {
    const status = appt.status;
    const resched = appt.rescheduleStatus;

    if (resched === 'Pending Customer' || (resched as any) === 'PENDING_CUSTOMER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 border border-amber-600 shadow-2xs animate-pulse">
          <CalendarClock className="w-3.5 h-3.5" />
          Reschedule Review Needed
        </span>
      );
    }

    if (resched === 'Pending Admin' || (resched as any) === 'PENDING_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Reschedule Under Review
        </span>
      );
    }

    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Confirmed Visit
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Awaiting Confirmation
          </span>
        );
      case 'Rescheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Rescheduled
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Completed • Reservation Eligible
          </span>
        );
      case 'Cancelled':
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {status === 'Rejected' ? 'Declined' : 'Cancelled'}
          </span>
        );
      case 'No-show':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            No-Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER BANNER (Consistent with Customer Dashboard) */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-slate-200/80 pt-8 pb-7 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                My Appointments
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 font-normal">
                Keep track of your property viewings, tour schedules, and upcoming on-site luxury visits.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh appointments"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link
                to="/reservations"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>My Reservations</span>
              </Link>

              <Link
                to="/apartments"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Schedule a Viewing</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CANVAS */}
      {/* ======================================================== */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        
        {/* ======================================================== */}
        {/* 2. NEXT UPCOMING APPOINTMENT SPOTLIGHT HERO */}
        {/* ======================================================== */}
        {nextUpcomingAppointment && (
          (() => {
            const nextApt = aptMap.get(nextUpcomingAppointment.apartmentId);
            const dateParts = parseDateParts(nextUpcomingAppointment.date);
            const heroImg =
              nextApt?.images && nextApt.images.length > 0
                ? nextApt.images[0].url
                : nextApt?.floorPlanUrl || '';

            return (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
                  
                  {/* Property Image & Date Callout */}
                  <div className="relative w-full lg:w-96 h-56 lg:h-auto min-h-[220px] rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 group">
                    {heroImg ? (
                      <img
                        src={heroImg}
                        alt={nextUpcomingAppointment.apartmentTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2">
                        <Building2 className="w-12 h-12 text-slate-300" />
                        <span className="text-xs font-semibold">Skyline Living</span>
                      </div>
                    )}

                    {/* Gradient Protection */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                    {/* Prominent Architectural Date Badge Overlay */}
                    <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-md text-center min-w-[62px] border border-white/60">
                      <p className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">
                        {dateParts.month}
                      </p>
                      <p className="text-2xl font-black text-slate-950 leading-none my-0.5">
                        {dateParts.day}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 font-mono">
                        {dateParts.year}
                      </p>
                    </div>

                    {/* Status Pill on top right */}
                    <div className="absolute top-3.5 right-3.5">
                      {getStatusBadge(nextUpcomingAppointment)}
                    </div>

                    {/* Location preview at bottom */}
                    {nextApt?.address && (
                      <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white flex items-center gap-1.5 text-xs font-medium drop-shadow-sm truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{nextApt.address}, {nextApt.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Spotlight Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    
                    <div>
                      {/* Subhead Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                          <Compass className="w-3.5 h-3.5" />
                          Next Scheduled Viewing
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-mono font-medium text-slate-500">
                          Session #{nextUpcomingAppointment.id}
                        </span>
                      </div>

                      {/* Apartment Title */}
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        <Link
                          to={`/apartments/${nextUpcomingAppointment.apartmentId}`}
                          className="hover:text-amber-600 transition hover:underline"
                        >
                          {nextUpcomingAppointment.apartmentTitle}
                        </Link>
                      </h2>

                      {/* Incoming Reschedule Proposal Banner on Spotlight Hero */}
                      {(nextUpcomingAppointment.rescheduleStatus === 'Pending Customer' || (nextUpcomingAppointment.rescheduleStatus as any) === 'PENDING_CUSTOMER') && (
                        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <CalendarClock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                                Reschedule Request from Skyline Team
                              </p>
                              <p className="text-xs text-amber-900">
                                Proposed Date: <strong className="text-slate-950 font-bold">{formatDate(nextUpcomingAppointment.proposedDate || '')}</strong> at <strong className="text-slate-950 font-bold">{nextUpcomingAppointment.proposedTimeSlot}</strong>
                              </p>
                              <p className="text-xs text-slate-700 italic">
                                Reason: "{nextUpcomingAppointment.rescheduleReason || 'Schedule adjustment'}"
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAcceptReschedule(nextUpcomingAppointment.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept New Time</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRescheduleTarget(nextUpcomingAppointment)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Request Another Time</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeclineReschedule(nextUpcomingAppointment.id)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 font-semibold text-xs transition cursor-pointer"
                            >
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Customer Awaiting Admin Proposal Banner */}
                      {(nextUpcomingAppointment.rescheduleStatus === 'Pending Admin' || (nextUpcomingAppointment.rescheduleStatus as any) === 'PENDING_ADMIN') && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-blue-950">Reschedule Request Sent — Awaiting Review</p>
                            <p className="text-slate-700 mt-0.5">
                              You requested {formatDate(nextUpcomingAppointment.proposedDate || '')} at {nextUpcomingAppointment.proposedTimeSlot}. Our concierge will review shortly.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Timing & Logistics Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Time</p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                              {nextUpcomingAppointment.timeSlot}
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visitor Host</p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                              Skyline Property Concierge
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Customer Note if present */}
                      {nextUpcomingAppointment.notes && (
                        <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/40 border border-amber-200/60 text-xs text-amber-950 flex items-start gap-2">
                          <span className="font-bold shrink-0">Your Note:</span>
                          <span className="italic text-slate-700">"{nextUpcomingAppointment.notes}"</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {canModify(nextUpcomingAppointment.status) && (
                          <button
                            type="button"
                            onClick={() => setRescheduleTarget(nextUpcomingAppointment)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Propose Reschedule</span>
                          </button>
                        )}

                        <Link
                          to={`/apartments/${nextUpcomingAppointment.apartmentId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Residence</span>
                        </Link>
                      </div>

                      {canModify(nextUpcomingAppointment.status) && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(nextUpcomingAppointment)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-xs transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Visit</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })()
        )}

        {/* ======================================================== */}
        {/* 3. FILTER TABS & SEARCH CONTROLS */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleTabChange('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Upcoming</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'upcoming' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                {appts.filter((a) => ['Pending', 'Approved', 'Rescheduled'].includes(a.status)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Past Visits</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {appts.filter((a) => ['Completed', 'No-show'].includes(a.status)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('cancelled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cancelled'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Cancelled & Declined</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'cancelled' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {appts.filter((a) => ['Cancelled', 'Rejected'].includes(a.status)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Logs</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {appts.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by apartment title, time, or location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* ======================================================== */}
        {/* 4. ERROR MESSAGE IF ANY */}
        {/* ======================================================== */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="underline font-bold hover:text-rose-950 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. APPOINTMENTS TIMELINE STREAM */}
        {/* ======================================================== */}
        <div className="space-y-4">
          {loading && appts.length === 0 ? (
            /* Skeleton Loading Deck */
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs animate-pulse flex flex-col sm:flex-row gap-5 items-center"
                >
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl shrink-0" />
                  <div className="w-24 h-24 bg-slate-200 rounded-2xl shrink-0 hidden md:block" />
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="h-5 w-48 bg-slate-200 rounded-md" />
                    <div className="h-4 w-72 bg-slate-100 rounded-md" />
                    <div className="h-4 w-32 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-8 w-28 bg-slate-200 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-2xs space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto">
                <CalendarPlus className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {searchQuery || activeTab !== 'upcoming'
                    ? 'No matching appointments found'
                    : 'No Scheduled Viewings Yet'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                  {searchQuery || activeTab !== 'upcoming'
                    ? 'Try changing your search term or selecting a different status filter tab.'
                    : 'Experience our luxury residences first-hand with a private, guided on-site viewing tour.'}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {searchQuery || activeTab !== 'upcoming' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleTabChange('upcoming');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <Link
                    to="/apartments"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    <CalendarPlus className="w-4 h-4 text-amber-400" />
                    <span>Book a Residence Tour</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Chronological Timeline Cards */
            <div className="space-y-3.5">
              {filteredAppointments.map((appt) => {
                const apt = aptMap.get(appt.apartmentId);
                const dateParts = parseDateParts(appt.date);
                const aptImg =
                  apt?.images && apt.images.length > 0
                    ? apt.images[0].url
                    : apt?.floorPlanUrl || '';

                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition duration-200 flex flex-col space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Meta: Date Block + Property Thumbnail + Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                        
                        {/* Date Badge */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 text-center shrink-0 min-w-[56px] sm:min-w-[64px]">
                          <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                            {dateParts.month}
                          </p>
                          <p className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                            {dateParts.day}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 font-mono">
                            {dateParts.year}
                          </p>
                        </div>

                        {/* Property Thumbnail (if available) */}
                        <div className="w-20 h-20 sm:w-24 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0 hidden sm:block">
                          {aptImg ? (
                            <img
                              src={aptImg}
                              alt={appt.apartmentTitle}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Title & Logistics */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Link
                              to={`/apartments/${appt.apartmentId}`}
                              className="font-bold text-base text-slate-900 hover:text-amber-600 transition truncate hover:underline"
                            >
                              {appt.apartmentTitle}
                            </Link>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-[11px] font-mono text-slate-400 font-medium">
                              #{appt.id}
                            </span>
                          </div>

                          {/* Timing & Location Info */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              {appt.timeSlot}
                            </span>
                            {apt?.address && (
                              <span className="flex items-center gap-1.5 text-slate-500 truncate max-w-[280px]">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {apt.address}, {apt.city}
                              </span>
                            )}
                          </div>

                          {/* Customer notes if present */}
                          {appt.notes && (
                            <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                              "{appt.notes}"
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Right Meta: Status Badge & Actions */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                        <div>{getStatusBadge(appt)}</div>

                        <div className="flex items-center gap-2">
                          {appt.status === 'Completed' && (
                            <Link
                              to={`/apartments/${appt.apartmentId}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-slate-950" />
                              <span>Reserve Residence</span>
                            </Link>
                          )}

                          {canModify(appt.status) && (
                            <button
                              type="button"
                              onClick={() => setRescheduleTarget(appt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                            >
                              <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Propose Reschedule</span>
                            </button>
                          )}

                          <Link
                            to={`/apartments/${appt.apartmentId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>View Residence</span>
                          </Link>

                          {canModify(appt.status) && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(appt)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Cancel appointment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pending Customer Reschedule Proposal Banner */}
                    {(appt.rescheduleStatus === 'Pending Customer' || (appt.rescheduleStatus as any) === 'PENDING_CUSTOMER') && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-amber-950 flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-amber-700" />
                            Skyline Concierge proposed rescheduling to:{' '}
                            <span className="text-slate-950 font-extrabold">{formatDate(appt.proposedDate || '')} at {appt.proposedTimeSlot}</span>
                          </p>
                          <p className="text-slate-700 italic">
                            Reason: "{appt.rescheduleReason || 'Staff adjustment'}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAcceptReschedule(appt.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRescheduleTarget(appt)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Request Another Time</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeclineReschedule(appt.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 font-semibold text-xs transition cursor-pointer"
                          >
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pending Admin Review Banner */}
                    {(appt.rescheduleStatus === 'Pending Admin' || (appt.rescheduleStatus as any) === 'PENDING_ADMIN') && (
                      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs text-blue-900">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong>Reschedule Proposal Sent:</strong> You proposed {formatDate(appt.proposedDate || '')} at {appt.proposedTimeSlot} (Reason: "{appt.rescheduleReason}"). Awaiting Skyline Concierge confirmation.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* CANCEL CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Viewing Appointment?"
        message={`Are you sure you want to cancel your scheduled luxury viewing of ${cancelTarget?.apartmentTitle}? You can reschedule for another date if you prefer.`}
        confirmLabel="Yes, Cancel Appointment"
      />

      {/* ======================================================== */}
      {/* RESCHEDULE APPOINTMENT MODAL */}
      {/* ======================================================== */}
      {rescheduleTarget && (
        <AppointmentRescheduleModal
          open={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          appointment={rescheduleTarget}
          onSuccess={() => {
            loadData(false);
          }}
        />
      )}

    </div>
  );
}