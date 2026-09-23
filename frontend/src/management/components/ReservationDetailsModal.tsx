import { useEffect, useState } from 'react';
import {
  Building2,
  User as UserIcon,
  Calendar,
  DollarSign,
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
  AlertCircle,
  Receipt,
  Loader2,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { ReservationDetails } from '@/shared/types';

interface ReservationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  reservationId: string | null;
  onCancelRequest?: (reservationId: string) => void;
}

export default function ReservationDetailsModal({
  open,
  onClose,
  reservationId,
  onCancelRequest,
}: ReservationDetailsModalProps) {
  const [details, setDetails] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !reservationId) {
      setDetails(null);
      setError(null);
      return;
    }

    const cached = reservationService.getCachedDetails(reservationId);
    if (cached) {
      setDetails(cached);
    }

    let isMounted = true;
    setLoading(!cached);
    setError(null);

    reservationService
      .getDetails(reservationId)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error('Failed to load reservation details:', err);
          if (!cached) {
            setError(err.message || 'Unable to retrieve complete reservation records.');
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
  }, [open, reservationId]);

  if (!open) return null;

  const res = details?.reservation;
  const cust = details?.customer;
  const apt = details?.apartment;
  const appt = details?.appointment;
  const pmt = details?.payment;
  const refund = details?.refund;

  const apartmentImage =
    apt?.images && apt.images.length > 0
      ? apt.images[0].url
      : apt?.floorPlanUrl || '';

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
            <span>Authenticated Reservation Record & Audit Trail</span>
          </div>
          <div className="flex items-center gap-2">
            {res && (res.status === 'Pending' || res.status === 'Confirmed') && onCancelRequest && (
              res.hasPaymentCommitment ? (
                <span
                  className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5"
                  title="Reservations with payments or active payment plans cannot be cancelled through the normal cancellation flow."
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Cancellation unavailable ({res.paymentCommitmentReason || 'payment commitment active'})</span>
                </span>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onCancelRequest(res.id);
                  }}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Cancel & Settle Refund
                </Button>
              )
            )}
            <Button variant="outline" onClick={onClose} className="border-slate-300">
              Close
            </Button>
          </div>
        </div>
      }
    >
      {loading && !details ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Loading Reservation Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">
              Retrieving customer hold, viewing appointment, payments, and financial settlement...
            </p>
          </div>
        </div>
      ) : error && !details ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Reservation Record Not Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <Button variant="outline" onClick={onClose} className="mt-2">
            Go Back
          </Button>
        </div>
      ) : details && res ? (
        <div className="space-y-6 -mt-2">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-navy-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md shadow-sm">
                    {res.id}
                  </span>
                  <Badge variant={statusToVariant(res.status)} dot>
                    {res.status}
                  </Badge>
                  {res.hasPaymentCommitment && (
                    <span className="text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                      {res.paymentCommitmentReason || 'Payment Commitment Active'}
                    </span>
                  )}
                  {refund && (
                    <span className="text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                      Refund {refund.refundStatus}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white pt-1">
                  {apt?.title || res.apartmentTitle}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Hold Created on {formatDate(res.createdAt)} • Expiry: {formatDate(res.expiresAt)}
                </p>
              </div>

              <div className="sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none backdrop-blur-sm sm:backdrop-blur-none border border-white/10 sm:border-0">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                  Reservation Deposit (10%)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {formatCurrency(res.reservationFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1 & 2: Reservation Info + Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Section 1: Reservation Information */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Reservation Details
                  </h4>
                  <p className="text-[11px] text-slate-400">Priority hold parameters & status</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Hold Reference ID</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {res.id}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">10% Deposit Amount</span>
                  <span className="font-extrabold text-amber-700 text-sm">
                    {formatCurrency(res.reservationFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Hold Placed At</span>
                  <span className="font-semibold text-slate-800">{formatDate(res.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Expiry Deadline</span>
                  <span className="font-semibold text-slate-800">{formatDate(res.expiresAt)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Current Hold Status</span>
                  <Badge variant={statusToVariant(res.status)} size="sm" dot>
                    {res.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Section 2: Customer Information */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Customer Information
                    </h4>
                    <p className="text-[11px] text-slate-400">Prospective buyer on hold</p>
                  </div>
                </div>
                {cust?.status && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {cust.status}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Customer ID</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {cust?.id || 'USR-REG'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <span className="font-bold text-slate-900">{cust?.name || res.customerName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="font-medium text-slate-800">{cust?.email || res.customerEmail}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="font-medium text-slate-800">{cust?.phone || 'On file'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Account Role</span>
                  <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                    {cust?.role || 'Customer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Apartment Information */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Reserved Residence Unit
                  </h4>
                  <p className="text-[11px] text-slate-400">Architectural specifications & status</p>
                </div>
              </div>
              {apt?.status && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {apt.status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {apartmentImage ? (
                <div className="md:col-span-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video md:aspect-square relative group">
                  <img
                    src={apartmentImage}
                    alt={apt?.title || 'Apartment'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-bold truncate">{apt?.title}</span>
                  </div>
                </div>
              ) : null}

              <div className={apartmentImage ? 'md:col-span-8' : 'md:col-span-12'}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Unit ID
                    </span>
                    <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                      {apt?.id || res.apartmentId}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Floor / Level
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">Level {apt?.floor ?? 1}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Type
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{apt?.type || 'Suite'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Bedrooms</span>
                      <span className="text-xs font-extrabold text-slate-900">{apt?.bedrooms ?? 2} Beds</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center gap-2">
                    <Bath className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Bathrooms</span>
                      <span className="text-xs font-extrabold text-slate-900">{apt?.bathrooms ?? 2} Baths</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Area</span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {apt?.size ? `${apt.size.toLocaleString()} sq ft` : '1,250 sq ft'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{apt?.address || apt?.city || 'Skyline Tower'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-500 text-[11px] font-bold block">
                      Total Valuation: {formatCurrency(apt?.price || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Associated Completed Appointment */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Associated Viewing Appointment
                  </h4>
                  <p className="text-[11px] text-slate-400">Pre-requisite completed viewing session</p>
                </div>
              </div>
              {appt && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {appt.status}
                </span>
              )}
            </div>

            {appt ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Appointment ID
                  </span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{appt.id}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Session Date
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{formatDate(appt.date)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Time Slot
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{appt.timeSlot}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verification Status
                  </span>
                  <p className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Viewing Verified
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Direct reservation placed or legacy appointment record.
                </p>
              </div>
            )}
          </div>

          {/* Section 5: Payment / Reservation Fee */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Reservation Fee & Payment Proof
                  </h4>
                  <p className="text-[11px] text-slate-400">Bank transfer verification and official receipt</p>
                </div>
              </div>
              {pmt && (
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    pmt.status === 'Verified' || (pmt.status as any) === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {pmt.status}
                </span>
              )}
            </div>

            {pmt ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment ID
                  </span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{pmt.id}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Amount Paid
                  </span>
                  <p className="font-extrabold text-emerald-700 mt-0.5">{formatCurrency(pmt.amount)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verification Date
                  </span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {pmt.verifiedAt ? formatDate(pmt.verifiedAt) : 'Pending Verification'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Documents
                    </span>
                    <span className="text-slate-800 font-semibold mt-0.5 block">
                      {pmt.proofUrl ? 'Slip Uploaded' : 'Cash/Transfer'}
                    </span>
                  </div>
                  {pmt.proofUrl && (
                    <a
                      href={pmt.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-amber-600 hover:border-amber-400 transition"
                      title="View Slip"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Payment proof is pending upload or awaiting administrative verification.
                </p>
              </div>
            )}
          </div>

          {/* Section 6: Cancellation & Refund Settlement (If cancelled/refunded) */}
          {refund && (
            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-purple-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Financial Settlement & Refund Audit Record
                    </h4>
                    <p className="text-[11px] text-purple-700">Permanent financial record of fee resolution</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  {refund.refundType} • {refund.refundStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white rounded-xl p-3 border border-purple-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Original Fee
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(refund.originalFee)}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-purple-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Refund to Customer
                  </span>
                  <p className="font-extrabold text-emerald-700 mt-0.5">
                    {formatCurrency(refund.refundAmount)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Company Retained Fee
                  </span>
                  <p className="font-extrabold text-purple-900 mt-0.5">
                    {formatCurrency(refund.companyRetainedAmount)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-purple-200 text-xs space-y-1">
                <p className="text-slate-500 font-medium">
                  <strong className="text-slate-700">Reason:</strong> {refund.reason}
                </p>
                <p className="text-slate-500 font-medium">
                  <strong className="text-slate-700">Processed By:</strong> {refund.processedBy} on{' '}
                  {formatDate(refund.processedAt || refund.createdAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
