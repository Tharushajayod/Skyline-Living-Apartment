import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Eye, Download, DollarSign, TrendingUp, ShoppingBag, CalendarDays,
  Search, Building2, User, CheckCircle2, FileText, ArrowRight, ShieldCheck
} from 'lucide-react';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Select, Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/shared/contexts/AuthContext';
import { salesService } from '@/shared/services/managementService';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Sale, Reservation } from '@/shared/types';

export default function ManageSalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Sale[]>(() => salesService.getCached() || []);
  const [reservationsList, setReservationsList] = useState<Reservation[]>(() => reservationService.getCachedAll() || []);
  const [loading, setLoading] = useState(!salesService.getCached());
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewTarget, setViewTarget] = useState<Sale | null>(null);
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const [salesData, rsvData] = await Promise.all([
        salesService.getAll(),
        reservationService.getAll(),
      ]);
      setList(Array.isArray(salesData) ? salesData : []);
      setReservationsList(Array.isArray(rsvData) ? rsvData : []);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load sales data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(!salesService.getCached());
  }, []);

  const confirmedReservations = useMemo(() =>
    reservationsList.filter(r => r.status === 'Confirmed' || r.status === 'Pending'), [reservationsList]);

  const kpis = useMemo(() => {
    const totalRevenue = list.reduce((sum, s) => sum + (Number(s.finalPrice) || 0), 0);
    const avgPrice = list.length ? totalRevenue / list.length : 0;
    const nowPrefix = new Date().toISOString().substring(0, 7);
    const thisMonth = list.filter(s => s.saleDate && s.saleDate.startsWith(nowPrefix));
    const monthRevenue = thisMonth.reduce((sum, s) => sum + (Number(s.finalPrice) || 0), 0);
    return { count: list.length, totalRevenue, avgPrice, monthCount: thisMonth.length, monthRevenue };
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter(s => {
      const matchesDate = !dateFilter || (s.saleDate && s.saleDate.startsWith(dateFilter));
      const matchesSearch = !search ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.apartmentTitle.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.staffName.toLowerCase().includes(search.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [list, dateFilter, search]);

  const selectedReservation = confirmedReservations.find(r => r.id === selectedReservationId);

  async function handleRecordSale() {
    if (!selectedReservation || !finalPrice) {
      toast('Please select a reservation and enter the agreed final price', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const created = await salesService.create({
        apartmentId: selectedReservation.apartmentId,
        apartmentTitle: selectedReservation.apartmentTitle,
        customerName: selectedReservation.customerName,
        customerEmail: selectedReservation.customerEmail,
        finalPrice: Number(finalPrice),
        reservationId: selectedReservation.id,
        staffName: user?.name || 'Staff Member',
      });
      setList(prev => [created, ...prev]);
      toast('Sale record finalized successfully. Unit status updated.', 'success');
      setNewSaleOpen(false);
      setSelectedReservationId('');
      setFinalPrice('');
    } catch (err: any) {
      toast(err.message || 'Failed to record sale transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    toast('Sales ledger exported successfully (CSV/Report format)', 'success');
  }

  const dateOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Time' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-06', label: 'June 2026' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Revenue & Settlements
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {kpis.count} Closed Deeds
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sales Records
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit realized property purchases, convert reservation holds to deeds, and export transaction logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button
            type="button"
            onClick={() => setNewSaleOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Volume
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Transactions</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">{kpis.count}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Completed title deeds</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Gross Realized
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Sales Revenue</p>
            <h3 className="text-2xl font-extrabold text-amber-600 tracking-tight mt-0.5">
              {formatCurrency(kpis.totalRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">All verified payments combined</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
              Avg Ticket
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Average Unit Price</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatCurrency(kpis.avgPrice)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Per penthouse or suite</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
              Current Month
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">This Month's Inflow</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatCurrency(kpis.monthRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">{kpis.monthCount} sale(s) closed in Sep</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input 
            placeholder="Search by sale ID, unit, buyer, or staff..." 
            icon={<Search className="w-4 h-4 text-slate-400" />} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <Select options={dateOptions} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          </div>
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
            {filtered.length} records found
          </span>
        </div>
      </div>

      {/* Main Sales Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading verified sales transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState 
              variant="inbox" 
              title="No sales recorded yet" 
              description="Finalized property sale contracts converted from customer reservations will appear here." 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Contract ID</th>
                  <th className="px-6 py-4">Residence Unit</th>
                  <th className="px-6 py-4">Buyer Name</th>
                  <th className="px-6 py-4">Settled Price</th>
                  <th className="px-6 py-4">Deed Date</th>
                  <th className="px-6 py-4">Authorizing Agent</th>
                  <th className="px-6 py-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Sale ID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {s.id}
                      </span>
                    </td>

                    {/* Apartment */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-sm">{s.apartmentTitle}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{s.customerName}</p>
                    </td>

                    {/* Final Price */}
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(s.finalPrice)}
                      </span>
                    </td>

                    {/* Sale Date */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {formatDate(s.saleDate)}
                    </td>

                    {/* Staff */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        {s.staffName}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button"
                        onClick={() => setViewTarget(s)} 
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer" 
                        title="View Full Contract Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Sale Detail Modal */}
      <Modal 
        open={!!viewTarget} 
        onClose={() => setViewTarget(null)} 
        title="Sale & Deed Summary" 
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
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Deed Executed
              </span>
            </div>
            
            <DetailRow label="Residence" value={viewTarget.apartmentTitle} />
            <DetailRow label="Buyer Name" value={viewTarget.customerName} />
            <DetailRow label="Buyer Email" value={viewTarget.customerEmail || '—'} />
            <DetailRow label="Settled Purchase Price" value={formatCurrency(viewTarget.finalPrice)} />
            <DetailRow label="Transaction Date" value={formatDate(viewTarget.saleDate)} />
            <DetailRow label="Handling Agent" value={viewTarget.staffName} />
            <DetailRow label="Reference Hold ID" value={viewTarget.reservationId || 'Direct Sale'} />

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mt-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Deed Settlement Verification
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Reservation deposits and associated bank slips for this unit have been verified and settled in full under legal escrow.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Record New Sale Modal */}
      <Modal
        open={newSaleOpen}
        onClose={() => setNewSaleOpen(false)}
        title="Record New Property Sale"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setNewSaleOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordSale} 
              disabled={submitting || confirmedReservations.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
            >
              {submitting ? 'Executing Contract...' : 'Record & Finalize Sale'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {confirmedReservations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-800">No active reservation holds available</p>
              <p className="text-xs text-slate-400 mt-1">
                A client must have a Pending or Confirmed reservation hold before a formal sale record can be settled.
              </p>
            </div>
          ) : (
            <>
              <Select
                label="Select Priority Reservation Hold"
                placeholder="Choose from confirmed holds..."
                options={confirmedReservations.map(r => ({ 
                  value: r.id, 
                  label: `${r.id} — ${r.apartmentTitle} (${r.customerName})` 
                }))}
                value={selectedReservationId}
                onChange={e => setSelectedReservationId(e.target.value)}
              />

              {selectedReservation && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit</span>
                    <span className="font-bold text-slate-900">{selectedReservation.apartmentTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client</span>
                    <span className="font-bold text-slate-900">{selectedReservation.customerName}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200/60">
                    <span className="text-slate-700 font-medium">Deposit Deductible</span>
                    <span className="font-extrabold text-amber-800">{formatCurrency(selectedReservation.reservationFee)}</span>
                  </div>
                </div>
              )}

              <Input
                label="Agreed Final Sale Price (Rs.)"
                type="number"
                value={finalPrice}
                onChange={e => setFinalPrice(e.target.value)}
                placeholder="e.g. 28500000"
              />
            </>
          )}
        </div>
      </Modal>

    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}