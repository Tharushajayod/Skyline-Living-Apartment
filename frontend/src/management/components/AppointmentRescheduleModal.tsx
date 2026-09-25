import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  User,
  History,
  AlertCircle,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { Input, Select } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { appointmentService } from '@/shared/services/appointmentService';
import {
  formatDate,
  getTodayDateString,
  isPastDate,
  getAvailableTimeSlots,
  ALL_VIEWING_TIME_SLOTS,
} from '@/shared/utils/format';
import type { Appointment, AppointmentRescheduleHistory } from '@/shared/types';

interface AppointmentRescheduleModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

const ALL_TIME_SLOTS = ALL_VIEWING_TIME_SLOTS;

export default function AppointmentRescheduleModal({
  open,
  onClose,
  appointment,
  onSuccess,
}: AppointmentRescheduleModalProps) {
  const { toast } = useToast();
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<AppointmentRescheduleHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayDateString();

  useEffect(() => {
    if (open && appointment) {
      // If previous appointment date was in the past, default to today
      const defaultDate = appointment.date && !isPastDate(appointment.date)
        ? appointment.date
        : todayStr;

      setRescheduleDate(defaultDate);
      setRescheduleTime(appointment.timeSlot || '10:00 AM - 11:00 AM');
      setReason('');

      // Fetch history
      setLoadingHistory(true);
      appointmentService
        .getHistory(appointment.id)
        .then((data) => setHistory(data))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [open, appointment, todayStr]);

  // Filter available time slots when selecting today
  const availableSlots = useMemo(() => {
    return getAvailableTimeSlots(rescheduleDate, ALL_TIME_SLOTS);
  }, [rescheduleDate]);

  // Update selected time if current selection is not available
  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(rescheduleTime)) {
      setRescheduleTime(availableSlots[0]);
    }
  }, [availableSlots, rescheduleTime]);

  if (!open || !appointment) return null;

  const dateIsPast = isPastDate(rescheduleDate);
  const isReasonEmpty = !reason.trim();
  const noSlotsAvailable = availableSlots.length === 0;
  const isValid = !dateIsPast && !isReasonEmpty && !noSlotsAvailable;

  const handleConfirm = async () => {
    if (dateIsPast) {
      toast('Appointment date cannot be in the past.', 'error');
      return;
    }

    if (noSlotsAvailable) {
      toast('No time slots available for the selected date. Please choose another date.', 'error');
      return;
    }

    if (isReasonEmpty) {
      toast('Please enter a reason for the reschedule request.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.proposeReschedule(appointment.id, {
        date: rescheduleDate,
        timeSlot: rescheduleTime,
        reason: reason.trim(),
      });
      toast('Reschedule proposal submitted successfully. Awaiting review.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Unable to submit reschedule proposal. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Propose Viewing Reschedule"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            icon={<Clock className="w-4 h-4" />}
            onClick={handleConfirm}
            disabled={!isValid || submitting}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
          >
            {submitting ? 'Submitting Request...' : 'Send Reschedule Request'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Current Appointment Overview */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Session ID</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {appointment.id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Client</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              {appointment.customerName} ({appointment.customerEmail})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Residence Unit</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              {appointment.apartmentTitle}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Current Booked Slot</span>
            <span className="font-bold text-amber-900">
              {formatDate(appointment.date)} at {appointment.timeSlot}
            </span>
          </div>
        </div>

        {/* Reschedule Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Appointment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              min={todayStr}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
            />
            {dateIsPast && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Past dates are not allowed. Please choose today or a future date.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Time Slot <span className="text-rose-500">*</span>
            </label>
            {noSlotsAvailable ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                No remaining available slots for today. Please select a future date.
              </div>
            ) : (
              <Select
                options={availableSlots.map((slot) => ({ value: slot, label: slot }))}
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Reschedule <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client requested a later afternoon time due to travel..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
            />
            {isReasonEmpty && (
              <p className="text-[11px] text-rose-600 font-semibold">
                A reason is required to maintain the audit trail for this viewing.
              </p>
            )}
          </div>
        </div>

        {/* Reschedule History (Audit Log) */}
        {history.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700">
              <History className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Previous Reschedule History ({history.length})
              </h4>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>
                      From: {formatDate(h.oldDate)} ({h.oldTimeSlot})
                    </span>
                    <span className="font-bold text-amber-900">
                      To: {formatDate(h.newDate)} ({h.newTimeSlot})
                    </span>
                  </div>
                  <p className="text-slate-800 italic">"{h.reason}"</p>
                  <p className="text-[10px] text-slate-400">
                    By {h.changedBy} ({h.changedByRole}) on {formatDate(h.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
