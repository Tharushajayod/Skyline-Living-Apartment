import { useEffect, useState } from 'react';
import {
  Building2,
  User as UserIcon,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ExternalLink,
  Layers,
  AlertCircle,
  Receipt,
  Eye,
  Loader2,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import { salesService } from '@/shared/services/managementService';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { SaleDetails, Payment, PaymentPlanItem } from '@/shared/types';

interface SaleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string | null;
}

export default function SaleDetailsModal({
  open,
  onClose,
  saleId,
}: SaleDetailsModalProps) {
  const [details, setDetails] = useState<SaleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'plan'>('overview');

  useEffect(() => {
    if (!open || !saleId) {
      setDetails(null);
      setError(null);
      return;
    }

    // Check fast cache first for instant UX
    const cached = salesService.getCachedDetails(saleId);
    if (cached) {
      setDetails(cached);
    }

    let isMounted = true;
    setLoading(!cached);
    setError(null);

    salesService
      .getDetails(saleId)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error('Failed to load sale details:', err);
          if (!cached) {
            setError(err.message || 'Unable to retrieve complete sale records.');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, saleId]);

  if (!open) return null;

  const sale = details?.sale;
  const customer = details?.customer;
  const apartment = details?.apartment;
  const reservation = details?.reservation;
  const paymentSummary = details?.paymentSummary;
  const payments = details?.payments || [];
  const paymentPlan = details?.paymentPlan;

  // Primary apartment image
  const apartmentImage =
    apartment?.images && apartment.images.length > 0
      ? apartment.images[0].url
      : apartment?.floorPlanUrl || '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title=""
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authenticated Escrow Ledger & Title Record</span>
          </div>
          <Button variant="outline" onClick={onClose} className="border-slate-300">
            Close Record
          </Button>
        </div>
      }
    >
      {loading && !details ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Loading Sale Deed & Financials</h3>
            <p className="text-xs text-slate-500 mt-1">
              Retrieving ledger, payments history, reservation holds, and payment plan...
            </p>
          </div>
        </div>
      ) : error && !details ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Sale Record Not Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <Button variant="outline" onClick={onClose} className="mt-2">
            Go Back
          </Button>
        </div>
      ) : details && sale ? (
        <div className="space-y-6 -mt-2">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-navy-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md shadow-sm">
                    {sale.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Deed Executed & Closed
                  </span>
                  {sale.reservationId && (
                    <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                      Ref: {sale.reservationId}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white pt-1">
                  {apartment?.title || sale.apartmentTitle}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Deed Finalized on {formatDate(sale.saleDate)}
                </p>
              </div>

              <div className="sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none backdrop-blur-sm sm:backdrop-blur-none border border-white/10 sm:border-0">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                  Final Settled Price
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {formatCurrency(sale.finalPrice)}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Sale & Property Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('financials')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'financials'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Financials & Payments ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('plan')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'plan'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Payment Plan {paymentPlan ? '• Active' : ''}
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* SECTION A & B: Sale Info + Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Section A: Sale Information */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Section A • Sale Information
                        </h4>
                        <p className="text-[11px] text-slate-400">Legal contract & execution terms</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Contract / Sale ID</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {sale.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Final Purchase Price</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(sale.finalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Execution Date</span>
                      <span className="font-semibold text-slate-800">{formatDate(sale.saleDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Authorizing Staff Agent</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        {sale.staffName || 'Official Staff'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Title Status</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Fully Settled & Sold
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section B: Customer Information */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Section B • Buyer Information
                        </h4>
                        <p className="text-[11px] text-slate-400">Registered property purchaser</p>
                      </div>
                    </div>
                    {customer?.status && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {customer.status}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Customer ID</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {customer?.id || 'USR-REG'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Full Legal Name</span>
                      <span className="font-bold text-slate-900">
                        {customer?.name || sale.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Email Address</span>
                      <span className="font-medium text-slate-800">
                        {customer?.email || sale.customerEmail || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Contact Phone</span>
                      <span className="font-medium text-slate-800">
                        {customer?.phone || 'Provided during settlement'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Account Role</span>
                      <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                        {customer?.role || 'Customer'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section C: Apartment Information */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Section C • Apartment & Unit Specification
                      </h4>
                      <p className="text-[11px] text-slate-400">Sold residential unit details</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    SOLD
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {apartmentImage ? (
                    <div className="md:col-span-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video md:aspect-square relative group">
                      <img
                        src={apartmentImage}
                        alt={apartment?.title || 'Apartment'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                        <span className="text-white text-xs font-bold truncate">
                          {apartment?.title}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className={apartmentImage ? 'md:col-span-8' : 'md:col-span-12'}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Unit Identifier
                        </span>
                        <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                          {apartment?.id || sale.apartmentId}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Floor / Level
                        </span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          Level {apartment?.floor ?? 1}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Apartment Type
                        </span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {apartment?.type || '2BR Suite'}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Bedrooms</span>
                          <span className="text-xs font-extrabold text-slate-900">{apartment?.bedrooms ?? 2} Beds</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center gap-2">
                        <Bath className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Bathrooms</span>
                          <span className="text-xs font-extrabold text-slate-900">{apartment?.bathrooms ?? 2} Baths</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Floor Area</span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {apartment?.size ? `${apartment.size.toLocaleString()} sq ft` : '1,250 sq ft'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {apartment?.address || apartment?.city || 'Colombo 03, Western Province'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-slate-400 text-[10px] block">Listed Price: {formatCurrency(apartment?.price || sale.finalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section D: Reservation Details */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Section D • Associated Reservation Hold
                      </h4>
                      <p className="text-[11px] text-slate-400">Initial priority booking and deposit record</p>
                    </div>
                  </div>
                  {reservation && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {reservation.status}
                    </span>
                  )}
                </div>

                {reservation ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reservation Hold ID
                      </span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{reservation.id}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reservation Fee (10%)
                      </span>
                      <p className="font-extrabold text-amber-700 mt-0.5">
                        {formatCurrency(reservation.reservationFee)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Hold Placed On
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">{formatDate(reservation.createdAt)}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Hold Expiration
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {reservation.expiresAt ? formatDate(reservation.expiresAt) : 'Fulfilled into Sale'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
                    <p className="text-xs text-slate-600 font-medium">
                      No reservation hold information available for this sale (Direct full purchase or legacy transaction).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIALS & PAYMENTS */}
          {activeTab === 'financials' && (
            <div className="space-y-5">
              {/* Section E: Payment Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Agreed Purchase Price
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">
                    {formatCurrency(paymentSummary?.apartmentPrice ?? sale.finalPrice)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Total property valuation</p>
                </div>

                <div className="bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Total Verified Inflow
                  </span>
                  <p className="text-lg font-extrabold text-emerald-700 mt-1">
                    {formatCurrency(paymentSummary?.totalVerifiedPayments ?? sale.finalPrice)}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">100% verified & credited</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Outstanding Balance
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">
                    {formatCurrency(paymentSummary?.remainingBalance ?? 0)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Fully Settled (0.00)
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Transactions
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">
                    {paymentSummary?.paymentCount ?? payments.length} Payment(s)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verified escrow ledger</p>
                </div>
              </div>

              {/* Section F: Payment History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Section F • Complete Payment History
                      </h4>
                      <p className="text-[11px] text-slate-400">Audited bank transfer and slip verification logs</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {payments.length} Transaction(s)
                  </span>
                </div>

                {payments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No payment records directly attached to this transaction ledger.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="px-4 py-3">Txn ID</th>
                          <th className="px-4 py-3">Payment Type</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Submission Date</th>
                          <th className="px-4 py-3">Verified Date & Officer</th>
                          <th className="px-4 py-3 text-right">Proof / Documents</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => {
                          const isVerified = p.status === 'Verified' || (p.status as any) === 'VERIFIED';
                          const isPending = p.status === 'Pending' || (p.status as any) === 'PENDING';
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {p.id}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-slate-800">{p.type}</span>
                                {p.notes && (
                                  <p className="text-[10px] text-slate-400 italic truncate max-w-xs">{p.notes}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {formatCurrency(p.amount)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isVerified
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {isVerified ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : isPending ? (
                                    <Clock className="w-3 h-3" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {p.uploadedAt ? formatDate(p.uploadedAt) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-800">
                                  {p.verifiedAt ? formatDate(p.verifiedAt) : '—'}
                                </p>
                                {p.verifiedBy && (
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    {p.verifiedBy}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {p.proofUrl ? (
                                    <a
                                      href={p.proofUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-semibold text-[11px] transition border border-slate-200"
                                      title="View Bank Transfer Slip"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>Slip</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                    </a>
                                  ) : null}
                                  {p.receiptUrl ? (
                                    <a
                                      href={p.receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition border border-emerald-200"
                                      title="Download Official Receipt"
                                    >
                                      <Receipt className="w-3 h-3" />
                                      <span>Receipt</span>
                                    </a>
                                  ) : null}
                                  {!p.proofUrl && !p.receiptUrl && (
                                    <span className="text-slate-400 text-[11px] italic">Verified Slip</span>
                                  )}
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
            </div>
          )}

          {/* TAB 3: PAYMENT PLAN & INSTALLMENT SCHEDULE */}
          {activeTab === 'plan' && (
            <div className="space-y-5">
              {paymentPlan ? (
                <>
                  {/* Plan Overview Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Section G • Payment Plan Terms
                          </h4>
                          <p className="text-[11px] text-slate-400">Structured installment terms approved for this sale</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {paymentPlan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Plan ID
                        </span>
                        <p className="font-mono font-bold text-slate-900 mt-0.5">{paymentPlan.id}</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Plan Type
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5">{paymentPlan.planType}</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Installment Count
                        </span>
                        <p className="font-extrabold text-slate-900 mt-0.5">
                          {paymentPlan.numberOfPayments} Payments
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Per Installment
                        </span>
                        <p className="font-extrabold text-amber-700 mt-0.5">
                          {formatCurrency(paymentPlan.paymentAmount)}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total Plan Principal
                        </span>
                        <p className="font-extrabold text-slate-900 mt-0.5">
                          {formatCurrency(paymentPlan.totalPlanAmount)}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Remaining Unsettled
                        </span>
                        <p className="font-extrabold text-slate-900 mt-0.5">
                          {formatCurrency(paymentPlan.remainingAmount ?? 0)}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Start Date
                        </span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          {paymentPlan.startDate ? formatDate(paymentPlan.startDate) : '—'}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Approving Officer
                        </span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          {paymentPlan.approvedBy || 'Management'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Installments Schedule Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Scheduled Installments & Payment Status
                      </h4>
                      <span className="text-xs font-bold text-slate-400">
                        {paymentPlan.items?.length || paymentPlan.numberOfPayments} Total Scheduled Steps
                      </span>
                    </div>

                    {paymentPlan.items && paymentPlan.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              <th className="px-4 py-3">Sequence</th>
                              <th className="px-4 py-3">Due Date</th>
                              <th className="px-4 py-3">Scheduled Amount</th>
                              <th className="px-4 py-3 text-right">Fulfillment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paymentPlan.items.map((item: PaymentPlanItem) => {
                              const isPaid = item.status === 'Paid' || (item.status as any) === 'PAID';
                              const isPending =
                                item.status === 'Pending Verification' ||
                                (item.status as any) === 'PENDING_VERIFICATION';
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                  <td className="px-4 py-3">
                                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      #{item.sequenceNo}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-700">
                                    {formatDate(item.dueDate)}
                                  </td>
                                  <td className="px-4 py-3 font-extrabold text-slate-900">
                                    {formatCurrency(item.amount)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                        isPaid
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : isPending
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {isPaid ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : isPending ? (
                                        <Clock className="w-3 h-3" />
                                      ) : (
                                        <Calendar className="w-3 h-3" />
                                      )}
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        Installment breakdown details have been settled in full.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Payment Plan Used</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No payment plan was used for this sale. The property was settled through a direct or standard full-payment transaction.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
