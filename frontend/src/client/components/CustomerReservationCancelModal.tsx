import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  DollarSign,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  Loader2,
  Info,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { useToast } from '@/shared/components/ui/Toast';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate, countdownTo } from '@/shared/utils/format';
import type { ReservationDetails } from '@/shared/types';

interface CustomerReservationCancelModalProps {
  open: boolean;
  onClose: () => void;
  details: ReservationDetails;
  onSuccess: () => void;
}

export default function CustomerReservationCancelModal({
  open,
  onClose,
  details,
  onSuccess,
}: CustomerReservationCancelModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const res = details.reservation;
  const apt = details.apartment;
  const pmt = details.payment;

  // Authoritative values from details
  const depositAmount = details.refundAmount || res?.reservationFee || (pmt?.amount ? Number(pmt.amount) : 0);
  const paymentTime = details.reservationFeeConfirmedAt || res?.reservationFeeConfirmedAt || details.successfulPaymentTime || pmt?.verifiedAt;
  const refundDeadline = details.cancellationDeadline || res?.cancellationDeadline || details.refundDeadline || (paymentTime ? new Date(new Date(paymentTime).getTime() + 48 * 3600 * 1000).toISOString() : null);

  // Live countdown state
  const [countdown, setCountdown] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setErrorMsg(null);
      return;
    }

    if (!refundDeadline) {
      setIsExpired(true);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(refundDeadline).getTime();
      const diffMs = end - now;

      if (diffMs <= 0) {
        setIsExpired(true);
        setCountdown('0h 0m remaining');
      } else {
        setIsExpired(false);
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setCountdown(`${hours}h ${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [open, refundDeadline]);

  if (!open || !res) return null;

  const handleConfirm = async () => {
    if (submitting) return;

    if (isExpired) {
      setErrorMsg('The 48-hour refund period has expired. This reservation is no longer eligible for cancellation refund.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await reservationService.cancelReservation(res.id, {
        reason: reason.trim() ? reason.trim() : undefined,
      });

      toast('Cancellation request submitted successfully. It is now awaiting administrative review.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to cancel reservation:', err);
      const message = err.response?.data?.message || err.message || 'Failed to cancel reservation. Please try again.';
      setErrorMsg(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Request Reservation Cancellation"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            Keep Reservation
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || isExpired}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Request...
              </span>
            ) : (
              'Submit Cancellation Request'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 -mt-2">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Cancellation Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 48-Hour Eligibility Banner */}
        {!isExpired ? (
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-900 text-sm">48-Hour Cancellation Window Active</p>
              <p className="text-emerald-800 leading-relaxed">
                You are eligible to request cancellation because this reservation was verified within the last 48 hours. Your request will be submitted for administrative review and financial settlement.
              </p>
              {countdown && (
                <div className="pt-1 flex items-center gap-1.5 font-bold text-emerald-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cancellation window closes in: <strong className="text-emerald-900 font-extrabold">{countdown}</strong></span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">48-Hour Refund Period Expired</p>
              <p className="text-amber-800 mt-0.5">
                The 48-hour refund period expired on <strong>{formatDate(refundDeadline || '')}</strong>. Reservations cancelled after the 48-hour window cannot be refunded under standard policy.
              </p>
            </div>
          </div>
        )}

        {/* Structured Details Ledger */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Reservation Reference
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{res.id}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Residence / Apartment
              </span>
              <span className="font-bold text-slate-900 text-sm truncate block">
                {apt?.title || res.apartmentTitle}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Payment Verification Date
              </span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {paymentTime ? formatDate(paymentTime) : 'Verified on file'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Cancellation Window Deadline
              </span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {refundDeadline ? formatDate(refundDeadline) : '48 hours from payment'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Reservation Deposit (10%)
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {formatCurrency(depositAmount)}
              </span>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                Refund Status
              </span>
              <span className="text-sm font-extrabold text-amber-900 mt-1 block">
                Pending Review
              </span>
              <span className="text-[10px] text-amber-700 block mt-0.5">
                Amount determined after review
              </span>
            </div>
          </div>
        </div>

        {/* Reason for Cancellation (Optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="cancel-reason" className="font-bold text-slate-700">
              Reason for cancellation <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {reason.length}/500
            </span>
          </div>
          <textarea
            id="cancel-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="Please let us know why you are cancelling your reservation..."
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Warning / Confirmation notice */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Policy Notice:</strong> Submitting cancellation will immediately release your hold on this residence unit and submit a refund request for administrative review. The final refund amount will be determined following review.
          </span>
        </div>
      </div>
    </Modal>
  );
}
