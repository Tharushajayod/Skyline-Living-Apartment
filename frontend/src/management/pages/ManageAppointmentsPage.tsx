import { useMemo, useState, useEffect } from 'react';
import {
  Search, Check, X, CalendarClock, CheckCircle2,
  Calendar, Building2, User, Mail, Clock, Eye, MessageSquareQuote
} from 'lucide-react';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { appointmentService } from '@/shared/services/appointmentService';
import { formatDate } from '@/shared/utils/format';
import type { Appointment, AppointmentStatus } from '@/shared/types';
import AppointmentRescheduleModal from '@/management/components/AppointmentRescheduleModal';
import AppointmentDetailsModal from '@/management/components/AppointmentDetailsModal';

const tabStatuses: (AppointmentStatus | 'All')[] = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled'];

export default function ManageAppointmentsPage() {
  const { toast } = useToast();
  const cached = appointmentService.getCachedAll();
  const [list, setList] = useState<Appointment[]>(() => (Array.isArray(cached) ? cached : []));
  const [loading, setLoading] = useState(!cached || cached.length === 0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'All'>('All');
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await appointmentService.getAll();
      setList(data);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(!cached || cached.length === 0);
  }, []);

  async function updateStatus(id: string, status: AppointmentStatus, msg: string) {
    try {
      const updated = await appointmentService.updateStatus(id, status);
      setList(prev => prev.map(a => a.id === id ? updated : a));
      setSelectedAppointment(prev => prev && prev.id === id ? updated : prev);
      toast(msg, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update appointment', 'error');
    }
  }

  async function handleAcceptReschedule(id: string) {
    try {
      await appointmentService.acceptReschedule(id);
      toast('Customer reschedule proposal accepted! Viewing is now confirmed for the new time.', 'success');
      fetchAppointments();
    } catch (err: any) {
      toast(err.message || 'Failed to accept reschedule proposal', 'error');
    }
  }

  async function handleDeclineReschedule(id: string) {
    try {
      await appointmentService.rejectReschedule(id);
      toast('Customer reschedule proposal declined.', 'info');
      fetchAppointments();
    } catch (err: any) {
      toast(err.message || 'Failed to decline reschedule proposal', 'error');
    }
  }

  const counts = useMemo(() => ({
    All: list.length,
    Pending: list.filter(a => a.status === 'Pending').length,
    Approved: list.filter(a => a.status === 'Approved').length,
    Completed: list.filter(a => a.status === 'Completed').length,
    Cancelled: list.filter(a => a.status === 'Cancelled' || a.status === 'No-show').length,
  }), [list]);

  const pendingCustomerReschedules = useMemo(() => {
    return list.filter(a => a.rescheduleStatus === 'Pending Admin' || (a.rescheduleStatus as any) === 'PENDING_ADMIN');
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter(a => {
      const matchesTab = activeTab === 'All' || a.status === activeTab ||
        (activeTab === 'Cancelled' && (a.status === 'Cancelled' || a.status === 'No-show'));
      const matchesSearch = !search ||
        a.customerName.toLowerCase().includes(search.toLowerCase()) ||
        a.apartmentTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.customerEmail.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [list, activeTab, search]);

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Skyline Operations
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {list.length} Total Bookings
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Appointments
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review, approve, complete, and reschedule customer architectural viewing sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {counts.Pending > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {counts.Pending} viewing request(s) awaiting approval
            </div>
          )}

          {pendingCustomerReschedules.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs font-bold shadow-xs">
              <CalendarClock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              {pendingCustomerReschedules.length} customer reschedule request(s)
            </div>
          )}
        </div>
      </div>

      {/* Pending Customer Reschedule Requests Panel (if any) */}
      {pendingCustomerReschedules.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50 rounded-3xl border border-blue-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-950">
              <CalendarClock className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider">
                Action Required: Customer Reschedule Proposals ({pendingCustomerReschedules.length})
              </h2>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">Please accept or propose an alternative</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingCustomerReschedules.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-blue-100 p-4 shadow-2xs space-y-2.5 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-900">{item.customerName}</span>
                    <span className="font-mono text-[10px] text-slate-400">#{item.id}</span>
                  </div>

                  <p className="font-semibold text-slate-800 mt-1.5">
                    {item.apartmentTitle}
                  </p>

                  <div className="mt-1.5 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                    <p className="text-slate-600">
                      Original: <span className="line-through">{formatDate(item.date)} ({item.timeSlot})</span>
                    </p>
                    <p className="text-blue-950 font-bold">
                      Requested: {formatDate(item.proposedDate || '')} at {item.proposedTimeSlot}
                    </p>
                    <p className="text-slate-700 italic">
                      Reason: "{item.rescheduleReason || 'Customer requested'}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleAcceptReschedule(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRescheduleTarget(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Propose Another Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeclineReschedule(item.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
                  >
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4 w-full">
        {/* Custom Modern Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto w-full lg:w-auto border border-slate-200/70">
          {tabStatuses.map((status) => {
            const count = counts[status as keyof typeof counts] || 0;
            const isActive = activeTab === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="w-full lg:w-80">
          <Input
            placeholder="Search customer, email or unit..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden w-full">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Loading viewing appointments...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              variant="inbox"
              title="No appointments found"
              description="No booking records match your selected status and filter parameters."
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Residence Unit</th>
                  <th className="px-5 py-3.5">Viewing Schedule</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((apt) => {
                  const hasCustomerProposal = apt.rescheduleStatus === 'Pending Admin' || (apt.rescheduleStatus as any) === 'PENDING_ADMIN';
                  const hasAdminProposal = apt.rescheduleStatus === 'Pending Customer' || (apt.rescheduleStatus as any) === 'PENDING_CUSTOMER';

                  return (
                    <tr
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`hover:bg-amber-50/40 hover:shadow-2xs transition-all duration-150 cursor-pointer group ${
                        hasCustomerProposal ? 'bg-blue-50/30' : ''
                      }`}
                      title="Click row to view full appointment details & customer note"
                    >
                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-extrabold text-xs shrink-0 shadow-2xs group-hover:border-amber-300 transition-colors">
                            {apt.customerName?.slice(0, 2).toUpperCase() || 'CU'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-900 text-sm truncate group-hover:text-amber-800 transition-colors">
                              {apt.customerName}
                            </p>
                            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{apt.customerEmail}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Apartment */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm min-w-0">
                          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[240px]" title={apt.apartmentTitle}>{apt.apartmentTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400">Appt #{apt.id}</p>
                          {apt.notes && apt.notes.trim() && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80"
                              title={`Customer note: "${apt.notes}"`}
                            >
                              <MessageSquareQuote className="w-3 h-3 text-amber-600 shrink-0" />
                              Note
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Viewing Schedule (Combined Date & Slot) */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(apt.date)}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            {apt.timeSlot}
                          </span>
                        </div>
                        {hasCustomerProposal && (
                          <div className="mt-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] text-blue-800 font-bold inline-block">
                            Proposed: {formatDate(apt.proposedDate || '')} at {apt.proposedTimeSlot}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        {hasCustomerProposal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                            Reschedule Req
                          </span>
                        ) : hasAdminProposal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Awaiting Client
                          </span>
                        ) : (
                          <Badge variant={statusToVariant(apt.status)} size="sm" dot>
                            {apt.status}
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending -> Approve & Reject */}
                          {apt.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatus(apt.id, 'Approved', 'Appointment approved successfully')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Approve viewing"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(apt.id, 'Rejected', 'Appointment marked as rejected')}
                                className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 transition cursor-pointer"
                                title="Reject viewing"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Incoming Customer Proposal Actions */}
                          {hasCustomerProposal && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptReschedule(apt.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Accept customer proposed reschedule"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeclineReschedule(apt.id)}
                                className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 transition cursor-pointer"
                                title="Decline customer proposed reschedule"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Approved / Rescheduled -> Complete (Unlocks Reservation) */}
                          {(apt.status === 'Approved' || apt.status === 'Rescheduled') && !hasCustomerProposal && (
                            <button
                              type="button"
                              onClick={() => updateStatus(apt.id, 'Completed', 'Viewing completed! Reservation is now unlocked for customer.')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                              title="Mark appointment as completed to unlock reservation"
                            >
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span>Mark Completed</span>
                            </button>
                          )}

                          {/* Reschedule / Propose Another Button */}
                          {apt.status !== 'Completed' && apt.status !== 'Cancelled' && apt.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => setRescheduleTarget(apt)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-900 transition cursor-pointer"
                              title="Propose reschedule slot"
                            >
                              <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                          )}

                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedAppointment(apt)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                            title="View full appointment details & customer note"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onUpdateStatus={updateStatus}
        onRescheduleClick={(appt) => setRescheduleTarget(appt)}
        onAcceptReschedule={handleAcceptReschedule}
        onDeclineReschedule={handleDeclineReschedule}
      />

      {/* Reschedule Modal */}
      <AppointmentRescheduleModal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        appointment={rescheduleTarget}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}