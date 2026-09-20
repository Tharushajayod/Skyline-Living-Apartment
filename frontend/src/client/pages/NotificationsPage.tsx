import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCheck, Calendar, CreditCard, MessageSquare, 
  FileCheck, Info, ArrowRight, Clock 
} from 'lucide-react';
import type { NotificationType } from '@/shared/types';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Select } from '@/shared/components/ui/Form';
import { timeAgo } from '@/shared/utils/format';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  appointment: <Calendar className="w-5 h-5 text-amber-600" />,
  payment: <CreditCard className="w-5 h-5 text-emerald-600" />,
  inquiry: <MessageSquare className="w-5 h-5 text-blue-600" />,
  reservation: <FileCheck className="w-5 h-5 text-indigo-600" />,
  general: <Info className="w-5 h-5 text-slate-500" />,
};

const typeBgs: Record<NotificationType, string> = {
  appointment: 'bg-amber-50 border-amber-200/80',
  payment: 'bg-emerald-50 border-emerald-200/80',
  inquiry: 'bg-blue-50 border-blue-200/80',
  reservation: 'bg-indigo-50 border-indigo-200/80',
  general: 'bg-slate-50 border-slate-200/80',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    document.title = 'Notifications | Skyline Living';
    refresh();
  }, []);

  // Map notification type to route
  const getNotificationLink = (n: any) => {
    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();

    if (type === 'payment' || title.includes('payment') || msg.includes('payment') || msg.includes('slip') || msg.includes('installment')) {
      return user?.role === 'admin' || user?.role === 'staff' ? '/management/payments' : '/payments';
    }
    if (type === 'reservation' || title.includes('reservation') || msg.includes('reservation') || msg.includes('hold')) {
      return user?.role === 'admin' || user?.role === 'staff' ? '/management/reservations' : '/reservations';
    }
    if (type === 'appointment' || title.includes('appointment') || title.includes('viewing') || msg.includes('appointment')) {
      return user?.role === 'admin' || user?.role === 'staff' ? '/management/appointments' : '/appointments';
    }
    if (type === 'inquiry' || title.includes('inquiry') || msg.includes('inquiry')) {
      return user?.role === 'admin' || user?.role === 'staff' ? '/management/inquiries' : '/inquiries';
    }
    return user?.role === 'admin' || user?.role === 'staff' ? '/management' : '/dashboard';
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  const filtered = useMemo(() => {
    if (!filter) return sortedNotifications;
    return sortedNotifications.filter((n) => (n.type || '').toLowerCase() === filter.toLowerCase());
  }, [sortedNotifications, filter]);

  const handleMarkAll = () => {
    markAllAsRead();
    toast('All notifications marked as read', 'success');
  };

  const markSingleAsRead = (id: string) => {
    markAsRead(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Skyline Client Concierge
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {notifications.length} Total Alerts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications & System Updates
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount > 0 
              ? `You have ${unreadCount} new actionable update${unreadCount > 1 ? 's' : ''} regarding your properties.` 
              : "You're all caught up with your residence viewings and payments."}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-300 hover:bg-amber-50 hover:border-amber-300 text-slate-800 font-bold text-xs transition cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-amber-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="w-full sm:w-64">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="All Notification Types"
            options={[
              { value: '', label: 'All Categories' },
              { value: 'appointment', label: 'Viewing Appointments' },
              { value: 'reservation', label: 'Priority Holds' },
              { value: 'payment', label: 'Deposit Slip Verification' },
              { value: 'inquiry', label: 'Consultation Inquiries' },
              { value: 'general', label: 'General Updates' },
            ]}
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Showing {filtered.length} notification(s)
        </span>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-12 text-center">
          <EmptyState
            icon={<Bell className="w-12 h-12 text-slate-300" />}
            title="No notifications found"
            description="You do not have any notifications matching this filter category."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => {
            const normalizedType = ((notif.type || 'general') as string).toLowerCase() as NotificationType;
            const icon = typeIcons[normalizedType] || typeIcons.general;
            const bg = typeBgs[normalizedType] || typeBgs.general;
            const link = getNotificationLink(notif);

            return (
              <div
                key={notif.id}
                onClick={() => markSingleAsRead(notif.id)}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.read
                    ? 'border-amber-300 bg-amber-50/20 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ring-2 ring-amber-200" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex items-center justify-end shrink-0 pl-15 sm:pl-0">
                  <Link
                    to={link}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    <span>Review Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}