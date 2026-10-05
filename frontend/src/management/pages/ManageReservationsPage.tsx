import { useMemo, useState, useEffect } from 'react';
import {
  Search, Eye, Check, XCircle, Building2, Mail, Clock, AlertTriangle,
  Receipt, Timer, ShieldCheck, Calendar, Filter
} from 'lucide-react';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import EmptyState from '@/shared/components/ui/EmptyState';
import { useToast } from '@/shared/components/ui/Toast';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate, countdownTo } from '@/shared/utils/format';
import type { Reservation, ReservationStatus } from '@/shared/types';
import ReservationDetailsModal from '@/management/components/ReservationDetailsModal';
import ReservationCancellationModal from '@/management/components/ReservationCancellationModal';

type FilterTab = 'All' | 'Pending' | 'Confirmed' | 'Expired' | 'Cancelled' | 'Committed';

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'All', label: 'All Holds' },
  { id: 'Pending', label: 'Pending Hold' },
  { id: 'Confirmed', label: 'Confirmed' },
  { id: 'Expired', label: 'Expired' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export default function ManageReservationsPage() {
  const { toast } = useToast();
  const cached = reservationService.getCachedAll();
  const [list, setList] = useState<Reservation[]>(() => (Array.isArray(cached) ? cached : []));
  const [loading, setLoading] = useState(!cached || cached.length === 0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  // Modals state
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
  const [cancellationTarget, setCancellationTarget] = useState<{
    reservation: Reservation;
    mode: 'cancellation' | 'expiration';
  } | null>(null);

  const fetchReservations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await reservationService.getAll();
      setList(data);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations(!cached || cached.length === 0);
  }, []);

  const stats = useMemo(() => ({
    total: list.length,
    pending: list.filter(r => r.status === 'Pending').length,
    confirmed: list.filter(r => r.status === 'Confirmed').length,
    committed: list.filter(r => r.hasPaymentCommitment).length,
    expired: list.filter(r => r.status === 'Expired').length,
    cancelled: list.filter(r => r.status === 'Cancelled').length,
    urgent: list.filter(r => {
      const cd = countdownTo(r.expiresAt);
      return !cd.expired && (cd.text.includes('m remaining') || (cd.text.includes('h ') && !cd.text.includes('d')));
    }).length,
  }), [list]);

  const filtered = useMemo(() => {
    return list.filter(r => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'Pending') matchesTab = r.status === 'Pending';
      else if (activeTab === 'Confirmed') matchesTab = r.status === 'Confirmed';
      else if (activeTab === 'Expired') matchesTab = r.status === 'Expired';
      else if (activeTab === 'Cancelled') matchesTab = r.status === 'Cancelled';
      else if (activeTab === 'Committed') matchesTab = Boolean(r.hasPaymentCommitment);

      // Search filter
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.apartmentTitle.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.apartmentId && r.apartmentId.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [list, search, activeTab]);

  async function handleConfirmPending(id: string) {
    try {
      const updated = await reservationService.updateStatus(id, 'Confirmed');
      setList(prev => prev.map(r => r.id === id ? updated : r));
      toast(`Reservation ${id} confirmed successfully`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update reservation status', 'error');
    }
  }

  const getTabCount = (tab: FilterTab) => {
    switch (tab) {
      case 'All': return stats.total;
      case 'Pending': return stats.pending;
      case 'Confirmed': return stats.confirmed;
      case 'Committed': return stats.committed;
      case 'Expired': return stats.expired;
      case 'Cancelled': return stats.cancelled;
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Skyline Reservation Ledger
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {stats.total} Total Records
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Reservations
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Monitor priority apartment holds, verify deposits, manage cancellations with refunds, and audit settlements.
          </p>
        </div>

        {stats.urgent > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-xs shrink-0">
            <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{stats.urgent} hold(s) expiring within 24 hours</span>
          </div>
        )}
      </div>

      {/* Controls Bar: Status Filter Tabs & Instant Search - Ekach line madhe adjust kela ahe */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
        {/* Filter Tabs (Single line with scrollbar on very narrow screens) */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar shrink">
          {filterTabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${isActive
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive
                    ? tab.id === 'Committed'
                      ? 'bg-blue-600 text-white'
                      : tab.id === 'Pending'
                        ? 'bg-amber-500 text-slate-950'
                        : tab.id === 'Confirmed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-700'
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box - Width thodi kami keli ahe jyane tabs sathi jaga milte */}
        <div className="relative w-full md:w-56 lg:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search reservations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Compact, Grouped Reservation Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden w-full">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Loading reservation records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              variant="search"
              title="No reservations found"
              description="No reservation records match your selected filter criteria or search query."
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-4 py-3.5 whitespace-nowrap">Reservation</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Residence Unit</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Deposit & Payment</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Lifecycle & Hold</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const cd = countdownTo(r.expiresAt);
                  const isExpiringSoon =
                    !cd.expired &&
                    (cd.text.includes('m remaining') ||
                      (cd.text.includes('h ') && !cd.text.includes('d')));

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedDetailsId(r.id)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      {/* 1. Reservation Ref & Created Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                            {r.id}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatDate(r.createdAt)}</span>
                          </span>
                        </div>
                      </td>

                      {/* 2. Customer Name & Email */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {r.customerName}
                          </span>
                          <span
                            className="text-[11px] text-slate-400 flex items-center gap-1 truncate"
                            title={r.customerEmail}
                          >
                            <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{r.customerEmail}</span>
                          </span>
                        </div>
                      </td>

                      {/* 3. Residence Unit & Unit Reference */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5 max-w-[220px]">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs sm:text-sm">
                            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate" title={r.apartmentTitle}>
                              {r.apartmentTitle}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 pl-5 truncate">
                            {r.apartmentId ? `Unit ID: ${r.apartmentId}` : 'Skyline Living Luxury Residence'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Financial Summary: Deposit Amount + Payment Status/Commitment */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                            {formatCurrency(r.reservationFee)}
                          </span>
                          {r.hasPaymentCommitment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80 whitespace-nowrap w-fit">
                              <ShieldCheck className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                              <span>{r.paymentCommitmentReason || 'Payment Active'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              10% Advance Hold Fee
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status & Lifecycle / Hold Expiry */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={statusToVariant(r.status)} size="sm" dot>
                            {r.status}
                          </Badge>
                          {r.hasPaymentCommitment ? (
                            <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 whitespace-nowrap">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Protected</span>
                            </span>
                          ) : r.status === 'Pending' ? (
                            cd.expired ? (
                              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                <span>Hold Expired</span>
                              </span>
                            ) : isExpiringSoon ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse flex items-center gap-1 whitespace-nowrap">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span>{cd.text}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{cd.text}</span>
                              </span>
                            )
                          ) : r.status === 'Expired' ? (
                            <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                              <span>Expired {formatDate(r.expiresAt)}</span>
                            </span>
                          ) : r.status === 'Confirmed' ? (
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 whitespace-nowrap">
                              <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Hold Verified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Compact Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleConfirmPending(r.id)}
                              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
                              title="Confirm Pending Reservation Hold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(r.status === 'Pending' || r.status === 'Confirmed') && (
                            r.hasPaymentCommitment ? (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                                title={`Cancellation unavailable — ${r.paymentCommitmentReason || 'payment commitment active'}`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCancellationTarget({ reservation: r, mode: 'cancellation' })}
                                className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition cursor-pointer"
                                title="Cancel Reservation & Settle Refund"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                          {r.status === 'Expired' && (
                            <button
                              type="button"
                              onClick={() => setCancellationTarget({ reservation: r, mode: 'expiration' })}
                              className="p-1.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 transition cursor-pointer"
                              title="Process Expired Reservation Settlement"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedDetailsId(r.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl border border-slate-200/80 hover:border-amber-200 transition cursor-pointer"
                            title="View Complete Ledger & Property Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Full Details Modal */}
      <ReservationDetailsModal
        open={!!selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
        reservationId={selectedDetailsId}
        onCancelRequest={(id) => {
          const target = list.find((r) => r.id === id);
          if (target) {
            setCancellationTarget({ reservation: target, mode: 'cancellation' });
          }
        }}
      />

      {/* Cancellation & Settlement Modal */}
      <ReservationCancellationModal
        open={!!cancellationTarget}
        onClose={() => setCancellationTarget(null)}
        reservation={cancellationTarget?.reservation || null}
        mode={cancellationTarget?.mode || 'cancellation'}
        onSuccess={fetchReservations}
      />
    </div>
  );
}