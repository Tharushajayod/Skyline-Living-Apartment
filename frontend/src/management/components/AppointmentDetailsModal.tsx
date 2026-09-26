import {
  Calendar,
  Clock,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  MessageSquareQuote,
  CalendarClock,
  CheckCircle2,
  Check,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '@/shared/components/ui/Modal';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import { formatDate } from '@/shared/utils/format';
import type { Appointment, AppointmentStatus } from '@/shared/types';

interface AppointmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdateStatus?: (id: string, status: AppointmentStatus, msg: string) => void;
  onRescheduleClick?: (appointment: Appointment) => void;
  onAcceptReschedule?: (id: string) => void;
  onDeclineReschedule?: (id: string) => void;
}

export default function AppointmentDetailsModal({
  open,
  onClose,
  appointment,
  onUpdateStatus,
  onRescheduleClick,
  onAcceptReschedule,
  onDeclineReschedule,
}: AppointmentDetailsModalProps) {
  if (!open || !appointment) return null;

  const hasCustomerProposal =
    appointment.rescheduleStatus === 'Pending Admin' ||
    (appointment.rescheduleStatus as any) === 'PENDING_ADMIN';
  const hasAdminProposal =
    appointment.rescheduleStatus === 'Pending Customer' ||
    (appointment.rescheduleStatus as any) === 'PENDING_CUSTOMER';

  const customerInitials =
    appointment.customerName
      ?.trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CU';

  const hasNote = Boolean(appointment.notes && appointment.notes.trim().length > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Appointment Details"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            Booking ID: #{appointment.id}
          </span>
          <div className="flex items-center gap-2">
            {appointment.status === 'Pending' && onUpdateStatus && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onUpdateStatus(appointment.id, 'Approved', 'Appointment approved successfully');
                    onClose();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateStatus(appointment.id, 'Rejected', 'Appointment marked as rejected');
                    onClose();
                  }}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
                  icon={<X className="w-3.5 h-3.5" />}
                >
                  Reject
                </Button>
              </>
            )}

            {(appointment.status === 'Approved' || appointment.status === 'Rescheduled') &&
              !hasCustomerProposal &&
              onUpdateStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onUpdateStatus(
                      appointment.id,
                      'Completed',
                      'Viewing completed! Reservation is now unlocked for customer.'
                    );
                    onClose();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Mark Completed
                </Button>
              )}

            {appointment.status !== 'Completed' &&
              appointment.status !== 'Cancelled' &&
              appointment.status !== 'Rejected' &&
              onRescheduleClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRescheduleClick(appointment);
                    onClose();
                  }}
                  className="border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 font-bold"
                  icon={<CalendarClock className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Propose Reschedule
                </Button>
              )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 -mt-1">
        {/* Luxury Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-navy-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">


                {hasCustomerProposal ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Reschedule Review Needed
                  </span>
                ) : hasAdminProposal ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Awaiting Customer
                  </span>
                ) : (
                  <Badge variant={statusToVariant(appointment.status)} size="sm" dot>
                    {appointment.status}
                  </Badge>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white pt-0.5 truncate">
                {appointment.apartmentTitle}
              </h3>

              <p className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Viewing on{' '}
                  <strong className="text-white font-bold">
                    {formatDate(appointment.date)}
                  </strong>{' '}
                  at{' '}
                  <strong className="text-amber-400 font-bold">
                    {appointment.timeSlot}
                  </strong>
                </span>
              </p>
            </div>

            <div className="shrink-0 sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Apartment Ref
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {appointment.apartmentId || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Information Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Customer Information */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <UserIcon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Client Information
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm shrink-0">
                {customerInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900 text-sm truncate">
                  {appointment.customerName}
                </p>
                <p className="text-xs text-slate-400 font-medium">Prospective Resident</p>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address
                </span>
                <a
                  href={`mailto:${appointment.customerEmail}`}
                  className="font-semibold text-slate-800 hover:text-amber-600 truncate transition"
                  title={appointment.customerEmail}
                >
                  {appointment.customerEmail}
                </a>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone Number
                </span>
                <span className="font-semibold text-slate-800">
                  {appointment.customerPhone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Schedule & Residence Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Viewing Logistics
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Scheduled Date</span>
                <span className="font-bold text-slate-900">
                  {formatDate(appointment.date)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Assigned Time Slot</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                  <Clock className="w-3 h-3 text-amber-600" />
                  {appointment.timeSlot}
                </span>
              </div>



              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Request Submitted</span>
                <span className="font-medium text-slate-600">
                  {formatDate(appointment.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reschedule Proposal Alert Section (if pending customer or admin proposal) */}
        {(hasCustomerProposal || hasAdminProposal) && (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-700" />
                <h5 className="font-bold text-xs text-blue-950 uppercase tracking-wider">
                  {hasCustomerProposal
                    ? 'Customer Reschedule Proposal'
                    : 'Awaiting Customer Response to Reschedule'}
                </h5>
              </div>
              {appointment.rescheduleRequestedBy && (
                <span className="text-[10px] text-blue-700 font-semibold">
                  Requested by: {appointment.rescheduleRequestedBy}
                </span>
              )}
            </div>

            <div className="text-xs text-blue-900 flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>
                Proposed Date:{' '}
                <strong>{formatDate(appointment.proposedDate || '')}</strong>
              </span>
              <span>
                Proposed Time: <strong>{appointment.proposedTimeSlot}</strong>
              </span>
            </div>

            {appointment.rescheduleReason && (
              <p className="text-xs text-blue-800 italic bg-white/60 p-2.5 rounded-xl border border-blue-200/50">
                "{appointment.rescheduleReason}"
              </p>
            )}

            {hasCustomerProposal && (
              <div className="pt-2 flex items-center gap-2">
                {onAcceptReschedule && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onAcceptReschedule(appointment.id);
                      onClose();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Accept New Schedule
                  </Button>
                )}
                {onDeclineReschedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDeclineReschedule(appointment.id);
                      onClose();
                    }}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
                    icon={<X className="w-3.5 h-3.5" />}
                  >
                    Decline Proposal
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* CUSTOMER NOTE SECTION (HIGHLIGHTED AS PRIMARY REQUIREMENT) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasNote
                  ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
              >
                <MessageSquareQuote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Customer Notes
                </h4>
                <p className="text-[11px] text-slate-400">
                  Special requests submitted during viewing reservation
                </p>
              </div>
            </div>


          </div>

          {hasNote ? (
            <div className="relative rounded-2xl bg-amber-50/50 border border-amber-200/80 p-4 sm:p-4.5 text-slate-800 transition-all">
              <div className="flex items-start gap-2.5">
                <div className="text-amber-500 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {appointment.notes}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400 italic font-medium">
                No note was provided by the customer.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
