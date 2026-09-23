import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Plus,
  Sparkles,
  Layers,
  FileText,
  CreditCard,
  Eye,
  Check,
  Flame,
} from 'lucide-react';
import type { Reservation, Apartment, ReservationStatus } from '@/shared/types';
import { reservationService } from '@/shared/services/reservationService';
import { apartmentService } from '@/shared/services/apartmentService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { formatCurrency, formatDate, countdownTo } from '@/shared/utils/format';
import ReservationDetailsModal from '@/management/components/ReservationDetailsModal';

type FilterTab = 'all' | 'active' | 'confirmed' | 'completed_cancelled';

export default function ReservationsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Instant SWR initial data from cache (0ms)
  const [rsvs, setRsvs] = useState<Reservation[]>(() => {
    if (user?.email) {
      return reservationService.getCachedByCustomer(user.email) || [];
    }
    return [];
  });

  const [apartments, setApartments] = useState<Apartment[]>(() => {
    return apartmentService.getCached('apartments_all') || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (user?.email && reservationService.getCachedByCustomer(user.email)) {
      return false;
    }
    return true;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const activeTab = (searchParams.get('tab') as FilterTab) || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Map apartment ID to apartment object for fast specs and image lookups
  const aptMap = useMemo(() => {
    const map = new Map<string, Apartment>();
    apartments.forEach((apt) => {
      map.set(apt.id, apt);
    });
    return map;
  }, [apartments]);

  // Fetch Data Concurrently
  const loadData = useCallback(async (showRefreshing = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const [rsvRes, aptRes] = await Promise.allSettled([
        reservationService.getByCustomer(user.email),
        apartmentService.getAll({ includeSold: true }),
      ]);

      if (rsvRes.status === 'fulfilled' && Array.isArray(rsvRes.value)) {
        setRsvs(rsvRes.value);
      } else if (rsvRes.status === 'rejected') {
        console.error('Failed to load customer reservations:', rsvRes.reason);
        if (rsvs.length === 0) {
          setError('Unable to load your latest reservations. Please check your connection and try again.');
        }
      }

      if (aptRes.status === 'fulfilled' && Array.isArray(aptRes.value)) {
        setApartments(aptRes.value);
      }
    } catch (err: any) {
      console.error('Error fetching reservations page data:', err);
      if (rsvs.length === 0) {
        setError(err?.message || 'Error communicating with the reservation server.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.email, rsvs.length]);

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  // Handle Tab Switch
  const handleTabChange = (tab: FilterTab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params, { replace: true });
  };

  // Compute Metrics from Real Data
  const stats = useMemo(() => {
    const total = rsvs.length;
    const active = rsvs.filter((r) => r.status === 'Pending' || r.status === 'Confirmed');
    const confirmed = rsvs.filter((r) => r.status === 'Confirmed');
    const expiredOrCancelled = rsvs.filter((r) => r.status === 'Expired' || r.status === 'Cancelled');
    const totalDeposits = active.reduce((sum, r) => sum + (r.reservationFee || 0), 0);

    return {
      total,
      activeCount: active.length,
      confirmedCount: confirmed.length,
      expiredOrCancelledCount: expiredOrCancelled.length,
      totalDeposits,
    };
  }, [rsvs]);

  // Filtered Reservations
  const filteredReservations = useMemo(() => {
    return rsvs.filter((rsv) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'active') {
        matchesTab = rsv.status === 'Pending' || rsv.status === 'Confirmed';
      } else if (activeTab === 'confirmed') {
        matchesTab = rsv.status === 'Confirmed';
      } else if (activeTab === 'completed_cancelled') {
        matchesTab = rsv.status === 'Expired' || rsv.status === 'Cancelled';
      }

      // Search filter
      const apt = aptMap.get(rsv.apartmentId);
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        rsv.apartmentTitle?.toLowerCase().includes(query) ||
        rsv.id?.toLowerCase().includes(query) ||
        apt?.buildingName?.toLowerCase().includes(query) ||
        apt?.address?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [rsvs, activeTab, searchQuery, aptMap]);

  // Open Details Modal
  const openDetails = (id: string) => {
    setSelectedReservationId(id);
    setModalOpen(true);
  };

  // Helper for status badge colors
  const getStatusBadge = (rsv: Reservation) => {
    const status = rsv.status;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {status === 'Confirmed' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Confirmed
          </span>
        )}
        {status === 'Pending' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending 48h Hold
          </span>
        )}
        {status === 'Expired' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Expired
          </span>
        )}
        {status === 'Cancelled' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        )}
        {rsv.hasPaymentCommitment && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{rsv.paymentCommitmentReason || 'Payment Commitment'}</span>
          </span>
        )}
      </div>
    );
  };

  // Reservation Progress Stages
  const renderProgressSteps = (rsv: Reservation) => {
    const isPending = rsv.status === 'Pending';
    const isConfirmed = rsv.status === 'Confirmed';
    const isExpired = rsv.status === 'Expired';
    const isCancelled = rsv.status === 'Cancelled';

    const steps = [
      {
        id: 1,
        title: 'Reservation Placed',
        desc: 'Hold requested',
        completed: true,
        current: false,
      },
      {
        id: 2,
        title: '48h Hold Active',
        desc: isPending ? 'Lock in progress' : 'Locked',
        completed: isConfirmed || isPending,
        current: isPending,
      },
      {
        id: 3,
        title: 'Deposit / Payment',
        desc: isConfirmed ? 'Deposit verified' : 'Awaiting confirmation',
        completed: isConfirmed,
        current: isConfirmed,
      },
      {
        id: 4,
        title: 'Sales Agreement',
        desc: 'Deed transfer',
        completed: false,
        current: false,
      },
    ];

    if (isExpired || isCancelled) {
      return (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 text-rose-600 font-medium">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Reservation {rsv.status.toLowerCase()} on {formatDate(rsv.expiresAt || rsv.createdAt)}</span>
          </div>
          <span className="text-[11px] text-slate-400">Escrow settlement & refund terms apply</span>
        </div>
      );
    }

    return (
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative flex flex-col">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${step.completed
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                    : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {step.completed ? <Check className="w-3 h-3 stroke-[3]" /> : step.id}
                </div>
                <div
                  className={`h-0.5 flex-1 rounded-full ${idx === steps.length - 1
                    ? 'hidden'
                    : step.completed
                      ? 'bg-amber-400'
                      : 'bg-slate-100'
                    }`}
                />
              </div>
              <p
                className={`text-[11px] font-bold truncate ${step.completed ? 'text-slate-900' : 'text-slate-400'
                  }`}
              >
                {step.title}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
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
                My Reservations
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 font-normal">
                Manage your apartment reservations, track 48-hour hold expirations, and settle advance booking deposits.
              </p>
            </div>

            {/* Top Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh reservations"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link
                to="/appointments"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>My Viewings</span>
              </Link>

              <Link
                to="/apartments"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Explore Residences</span>
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
        {/* 3. FILTER TABS & SEARCH BAR */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'active'
                ? 'bg-white text-amber-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Active Holds</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'active' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                {stats.activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('confirmed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'confirmed'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Confirmed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.confirmedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('completed_cancelled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'completed_cancelled'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Expired & Cancelled</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'completed_cancelled' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.expiredOrCancelledCount}
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
              placeholder="Search apartment, unit #, or building..."
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
        {/* 5. RESERVATIONS LIST */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {loading && rsvs.length === 0 ? (
            /* Skeleton Loading Deck */
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs animate-pulse flex flex-col md:flex-row gap-6 items-start"
                >
                  <div className="w-full md:w-56 h-44 bg-slate-200 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex justify-between items-center">
                      <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                      <div className="h-6 w-24 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-4 w-72 bg-slate-100 rounded-md" />
                    <div className="grid grid-cols-3 gap-3 pt-3">
                      <div className="h-12 bg-slate-50 rounded-xl" />
                      <div className="h-12 bg-slate-50 rounded-xl" />
                      <div className="h-12 bg-slate-50 rounded-xl" />
                    </div>
                    <div className="h-10 bg-slate-100 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            /* Elegant Empty State */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-2xs space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {searchQuery || activeTab !== 'all'
                    ? 'No matching reservations found'
                    : 'No Apartment Reservations Yet'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                  {searchQuery || activeTab !== 'all'
                    ? 'Try adjusting your search query or switching to another filter tab.'
                    : 'Reserve a luxury residence with a refundable 48-hour priority lock while you review floor plans and financing options.'}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {searchQuery || activeTab !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleTabChange('all');
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
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Explore Available Residences</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Reservation Cards */
            <div className="space-y-5">
              {filteredReservations.map((rsv) => {
                const apt = aptMap.get(rsv.apartmentId);
                const cd = countdownTo(rsv.expiresAt);
                const showCountdown = rsv.status === 'Pending' || rsv.status === 'Confirmed';
                const apartmentImg =
                  apt?.images && apt.images.length > 0
                    ? apt.images[0].url
                    : apt?.floorPlanUrl || '';

                return (
                  <div
                    key={rsv.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition duration-200 flex flex-col"
                  >
                    {/* Top Flex Row: Image + Main Meta */}
                    <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start">

                      {/* Property Thumbnail */}
                      <div className="relative w-full md:w-60 lg:w-72 h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 group">
                        {apartmentImg ? (
                          <img
                            src={apartmentImg}
                            alt={rsv.apartmentTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2">
                            <Building2 className="w-10 h-10 text-slate-300" />
                            <span className="text-[11px] font-medium">Skyline Living</span>
                          </div>
                        )}

                        {/* Status Overlay Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          {getStatusBadge(rsv)}
                        </div>

                        {/* 48h Countdown Pill */}
                        {showCountdown && !rsv.hasPaymentCommitment && (
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{cd.expired ? 'Hold Expired' : '48h Hold'}</span>
                            </span>
                            <span className={cd.expired ? 'text-rose-400' : 'text-slate-200 font-mono'}>
                              {cd.text}
                            </span>
                          </div>
                        )}
                        {showCountdown && rsv.hasPaymentCommitment && (
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Financial Commitment</span>
                            </span>
                            <span className="text-slate-200 font-semibold text-[10px] truncate max-w-[120px]">
                              {rsv.paymentCommitmentReason || 'Secured'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info & Financial Breakdown */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-1.5">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-medium mb-0.5">
                                <span>Reservation #{rsv.id}</span>
                                <span>•</span>
                                <span>{formatDate(rsv.createdAt)}</span>
                              </div>
                              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-amber-700 transition">
                                <Link to={`/apartments/${rsv.apartmentId}`} className="hover:underline">
                                  {rsv.apartmentTitle}
                                </Link>
                              </h2>
                            </div>

                            <div className="text-right">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hold Fee</p>
                              <p className="text-lg sm:text-xl font-bold text-slate-900">
                                {formatCurrency(rsv.reservationFee)}
                              </p>
                            </div>
                          </div>

                          {/* Address & Specs */}
                          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 mt-2">
                            {apt?.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[240px]">{apt.address}, {apt.city}</span>
                              </div>
                            )}
                            {apt && (
                              <div className="flex items-center gap-3 font-medium text-slate-600">
                                <span className="flex items-center gap-1">
                                  <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                                  {apt.bedrooms} Bed
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bath className="w-3.5 h-3.5 text-slate-400" />
                                  {apt.bathrooms} Bath
                                </span>
                                <span className="flex items-center gap-1">
                                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                                  {apt.size.toLocaleString()} sq.ft
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Financial Meta Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-slate-100">
                            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Value</p>
                              <p className="text-xs font-bold text-slate-900 mt-0.5">
                                {apt?.price ? formatCurrency(apt.price) : 'Contact Sales'}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer Holder</p>
                              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                                {rsv.customerName || user?.name}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 col-span-2 sm:col-span-1">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Commitment Lifecycle</p>
                              <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1 truncate">
                                {rsv.hasPaymentCommitment ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    {rsv.paymentCommitmentReason || 'Payment Active'}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                    48h Hold Active
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDetails(rsv.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>View Ledger Details</span>
                            </button>

                            <Link
                              to={`/apartments/${rsv.apartmentId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>Apartment Specs</span>
                            </Link>
                          </div>

                          <div className="flex items-center gap-2">
                            {rsv.hasPaymentCommitment ? (
                              <Link
                                to="/payments"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs transition cursor-pointer shadow-2xs"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                                <span>View Payment Plan / Ledger</span>
                              </Link>
                            ) : rsv.status === 'Pending' && !cd.expired ? (
                              <Link
                                to="/payments"
                                state={{ autoPayReservationId: rsv.id }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay 10% Deposit</span>
                              </Link>
                            ) : null}

                            <Link
                              to="/payments"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 font-semibold text-xs transition"
                            >
                              <span>Payment History</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Progress Stepper for this reservation */}
                    {renderProgressSteps(rsv)}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* RESERVATION DETAILS MODAL */}
      {/* ======================================================== */}
      {selectedReservationId && (
        <ReservationDetailsModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedReservationId(null);
          }}
          reservationId={selectedReservationId}
          onCancelRequest={() => {
            // Reload on cancel
            loadData(true);
          }}
        />
      )}

    </div>
  );
}
