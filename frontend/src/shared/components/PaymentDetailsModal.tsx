import { useState } from 'react';
import {
  ExternalLink,
  FileText,
  Landmark,
  Building2,
  Calendar,
  FileCheck,
  Maximize2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Hash,
  MessageSquareQuote,
} from 'lucide-react';
import type { Payment } from '@/shared/types';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { formatCurrency, formatDate } from '@/shared/utils/format';

interface PaymentDetailsModalProps {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}

export default function PaymentDetailsModal({
  payment,
  open,
  onClose,
}: PaymentDetailsModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!payment) return null;

  const hasProof = Boolean(payment.proofUrl && payment.proofUrl.trim() !== '');
  const isPdf = hasProof && payment.proofUrl.toLowerCase().endsWith('.pdf');

  // Status Badge Helper
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'Verified':
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified & Settled
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'Rejected':
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Payment Details"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            {hasProof ? (
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Original Slip</span>
              </a>
            ) : (
              <span />
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Top Summary Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 shadow-sm border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md shadow-2xs">
                    #{payment.id}
                  </span>
                  {renderStatusBadge(payment.status)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  {payment.apartmentTitle || 'Skyline Residence'}
                </h3>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Amount Settled
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-400 font-serif mt-0.5">
                  {formatCurrency(Number(payment.amount))}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information Grid */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Transaction Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Payment Category
                </span>
                <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>{payment.type || 'Bank Transfer'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Payment Method
                </span>
                <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bank Transfer / Direct Escrow</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Payment Date
                </span>
                <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatDate(payment.uploadedAt)}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Residence Unit
                </span>
                <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{payment.apartmentTitle || 'Skyline Property'}</span>
                </p>
              </div>

              {payment.reservationId && (
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Reservation ID
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    <span>#{payment.reservationId}</span>
                  </p>
                </div>
              )}

              {payment.verifiedAt && (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
                    Verification Date
                  </span>
                  <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatDate(payment.verifiedAt)}</span>
                  </p>
                </div>
              )}

              {payment.verifiedBy && (
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Verified By
                  </span>
                  <p className="font-bold text-slate-900 text-xs">
                    {payment.verifiedBy}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Notes */}
            {payment.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1 mb-1">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-amber-700" />
                  <span>Customer Note / Reference</span>
                </span>
                <p className="text-slate-800 italic leading-relaxed text-xs">
                  "{payment.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Payment Slip Proof Section */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasProof
                    ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Payment Slip
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Uploaded proof of bank deposit or transfer
                  </p>
                </div>
              </div>

              {hasProof && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-emerald-600" />
                  Slip Attached
                </span>
              )}
            </div>

            {hasProof ? (
              isPdf ? (
                /* PDF Document Display */
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">PDF Payment Receipt</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The customer uploaded a PDF document as payment proof.
                    </p>
                  </div>
                  <a
                    href={payment.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xs transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View / Download PDF Document</span>
                  </a>
                </div>
              ) : (
                /* Image Slip Display with Click-to-Enlarge */
                <div className="space-y-2">
                  <div
                    onClick={() => setLightboxOpen(true)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 flex items-center justify-center min-h-[260px] sm:min-h-[320px] max-h-[460px] cursor-pointer shadow-inner transition hover:border-amber-400"
                    title="Click to view enlarged payment slip"
                  >
                    <img
                      src={payment.proofUrl}
                      alt="Bank Deposit Proof"
                      className="max-h-[420px] w-auto max-w-full object-contain transition duration-300 group-hover:scale-[1.01]"
                    />

                    {/* Hover Hint Overlay */}
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 shadow-lg flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Click to view full size</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Click image to view full resolution</span>
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in new tab</span>
                    </a>
                  </div>
                </div>
              )
            ) : (
              /* No Payment Slip Fallback */
              <div className="p-8 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Payment Slip</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No payment slip was uploaded for this transaction.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox / High-Resolution Image Preview Modal */}
      {lightboxOpen && hasProof && !isPdf && (
        <Modal
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title="Payment Slip Preview"
          size="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Raw Image</span>
              </a>

              <Button variant="outline" onClick={() => setLightboxOpen(false)}>
                Close Preview
              </Button>
            </div>
          }
        >
          <div className="flex items-center justify-center p-2 bg-slate-950 rounded-2xl overflow-hidden min-h-[360px] sm:min-h-[480px]">
            <img
              src={payment.proofUrl}
              alt="Enlarged Bank Deposit Slip"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
