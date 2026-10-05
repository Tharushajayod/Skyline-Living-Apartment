import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calculator,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Info,
  Loader2,
  Receipt,
  User,
  Building2,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { ReservationRefund } from '@/shared/types';

interface ReviewCancellationModalProps {
  open: boolean;
  onClose: () => void;
  refund: ReservationRefund | null;
  onSuccess: () => void;
}

export default function ReviewCancellationModal({
  open,
  onClose,
  refund,
  onSuccess,
}: ReviewCancellationModalProps) {
  const { toast } = useToast();
  const [retainedAmountStr, setRetainedAmountStr] = useState<string>('0');
  const [settlementNote, setSettlementNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const originalFee = refund?.originalFee || 0;
  const retainedNum = Number(retainedAmountStr);
  const isRetainedValidNumber = !isNaN(retainedNum) && retainedAmountStr.trim() !== '';
  const calculatedRefund = isRetainedValidNumber ? Math.max(0, originalFee - retainedNum) : 0;

  const isRetainedNegative = isRetainedValidNumber && retainedNum < 0;
  const isRetainedExceedingFee = isRetainedValidNumber && retainedNum > originalFee;
  const isValid = isRetainedValidNumber && !isRetainedNegative && !isRetainedExceedingFee;

  useEffect(() => {
    if (open && refund) {
      setRetainedAmountStr('0');
      setSettlementNote('');
      setErrorMsg(null);
    }
  }, [open, refund]);

  if (!open || !refund) return null;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await reservationService.reviewSettlement(refund.id, {
        companyRetainedAmount: retainedNum,
        settlementNote: settlementNote.trim() ? settlementNote.trim() : undefined,
      });

      toast(
        `Settlement approved successfully. Customer refund of ${formatCurrency(
          calculatedRefund
        )} is now awaiting manual payment.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to approve settlement:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to approve settlement. Please try again.';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Review Customer Cancellation & Settle Refund"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving Settlement...
              </span>
            ) : (
              'Approve Settlement'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 -mt-2">
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Settlement Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Informational Guidance */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-amber-950 text-sm">Administrative Settlement Determination</p>
            <p className="text-amber-800 leading-relaxed">
              Enter the company retained fee below. The system will automatically calculate the refund amount due to the customer. Approving this settlement establishes the financial obligation, which will then await actual manual disbursement.
            </p>
          </div>
        </div>

        {/* Read-Only Information Ledger */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Reservation Reference
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">#{refund.reservationId}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                Refund Ref: #{refund.id}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Residence / Apartment
              </span>
              <span className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {refund.apartmentTitle}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Customer
              </span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {refund.customerName}
              </span>
              <span className="text-xs text-slate-500 block">{refund.customerEmail}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Original Reservation Fee Paid
              </span>
              <span className="font-extrabold text-slate-900 text-base mt-0.5 block">
                {formatCurrency(originalFee)}
              </span>
              {refund.paymentId && (
                <span className="text-[11px] text-slate-400 font-mono block">
                  Payment Ref: #{refund.paymentId}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Cancellation Initiated By
              </span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                {refund.initiatedByRole || 'CUSTOMER'}
                {refund.initiatedByName ? ` (${refund.initiatedByName})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Cancellation Requested Date
              </span>
              <span className="font-medium text-slate-800 text-xs mt-0.5 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDate(refund.requestedAt || refund.createdAt)}
              </span>
            </div>
          </div>

          {refund.reason && (
            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Customer's Cancellation Reason
              </span>
              <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200/80 mt-1">
                "{refund.reason}"
              </p>
            </div>
          )}
        </div>

        {/* Settlement Financial Decision Inputs */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-600" />
            Financial Decision & Retained Fee
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="retained-amount-input" className="font-bold text-slate-700">
                Company Retained Amount (Rs.)
              </label>
              <span className="text-[11px] text-slate-400">
                Allowed: Rs. 0 - {formatCurrency(originalFee)}
              </span>
            </div>
            <Input
              id="retained-amount-input"
              type="number"
              min={0}
              max={originalFee}
              step="1000"
              value={retainedAmountStr}
              onChange={(e) => setRetainedAmountStr(e.target.value)}
              placeholder="Enter amount company retains (e.g. 250000)"
              disabled={submitting}
              className="text-sm font-bold font-mono"
            />
            {isRetainedNegative && (
              <p className="text-rose-600 text-[11px] font-semibold">
                Retained amount cannot be negative.
              </p>
            )}
            {isRetainedExceedingFee && (
              <p className="text-rose-600 text-[11px] font-semibold">
                Retained amount cannot exceed the original reservation fee ({formatCurrency(originalFee)}).
              </p>
            )}
          </div>

          {/* Live Automatic Calculation Ledger */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Original Reservation Fee</span>
              <span className="font-semibold font-mono">{formatCurrency(originalFee)}</span>
            </div>
            <div className="flex justify-between items-center text-purple-700 font-medium">
              <span>Less: Company Retained Fee</span>
              <span className="font-bold font-mono">
                - {formatCurrency(isRetainedValidNumber ? Math.max(0, retainedNum) : 0)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-800">
              <span className="font-extrabold text-sm">Calculated Customer Refund</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {formatCurrency(calculatedRefund)}
              </span>
            </div>
          </div>

          {/* Settlement Note */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="settlement-note" className="block text-xs font-bold text-slate-700">
              Settlement Audit Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="settlement-note"
              rows={2}
              maxLength={500}
              value={settlementNote}
              onChange={(e) => setSettlementNote(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Administrative processing deduction as per standard policy..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* Confirmation Notice */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-[11px] text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> Approving this settlement locks in the financial breakdown of <strong>{formatCurrency(calculatedRefund)}</strong> refund and <strong>{formatCurrency(isRetainedValidNumber ? retainedNum : 0)}</strong> retained fee. The status will transition to <em>Awaiting Payment</em> until actual manual refund is disbursed to the customer.
          </span>
        </div>
      </div>
    </Modal>
  );
}
