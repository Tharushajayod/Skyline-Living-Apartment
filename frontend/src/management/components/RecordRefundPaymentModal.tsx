import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Info,
  Loader2,
  Receipt,
  ShieldCheck,
  User,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { Input, Select } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { ReservationRefund } from '@/shared/types';

interface RecordRefundPaymentModalProps {
  open: boolean;
  onClose: () => void;
  refund: ReservationRefund | null;
  onSuccess: () => void;
}

export default function RecordRefundPaymentModal({
  open,
  onClose,
  refund,
  onSuccess,
}: RecordRefundPaymentModalProps) {
  const { toast } = useToast();
  const [refundMethod, setRefundMethod] = useState<string>('Bank Transfer');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [refundDate, setRefundDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [internalNote, setInternalNote] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refundAmount = refund?.refundAmount || 0;
  const isReferenceRequired = refundMethod === 'Bank Transfer';
  const isFormValid = (!isReferenceRequired || transactionReference.trim().length > 0) && confirmed;

  useEffect(() => {
    if (open && refund) {
      setRefundMethod('Bank Transfer');
      setTransactionReference('');
      setRefundDate(new Date().toISOString().substring(0, 10));
      setInternalNote('');
      setConfirmed(false);
      setErrorMsg(null);
    }
  }, [open, refund]);

  if (!open || !refund) return null;

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await reservationService.recordRefundPayment(refund.id, {
        refundMethod,
        transactionReference: transactionReference.trim() ? transactionReference.trim() : undefined,
        settlementNote: internalNote.trim() ? internalNote.trim() : undefined,
      });

      toast(
        `Refund of ${formatCurrency(
          refundAmount
        )} recorded as COMPLETED successfully.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to record refund payment:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to record refund payment. Please try again.';
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
      title="Record Manual Refund Payment"
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
            disabled={!isFormValid || submitting}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Recording Payment...
              </span>
            ) : (
              'Confirm Refund Paid'
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
              <p className="font-bold text-rose-900">Payment Recording Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Read-Only Approved Refund Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                Approved Refund Amount Due
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {formatCurrency(refundAmount)}
              </h3>
              <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-2">
                <span>Hold #{refund.reservationId}</span>
                <span>•</span>
                <span>Refund Ref #{refund.id}</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 sm:text-right text-xs space-y-1">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">
                Financial Settlement
              </span>
              <p className="text-white font-semibold">
                Original Fee: {formatCurrency(refund.originalFee)}
              </p>
              <p className="text-purple-300 font-semibold">
                Retained Fee: {formatCurrency(refund.companyRetainedAmount || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Residence Summary */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Customer (Payee)
              </span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {refund.customerName}
              </span>
              <span className="text-xs text-slate-500 block">{refund.customerEmail}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Residence / Unit
              </span>
              <span className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {refund.apartmentTitle}
              </span>
              {refund.paymentId && (
                <span className="text-[11px] text-slate-400 font-mono block">
                  Original Payment: #{refund.paymentId}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Cancellation Initiator
              </span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 inline-block">
                {refund.initiatedByRole || 'CUSTOMER'}
                {refund.initiatedByName ? ` (${refund.initiatedByName})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Settlement Status
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-0.5">
                {refund.refundStatus}
              </span>
            </div>
          </div>

          {refund.settlementNote && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Settlement Approval Note
              </span>
              <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200/80 mt-1">
                "{refund.settlementNote}"
              </p>
            </div>
          )}
        </div>

        {/* Manual Payment Disbursement Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Disbursement Payment Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label htmlFor="refund-method-select" className="block font-bold text-slate-700">
                Disbursement Method <span className="text-rose-500">*</span>
              </label>
              <Select
                id="refund-method-select"
                options={[
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Other', label: 'Other (Cheque / Direct)' },
                ]}
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="refund-date-input" className="block font-bold text-slate-700">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <Input
                id="refund-date-input"
                type="date"
                value={refundDate}
                onChange={(e) => setRefundDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <label htmlFor="refund-reference-input" className="font-bold text-slate-700">
                Transaction / Reference Number {isReferenceRequired && <span className="text-rose-500">*</span>}
              </label>
              <span className="text-[11px] text-slate-400">
                {isReferenceRequired ? 'Required for bank audits' : 'Optional for cash'}
              </span>
            </div>
            <Input
              id="refund-reference-input"
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. TXN-99882201 / Slip Reference"
              disabled={submitting}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label htmlFor="internal-note" className="block font-bold text-slate-700">
              Disbursement Internal Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="internal-note"
              rows={2}
              maxLength={500}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Transferred via Commercial Bank account ending in 4102..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* Confirmation Checkbox & Warning (Section 8) */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Disbursement Confirmation Required</p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                Confirm that <strong>{formatCurrency(refundAmount)}</strong> has actually been returned to this customer outside the system. This action will permanently record the refund as <strong>COMPLETED</strong> and update company financial accounts.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1 border-t border-amber-200/70 select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <span className="font-bold text-slate-800 text-xs">
              I certify that {formatCurrency(refundAmount)} has been paid to {refund.customerName}.
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
