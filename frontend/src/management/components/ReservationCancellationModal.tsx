import { useState, useEffect } from 'react';
import {
  DollarSign,
  AlertTriangle,
  Receipt,
  FileText,
  ShieldCheck,
  Building2,
  User,
  Calculator,
  Info,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency } from '@/shared/utils/format';
import type { Reservation } from '@/shared/types';

interface ReservationCancellationModalProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  mode?: 'cancellation' | 'expiration';
  onSuccess: () => void;
}

export default function ReservationCancellationModal({
  open,
  onClose,
  reservation,
  mode = 'cancellation',
  onSuccess,
}: ReservationCancellationModalProps) {
  const { toast } = useToast();
  const [refundAmountStr, setRefundAmountStr] = useState('0');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Business Rules (Sections 16, 17, 18):
  // 1. Reservation Fee is strictly non-refundable upon cancellation/expiration.
  // 2. Only other verified payments (if any) can be refunded.
  const reservationFee = reservation
    ? Number(reservation.nonRefundableFee ?? reservation.reservationFee) || 0
    : 0;
  const totalPaid = reservation ? Number(reservation.totalPaid) || 0 : 0;
  const otherPaidAmount = reservation
    ? Number(reservation.otherPaidAmount) || Math.max(0, totalPaid - reservationFee)
    : 0;
  const maxRefundable = otherPaidAmount;

  const refundAmount = Math.max(0, Number(refundAmountStr) || 0);
  const basisAmount = totalPaid > 0 ? totalPaid : reservationFee;
  const companyRetained = Math.max(0, basisAmount - refundAmount);

  useEffect(() => {
    if (open && reservation) {
      setRefundAmountStr('0');
      setReason(
        mode === 'expiration'
          ? 'Reservation expired after hold window. Non-refundable reservation deposit retained by company policy.'
          : 'Customer requested cancellation of residence hold. Non-refundable reservation deposit retained.'
      );
      setNotes('');
    }
  }, [open, reservation, mode]);

  if (!open || !reservation) return null;

  const isRefundOverMax = refundAmount > maxRefundable;
  const isRefundNegative = refundAmount < 0;
  const isReasonEmpty = !reason.trim();
  const hasCompletedSale = Boolean(reservation.hasCompletedSale);
  const isValid = !hasCompletedSale && !isRefundOverMax && !isRefundNegative && !isReasonEmpty;

  const handleSubmit = async () => {
    if (hasCompletedSale) {
      toast('Reservation cannot be cancelled because a sale deed is registered for this apartment.', 'error');
      return;
    }

    if (!isValid) {
      toast('Please verify all refund and retained amounts before proceeding', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        refundAmount: Number(refundAmount),
        companyRetainedAmount: Number(companyRetained),
        reason: reason.trim(),
        notes: notes.trim() ? notes.trim() : undefined,
      };

      if (mode === 'expiration') {
        await reservationService.processExpiredRefund(reservation.id, payload);
        toast('Expired reservation settlement & retained fee recorded successfully', 'success');
      } else {
        await reservationService.cancelWithRefund(reservation.id, payload);
        toast('Reservation cancelled and refund financial record created', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to process cancellation refund', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        mode === 'expiration'
          ? 'Process Expired Reservation Settlement'
          : 'Cancel Reservation & Process Refund'
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={
              mode === 'expiration'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                : 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
            }
          >
            {submitting
              ? 'Recording Settlement...'
              : mode === 'expiration'
              ? 'Record Settlement & Retained Fee'
              : 'Cancel Hold & Process Refund'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {hasCompletedSale && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Cancellation Blocked by Business Rule</p>
              <p className="mt-0.5 text-[11px] text-rose-700">
                This reservation cannot be cancelled because a completed sale deed is already registered for this apartment.
              </p>
            </div>
          </div>
        )}

        {/* Reservation Fee Policy Notice */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Non-Refundable Reservation Fee Policy</p>
            <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
              The 10% reservation fee ({formatCurrency(reservationFee)}) is strictly non-refundable upon cancellation or expiration. If any other verified payments exist (e.g. installment payments), management may refund up to the other paid amount.
            </p>
          </div>
        </div>

        {/* Hold Overview Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Reservation Hold ID</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {reservation.id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Residence Unit</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              {reservation.apartmentTitle}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Customer</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              {reservation.customerName}
            </span>
          </div>
        </div>

        {/* Live Financial Breakdown Card (Sections 16, 17, 18) */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Financial Settlement Breakdown
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white rounded-xl p-2.5 border border-slate-200">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Non-Refundable Fee</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                {formatCurrency(reservationFee)}
              </span>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-slate-200">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Paid</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                {formatCurrency(totalPaid)}
              </span>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-blue-200">
              <span className="text-[9px] text-blue-700 font-bold block uppercase">Other Paid Amount</span>
              <span className="font-bold text-blue-900 text-xs mt-0.5 block">
                {formatCurrency(otherPaidAmount)}
              </span>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-emerald-200">
              <span className="text-[9px] text-emerald-700 font-bold block uppercase">Max Refundable</span>
              <span className="font-extrabold text-emerald-700 text-xs mt-0.5 block">
                {formatCurrency(maxRefundable)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-amber-200/60">
            <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Customer Refund</span>
              <span className="font-extrabold text-emerald-800 text-sm mt-0.5 block">
                {formatCurrency(refundAmount)}
              </span>
            </div>
            <div className="bg-purple-50 rounded-xl p-2 border border-purple-200">
              <span className="text-[10px] text-purple-800 font-bold block uppercase">Company Retained</span>
              <span className="font-extrabold text-purple-900 text-sm mt-0.5 block">
                {formatCurrency(companyRetained)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
            Formula: Company retains the non-refundable reservation fee ({formatCurrency(reservationFee)}) plus any unrefunded balance. Total Retained: <strong className="text-purple-900">{formatCurrency(companyRetained)}</strong> will be recorded as retained income.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Refund Amount to Customer (Rs.) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Max Refundable: <strong className="text-emerald-700">{formatCurrency(maxRefundable)}</strong>
              </span>
            </div>
            <Input
              type="number"
              min="0"
              max={maxRefundable.toString()}
              value={refundAmountStr}
              onChange={(e) => setRefundAmountStr(e.target.value)}
              placeholder="0"
            />
            {isRefundOverMax && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Refund amount cannot exceed other payments ({formatCurrency(maxRefundable)}). The reservation fee is non-refundable.
              </p>
            )}
            {isRefundNegative && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Refund amount cannot be negative.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cancellation / Settlement Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for cancellation and retained fee percentage..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
            />
            {isReasonEmpty && (
              <p className="text-[11px] text-rose-600 font-semibold">
                Reason is mandatory for audit and accounting records.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Ledger Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal accounting notes or bank reference details..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
