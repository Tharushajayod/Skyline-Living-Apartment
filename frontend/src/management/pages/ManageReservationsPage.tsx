import { useMemo, useState, useEffect } from 'react';
import {
  Search, Eye, Check, XCircle, TrendingUp, Calendar, AlertTriangle,
  Building2, Mail, Clock, DollarSign, ShieldAlert, Timer
} from 'lucide-react';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate, countdownTo } from '@/shared/utils/format';
import type { Reservation } from '@/shared/types';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function ManageReservationsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewTarget, setViewTarget] = useState<Reservation | null>(null);
  const [convertTarget, setConvertTarget] = useState<Reservation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
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
    fetchReservations();
  }, []);

  const filtered = useMemo(() => {
    return list.filter(r => {
      const matchesSearch = !search ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.apartmentTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [list, search, statusFilter]);

  const stats = useMemo(() => ({
    total: list.length,
    confirmed: list.filter(r => r.status === 'Confirmed').length,
    pending: list.filter(r => r.status === 'Pending').length,
    urgent: list.filter(r => {
      const cd = countdownTo(r.expiresAt);
      return !cd.expired && (cd.text.includes('m remaining') || (cd.text.includes('h ') && !cd.text.includes('d')));
    }).length,
  }), [list]);

  async function updateStatus(id: string, status: Reservation['status'], msg: string) {
    try {
      const updated = await reservationService.updateStatus(id, status);
      setList(prev => prev.map(r => r.id === id ? updated : r));
      toast(msg, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update reservation status', 'error');
    }
  }

  function handleConvert() {
    if (!convertTarget) return;
    updateStatus(convertTarget.id, 'Confirmed', `Reservation ${convertTarget.id} confirmed for sale`);
    setConvertTarget(null);
  }

  function handleCancel() {
    if (!cancelTarget) return;
    updateStatus(cancelTarget.id, 'Cancelled', `Reservation ${cancelTarget.id} cancelled`);
    setCancelTarget(null);
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Skyline Inventory Control
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {stats.total} Total Reservations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Reservations
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track priority 48-hour holds, expiry timers, and convert reservations into finalized sales.
          </p>
        </div>

        {stats.urgent > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-sm shrink-0">
            <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
            {stats.urgent} hold(s) expiring soon
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row gap-3 w-full">
        <div className="flex-1">
          <Input 
            placeholder="Search by reservation ID, customer, or residence title..." 
            icon={<Search className="w-4 h-4 text-slate-400" />} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="sm:w-56">
          <Select 
            options={statusOptions} 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
          />
        </div>
      </div>

      {/* Table Card - 100% Fit without Horizontal Scroll */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden w-full">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading reservations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState variant="search" title="No reservations found" description="Try adjusting your search query or status filters." />
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-left text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="w-[9%] px-3 py-3.5">Hold ID</th>
                  <th className="w-[17%] px-3 py-3.5">Residence Unit</th>
                  <th className="w-[20%] px-3 py-3.5">Customer Details</th>
                  <th className="w-[11%] px-3 py-3.5">Fee</th>
                  <th className="w-[10%] px-2 py-3.5 text-center">Status</th>
                  <th className="w-[13%] px-3 py-3.5">Expiry</th>
                  <th className="w-[9%] px-2 py-3.5">Created</th>
                  <th className="w-[8%] px-3 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const cd = countdownTo(r.expiresAt);
                  const isExpiringSoon = !cd.expired && (cd.text.includes('m remaining') || (cd.text.includes('h ') && !cd.text.includes('d')));

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Hold ID (9%) */}
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate inline-block">
                          {r.id}
                        </span>
                      </td>

                      {/* Residence Unit (17%) */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs sm:text-sm min-w-0">
                          <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate" title={r.apartmentTitle}>{r.apartmentTitle}</span>
                        </div>
                      </td>

                      {/* Customer Details (20%) */}
                      <td className="px-3 py-3.5">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{r.customerName}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{r.customerEmail}</span>
                          </p>
                        </div>
                      </td>

                      {/* Fee Deposited (11%) */}
                      <td className="px-3 py-3.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(r.reservationFee)}
                        </span>
                      </td>

                      {/* Hold Status (10%) */}
                      <td className="px-2 py-3.5 text-center">
                        <Badge variant={statusToVariant(r.status)} size="sm" dot>
                          {r.status}
                        </Badge>
                      </td>

                      {/* Expiry Countdown (13%) */}
                      <td className="px-3 py-3.5">
                        {r.status === 'Expired' || cd.expired ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                            Expired
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{cd.text}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{cd.text}</span>
                          </span>
                        )}
                      </td>

                      {/* Created Date (9%) */}
                      <td className="px-2 py-3.5 text-[11px] font-medium text-slate-500 whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>

                      {/* Actions (8%) */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(r.id, 'Confirmed', 'Reservation confirmed successfully')}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                              title="Confirm Reservation"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {r.status === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => setConvertTarget(r)}
                              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer shadow-sm shadow-amber-500/20"
                              title="Convert to Sale"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(r.status === 'Pending' || r.status === 'Confirmed') && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(r)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition cursor-pointer"
                              title="Cancel Reservation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewTarget(r)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="View Full Details"
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

      {/* View Details Modal */}
      <Modal 
        open={!!viewTarget} 
        onClose={() => setViewTarget(null)} 
        title="Reservation Overview" 
        footer={
          <Button variant="outline" onClick={() => setViewTarget(null)} className="border-slate-300">
            Close
          </Button>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {viewTarget.id}
              </span>
              <Badge variant={statusToVariant(viewTarget.status)} dot>{viewTarget.status}</Badge>
            </div>
            <DetailRow label="Residence Title" value={viewTarget.apartmentTitle} />
            <DetailRow label="Client Name" value={viewTarget.customerName} />
            <DetailRow label="Email Address" value={viewTarget.customerEmail} />
            <DetailRow label="Reservation Hold Fee" value={formatCurrency(viewTarget.reservationFee)} />
            <DetailRow label="Booking Created" value={formatDate(viewTarget.createdAt)} />
            <DetailRow label="Lock Expiration Date" value={formatDate(viewTarget.expiresAt)} />
          </div>
        )}
      </Modal>

      {/* Convert to Sale Modal */}
      <Modal
        open={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        title="Convert Reservation to Official Sale"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setConvertTarget(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvert}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
            >
              Confirm & Create Sale Record
            </Button>
          </div>
        }
      >
        {convertTarget && (
          <div className="space-y-4">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-amber-900 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                Sale Settlement Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hold ID</span>
                  <span className="font-mono font-bold text-slate-900">{convertTarget.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Residence</span>
                  <span className="font-bold text-slate-900">{convertTarget.apartmentTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-bold text-slate-900">{convertTarget.customerName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-amber-200/60">
                  <span className="text-slate-700 font-medium">Initial Hold Deposit</span>
                  <span className="font-extrabold text-amber-800">{formatCurrency(convertTarget.reservationFee)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Confirming will transition this 48-hour priority hold directly into a purchased property contract, allocating the unit status to Sold.
            </p>
          </div>
        )}
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Property Reservation"
        message={`Are you sure you want to cancel reservation ${cancelTarget?.id} for ${cancelTarget?.customerName}? This will immediately release the unit back to active inventory.`}
        confirmLabel="Cancel Reservation"
        variant="danger"
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}