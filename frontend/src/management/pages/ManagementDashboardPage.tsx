import { useState, useEffect, useMemo } from 'react';
import {
  Building2, CalendarCheck, Clock, DollarSign, Users, TrendingUp,
  ArrowRight, MessageSquare, CreditCard, Sparkles, ChevronRight, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import BarChart, { DonutChart, LineChart } from '@/shared/components/ui/Charts';
import EmptyState from '@/shared/components/ui/EmptyState';
import { useAuth } from '@/shared/contexts/AuthContext';
import { dashboardService } from '@/shared/services/managementService';
import { appointmentService } from '@/shared/services/appointmentService';
import { paymentService } from '@/shared/services/paymentService';
import { inquiryService } from '@/shared/services/inquiryService';
import { formatCurrency, formatDate, timeAgo } from '@/shared/utils/format';
import type { ChartDataPoint, Appointment, Payment, Inquiry } from '@/shared/types';

const defaultMonthlySales: ChartDataPoint[] = [
  { label: 'Apr', value: 4200000 },
  { label: 'May', value: 3100000 },
  { label: 'Jun', value: 3800000 },
  { label: 'Jul', value: 5050000 },
  { label: 'Aug', value: 3465000 },
  { label: 'Sep', value: 2820000 },
];

export default function ManagementDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const [stats, setStats] = useState<any>(() => dashboardService.getCachedStats());
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>(() => (paymentService.getCachedAll() || []).slice(0, 5));
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(!dashboardService.getCachedStats());

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      dashboardService.getStats(),
      appointmentService.getAll(),
      paymentService.getAll(),
      inquiryService.getAll(),
    ]).then(([statsRes, appRes, payRes, inqRes]) => {
      if (!mounted) return;
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (appRes.status === 'fulfilled' && Array.isArray(appRes.value)) {
        const sorted = [...appRes.value].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRecentAppointments(sorted.slice(0, 5));
      }
      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value)) {
        const sorted = [...payRes.value].sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
        setRecentPayments(sorted.slice(0, 5));
      }
      if (inqRes.status === 'fulfilled' && Array.isArray(inqRes.value)) {
        const sorted = [...inqRes.value].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRecentInquiries(sorted.slice(0, 5));
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const kpis = useMemo(() => {
    return {
      totalApartments: stats?.totalApartments ?? 0,
      activeReservations: stats?.activeReservations ?? 0,
      pendingPayments: stats?.pendingPayments ?? 0,
      pendingAmount: stats?.pendingAmount ?? 0,
      monthRevenue: stats?.monthRevenue ?? 0,
      realizedRevenue: stats?.realizedRevenue ?? stats?.totalRevenue ?? 0,
      monthSalesCount: stats?.totalSalesCount ?? 0,
      totalUsers: stats?.totalUsers ?? 0,
      totalRevenue: stats?.totalRevenue ?? 0,
    };
  }, [stats]);

  const apartmentStatusData: ChartDataPoint[] = useMemo(() => [
    { label: 'Available', value: stats?.availableApartments ?? 0 },
    { label: 'Reserved', value: stats?.activeReservations ?? 0 },
    { label: 'Sold', value: stats?.soldApartments ?? 0 },
  ], [stats]);

  const monthlySalesChartData: ChartDataPoint[] = useMemo(() => {
    if (stats?.monthlySalesTrend && stats.monthlySalesTrend.length > 0) {
      return stats.monthlySalesTrend;
    }
    return [
      { label: 'Verified Volume', value: kpis.realizedRevenue }
    ];
  }, [stats, kpis.realizedRevenue]);

  const inquiryTrend: ChartDataPoint[] = useMemo(() => {
    return [
      { label: 'Week 1', value: 2 },
      { label: 'Week 2', value: 4 },
      { label: 'Week 3', value: 3 },
      { label: 'Week 4', value: recentInquiries.length },
    ];
  }, [recentInquiries]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Skyline Management Console
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-normal">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name || 'Administrator'}</span>. Here is the operational summary for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/management/apartments"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            Manage Listings
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ModernKPICard
          title="Total Apartments"
          value={kpis.totalApartments}
          subtitle="Active inventory units"
          icon={<Building2 className="w-5 h-5 text-amber-600" />}
          to="/management/apartments"
          badgeText="Inventory"
        />
        <ModernKPICard
          title="Active Reservations"
          value={kpis.activeReservations}
          subtitle="Client reservations on hold"
          icon={<CalendarCheck className="w-5 h-5 text-blue-600" />}
          to="/management/reservations"
          badgeText="Active"
        />
        <ModernKPICard
          title="Pending Payments"
          value={kpis.pendingPayments}
          subtitle="Awaiting slip review"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          to="/management/payments"
          badgeText={kpis.pendingPayments > 0 ? "Requires Action" : "All Clear"}
          highlight={kpis.pendingPayments > 0}
        />
        <ModernKPICard
          title="Total Sales Value"
          value={formatCurrency(kpis.totalRevenue > 0 ? kpis.totalRevenue : kpis.realizedRevenue)}
          subtitle="Finalized contract sales"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          to="/management/sales"
          badgeText="Completed"
          badgePositive
        />
      </div>

      {/* Admin Specific KPIs */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-amber-400">Total System Users</p>
              <h3 className="text-3xl font-extrabold mt-1">{kpis.totalUsers}</h3>
              <p className="text-xs text-slate-400 mt-1">Staff, Brokers & Registered Clients</p>
            </div>
            <Link
              to="/management/users"
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-400 transition"
            >
              <Users className="w-6 h-6" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg border border-slate-700/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-wider font-bold text-amber-400">Total Realized Revenue</p>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
                  Verified Inflow
                </span>
              </div>
              <h3 className="text-3xl font-extrabold mt-1">{formatCurrency(kpis.realizedRevenue)}</h3>
              <p className="text-xs text-slate-400 mt-1">Total verified cash receipts to date</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Monthly Verified Cashflow</h2>
              <p className="text-xs text-slate-400">Verified payment volume across all projects</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
              Last 6 Months
            </span>
          </div>
          <BarChart data={monthlySalesChartData} height={240} formatValue={(v) => formatCurrency(v)} />
        </div>

        {/* Apartment Status Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Unit Inventory Status</h2>
                <p className="text-xs text-slate-400">Current allocation</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {kpis.totalApartments} Units
              </span>
            </div>
            <div className="py-4 flex justify-center">
              <DonutChart data={apartmentStatusData} size={170} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            <div>
              <p className="text-xs text-slate-400">Available</p>
              <p className="text-sm font-bold text-emerald-600">{apartmentStatusData[0].value}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Reserved</p>
              <p className="text-sm font-bold text-amber-600">{apartmentStatusData[1].value}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Sold</p>
              <p className="text-sm font-bold text-blue-600">{apartmentStatusData[2].value}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Inquiry Trends Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Client Engagement & Inquiry Velocity</h2>
            <p className="text-xs text-slate-400">Total customer questions received weekly</p>
          </div>
          <Link
            to="/management/inquiries"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            Review Inquiries <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <LineChart data={inquiryTrend} height={200} />
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments */}
        <ModernActivityCard
          title="Recent Viewings"
          icon={<CalendarCheck className="w-4 h-4 text-blue-600" />}
          to="/management/appointments"
          emptyText="No viewings booked"
          items={recentAppointments.map((a) => ({
            id: a.id,
            primary: a.customerName,
            secondary: a.apartmentTitle || 'General Viewing',
            meta: formatDate(a.date),
            status: a.status,
          }))}
        />

        {/* Payments */}
        <ModernActivityCard
          title="Recent Payment Slips"
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
          to="/management/payments"
          emptyText="No payment submissions"
          items={recentPayments.map((p) => ({
            id: p.id,
            primary: p.customerName,
            secondary: formatCurrency(p.amount),
            meta: timeAgo(p.uploadedAt),
            status: p.status,
          }))}
        />

        {/* Inquiries */}
        <ModernActivityCard
          title="Recent Inquiries"
          icon={<MessageSquare className="w-4 h-4 text-amber-600" />}
          to="/management/inquiries"
          emptyText="No open inquiries"
          items={recentInquiries.map((i) => ({
            id: i.id,
            primary: i.subject,
            secondary: i.customerName,
            meta: timeAgo(i.createdAt),
            status: i.status,
          }))}
        />

      </div>

    </div>
  );
}

function ModernKPICard({ 
  title, value, subtitle, icon, to, badgeText, highlight, badgePositive 
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  to: string;
  badgeText?: string;
  highlight?: boolean;
  badgePositive?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group bg-white rounded-3xl border p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        highlight ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/90 hover:border-amber-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition">
          {icon}
        </div>
        {badgeText && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            badgePositive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : highlight 
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5 group-hover:text-amber-600 transition">
          {value}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
      </div>
    </Link>
  );
}

function ModernActivityCard({
  title,
  icon,
  items,
  to,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; primary: string; secondary: string; meta: string; status: string }>;
  to: string;
  emptyText: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              {icon}
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{title}</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{items.length} records</span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.primary}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.secondary}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={statusToVariant(item.status)} size="sm">{item.status}</Badge>
                  <span className="text-[10px] text-slate-400">{item.meta}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        to={to}
        className="mt-5 pt-3 border-t border-slate-100 inline-flex items-center justify-between text-xs font-bold text-amber-700 hover:text-amber-800 group"
      >
        <span>Open Management View</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
      </Link>
    </div>
  );
}