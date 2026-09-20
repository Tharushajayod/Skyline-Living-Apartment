import { useMemo, useState, useEffect } from 'react';
import {
  Search, Check, X, CalendarClock, CheckCircle2, XCircle, CalendarX, Clock,
  Calendar, Building2, User, Mail, ChevronRight, Filter
} from 'lucide-react';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { appointmentService } from '@/shared/services/appointmentService';
import { formatDate } from '@/shared/utils/format';
import type { Appointment, AppointmentStatus } from '@/shared/types';

const tabStatuses: (AppointmentStatus | 'All')[] = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled'];

export default function ManageAppointmentsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'All'>('All');
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
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
    fetchAppointments();
  }, []);

  async function updateStatus(id: string, status: AppointmentStatus, msg: string) {
    try {
      const updated = await appointmentService.updateStatus(id, status);
      setList(prev => prev.map(a => a.id === id ? updated : a));
      toast(msg, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update appointment', 'error');
    }
  }

  async function confirmReschedule() {
    if (!rescheduleTarget || !rescheduleDate) {
      toast('Please select a new date', 'error');
      return;
    }
    try {
      const updated = await appointmentService.updateStatus(rescheduleTarget.id, 'Rescheduled', {
        date: rescheduleDate,
        timeSlot: rescheduleTime || rescheduleTarget.timeSlot,
      });
      setList(prev => prev.map(a => a.id === rescheduleTarget.id ? updated : a));
      toast('Appointment rescheduled successfully', 'success');
      setRescheduleTarget(null);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (err: any) {
      toast(err.message || 'Failed to reschedule appointment', 'error');
    }
  }

  const counts = useMemo(() => ({
    All: list.length,
    Pending: list.filter(a => a.status === 'Pending').length,
    Approved: list.filter(a => a.status === 'Approved').length,
    Completed: list.filter(a => a.status === 'Completed').length,
    Cancelled: list.filter(a => a.status === 'Cancelled' || a.status === 'No-show').length,
  }), [list]);

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
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
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
            Review, approve, and reschedule customer architectural viewing sessions.
          </p>
        </div>

        {counts.Pending > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {counts.Pending} viewing request(s) awaiting approval
          </div>
        )}
      </div>

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

      {/* Main Table Card (No Horizontal Scroll - Fits 100% Page Width) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden w-full">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            Loading viewing appointments...
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
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-left text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="w-[24%] px-4 py-3.5">Client</th>
                  <th className="w-[22%] px-3 py-3.5">Residence Unit</th>
                  <th className="w-[14%] px-3 py-3.5">Schedule Date</th>
                  <th className="w-[13%] px-3 py-3.5">Time Slot</th>
                  <th className="w-[11%] px-3 py-3.5 text-center">Status</th>
                  <th className="w-[16%] px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Customer (24%) */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                          {apt.customerName?.slice(0, 2).toUpperCase() || 'CU'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{apt.customerName}</p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{apt.customerEmail}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Apartment (22%) */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate" title={apt.apartmentTitle}>{apt.apartmentTitle}</span>
                      </div>
                    </td>

                    {/* Date (14%) */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formatDate(apt.date)}</span>
                      </div>
                    </td>

                    {/* Time Slot (13%) */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 text-slate-700 font-medium text-xs whitespace-nowrap">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{apt.timeSlot}</span>
                      </div>
                    </td>

                    {/* Status (11%) */}
                    <td className="px-3 py-3.5 text-center">
                      <Badge variant={statusToVariant(apt.status)} size="sm" dot>
                        {apt.status}
                      </Badge>
                    </td>

                    {/* Actions (16%) */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Pending -> Compact Approve & Reject */}
                        {apt.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(apt.id, 'Approved', 'Appointment approved successfully')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                              title="Approve viewing"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(apt.id, 'Rejected', 'Appointment marked as rejected')}
                              className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 transition"
                              title="Reject viewing"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Approved -> Complete */}
                        {apt.status === 'Approved' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(apt.id, 'Completed', 'Appointment marked as completed')}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Done</span>
                          </button>
                        )}

                        {/* Reschedule Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleTarget(apt);
                            setRescheduleDate(apt.date);
                            setRescheduleTime(apt.timeSlot);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-900 transition"
                          title="Reschedule slot"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Viewing Appointment"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button 
              icon={<Clock className="w-4 h-4" />} 
              onClick={confirmReschedule}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
            >
              Confirm Reschedule
            </Button>
          </div>
        }
      >
        {rescheduleTarget && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Appointment Details</p>
              <p className="text-sm font-bold text-slate-900">{rescheduleTarget.customerName} ({rescheduleTarget.customerEmail})</p>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                {rescheduleTarget.apartmentTitle}
              </p>
              <p className="text-xs font-medium text-amber-800 mt-2">
                Current Slot: {formatDate(rescheduleTarget.date)} at {rescheduleTarget.timeSlot}
              </p>
            </div>

            <Input
              label="New Appointment Date"
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />

            <Input
              label="New Time Slot"
              placeholder="e.g. 10:00 AM - 11:00 AM"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
            />
          </div>
        )}
      </Modal>

    </div>
  );
}