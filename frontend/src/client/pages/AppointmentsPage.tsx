import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Calendar, Clock, X, Eye } from 'lucide-react';
import type { Appointment } from '@/shared/types';
import { appointmentService } from '@/shared/services/appointmentService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Tabs from '@/shared/components/ui/Tabs';
import EmptyState from '@/shared/components/ui/EmptyState';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import { formatDate } from '@/shared/utils/format';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    appointmentService.getByCustomer(user.email)
      .then((data) => {
        setAppts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      const updated = await appointmentService.updateStatus(cancelTarget.id, 'Cancelled');
      setAppts(prev => prev.map(a => a.id === cancelTarget.id ? updated : a));
      toast('Appointment cancelled successfully', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to cancel appointment', 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const canCancel = (status: string) => status === 'Pending' || status === 'Approved' || status === 'Rescheduled';

  const columns = (statusFilter: string[]) => {
    const filtered = appts.filter(a => statusFilter.includes(a.status));
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
          ))}
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <EmptyState 
          variant="inbox" 
          title="No appointments" 
          description="You don't have any appointments in this category yet." 
          action={
            <Link to="/apartments">
              <Button size="sm" icon={<CalendarPlus className="w-4 h-4" />} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0">
                Book a Viewing
              </Button>
            </Link>
          } 
        />
      );
    }
    return (
      <div className="space-y-3">
        {filtered.map(apt => (
          <div 
            key={apt.id} 
            className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-amber-400 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0 text-amber-700">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <Link 
                  to={`/apartments/${apt.apartmentId}`} 
                  className="font-bold text-slate-900 text-base hover:text-amber-600 transition-colors"
                >
                  {apt.apartmentTitle}
                </Link>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-600" />{formatDate(apt.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600" />{apt.timeSlot}</span>
                </div>
                {apt.notes && <p className="text-xs text-slate-400 mt-1.5 italic">"{apt.notes}"</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={statusToVariant(apt.status)} dot>{apt.status}</Badge>
              {canCancel(apt.status) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCancelTarget(apt)} 
                  icon={<X className="w-3.5 h-3.5" />} 
                  className="text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              <Eye className="w-3.5 h-3.5" /> Property Schedule
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Viewing Appointments</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track your scheduled luxury residence visits</p>
          </div>
          <Link to="/apartments">
            <Button icon={<CalendarPlus className="w-4 h-4" />} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/10">
              Book New Viewing
            </Button>
          </Link>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.05)] p-6">
          <Tabs tabs={[
            { label: 'Upcoming', content: columns(['Pending', 'Approved', 'Rescheduled']), badge: appts.filter(a => ['Pending', 'Approved', 'Rescheduled'].includes(a.status)).length },
            { label: 'Past Visits', content: columns(['Completed', 'No-show']), badge: appts.filter(a => ['Completed', 'No-show'].includes(a.status)).length },
            { label: 'Cancelled', content: columns(['Cancelled', 'Rejected']), badge: appts.filter(a => ['Cancelled', 'Rejected'].includes(a.status)).length },
          ]} />
        </div>

        <ConfirmDialog
          open={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancel}
          title="Cancel Appointment?"
          message={`Are you sure you want to cancel your scheduled viewing of ${cancelTarget?.apartmentTitle}?`}
          confirmLabel="Yes, Cancel"
        />
      </div>
    </div>
  );
}