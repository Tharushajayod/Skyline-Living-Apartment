import { useState, useRef, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CalendarCheck, BookmarkCheck,
  CreditCard, MessageSquare, Star, TrendingUp, Users, BarChart3,
  ChevronLeft, ChevronRight, LogOut, Globe, Bell, KeyRound,
  Clock, RefreshCw, Menu, X
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Form';
import { appointmentService } from '@/shared/services/appointmentService';
import { reservationService } from '@/shared/services/reservationService';
import { paymentService } from '@/shared/services/paymentService';
import { inquiryService } from '@/shared/services/inquiryService';
import { reviewService } from '@/shared/services/reviewService';
import { timeAgo, formatCurrency } from '@/shared/utils/format';

interface AdminActivityAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  rawDate: number;
  link: string;
  unread: boolean;
  type: 'appointment' | 'reservation' | 'payment' | 'inquiry' | 'review';
}

export default function ManagementLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Customer Activity Alerts State & Pagination (5 by 5)
  const [activityAlerts, setActivityAlerts] = useState<AdminActivityAlert[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const pageSize = 5;

  // Password Modal
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Customers ලා කරපු සියලුම ක්‍රියාකාරකම් Fetch කිරීම
  const fetchCustomerActivities = async () => {
    setLoadingNotifs(true);
    try {
      const [appts, rsvs, pays, inqs, revs] = await Promise.allSettled([
        appointmentService.getAll(),
        reservationService.getAll(),
        paymentService.getAll ? paymentService.getAll() : Promise.resolve([]),
        inquiryService.getAll(),
        reviewService.getAll(),
      ]);

      const alerts: AdminActivityAlert[] = [];

      // 1. Appointments
      if (appts.status === 'fulfilled' && Array.isArray(appts.value)) {
        appts.value.forEach((a: any) => {
          const dateStr = a.createdAt || a.date || new Date().toISOString();
          const isPending = a.status === 'Pending';
          alerts.push({
            id: `act-apt-${a.id}`,
            title: isPending ? 'New Viewing Booking' : `Viewing Booked (${a.status})`,
            message: `${a.customerName || 'Customer'} scheduled a viewing for ${a.apartmentTitle || 'Residence'} on ${a.date || ''} (${a.timeSlot || ''})`,
            time: timeAgo(dateStr),
            rawDate: new Date(dateStr).getTime(),
            link: '/management/appointments',
            unread: isPending,
            type: 'appointment',
          });
        });
      }

      // 2. Reservations
      if (rsvs.status === 'fulfilled' && Array.isArray(rsvs.value)) {
        rsvs.value.forEach((r: any) => {
          const dateStr = r.createdAt || new Date().toISOString();
          const isPending = r.status === 'Pending';
          alerts.push({
            id: `act-rsv-${r.id}`,
            title: isPending ? 'New Priority Hold Placed' : `Property Hold (${r.status})`,
            message: `${r.customerName || 'Customer'} reserved ${r.apartmentTitle || 'Residence'} with deposit ${formatCurrency(r.reservationFee || 500000)}`,
            time: timeAgo(dateStr),
            rawDate: new Date(dateStr).getTime(),
            link: '/management/reservations',
            unread: isPending,
            type: 'reservation',
          });
        });
      }

      // 3. Payments
      if (pays.status === 'fulfilled' && Array.isArray(pays.value)) {
        pays.value.forEach((p: any) => {
          const dateStr = p.uploadedAt || p.createdAt || new Date().toISOString();
          const isPending = p.status === 'Pending';
          alerts.push({
            id: `act-pay-${p.id}`,
            title: isPending ? 'New Bank Slip Deposited' : `Payment Deposited (${p.status})`,
            message: `${p.customerName || 'Customer'} transferred ${formatCurrency(p.amount || 0)} for ${p.apartmentTitle || 'Unit'} (${p.type})`,
            time: timeAgo(dateStr),
            rawDate: new Date(dateStr).getTime(),
            link: '/management/payments',
            unread: isPending,
            type: 'payment',
          });
        });
      }

      // 4. Inquiries
      if (inqs.status === 'fulfilled' && Array.isArray(inqs.value)) {
        inqs.value.forEach((i: any) => {
          const dateStr = i.createdAt || new Date().toISOString();
          const isUnanswered = !i.replies || i.replies.length === 0 || i.status === 'New';
          alerts.push({
            id: `act-inq-${i.id}`,
            title: 'New Customer Inquiry',
            message: `${i.customerName || 'Customer'} asked: "${(i.subject || i.message || '').slice(0, 45)}..."`,
            time: timeAgo(dateStr),
            rawDate: new Date(dateStr).getTime(),
            link: '/management/inquiries',
            unread: isUnanswered,
            type: 'inquiry',
          });
        });
      }

      // 5. Reviews
      if (revs.status === 'fulfilled' && Array.isArray(revs.value)) {
        revs.value.forEach((rv: any) => {
          const dateStr = rv.createdAt || new Date().toISOString();
          const isPending = rv.status === 'Pending';
          alerts.push({
            id: `act-rev-${rv.id}`,
            title: isPending ? 'New Review Submitted' : `Customer Review (${rv.status})`,
            message: `${rv.customerName || 'Resident'} rated ${rv.apartmentTitle || 'Unit'} (${rv.rating}★): "${(rv.title || '').slice(0, 30)}"`,
            time: timeAgo(dateStr),
            rawDate: new Date(dateStr).getTime(),
            link: '/management/reviews',
            unread: isPending,
            type: 'review',
          });
        });
      }

      // Latest First sorting
      alerts.sort((a, b) => b.rawDate - a.rawDate);
      setActivityAlerts(alerts);
    } catch (err) {
      console.error('Failed to load customer activities:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchCustomerActivities();
    const interval = setInterval(fetchCustomerActivities, 45000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlertsCount = useMemo(() => {
    return activityAlerts.filter(n => n.unread).length;
  }, [activityAlerts]);

  const totalPages = Math.ceil(activityAlerts.length / pageSize) || 1;

  const currentDisplayedAlerts = useMemo(() => {
    const start = (notifPage - 1) * pageSize;
    return activityAlerts.slice(start, start + pageSize);
  }, [activityAlerts, notifPage]);

  const markAllAlertsRead = () => {
    setActivityAlerts(prev => prev.map(n => ({ ...n, unread: false })));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast('Logged out successfully', 'info');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd) {
      toast('Please enter your current password', 'error');
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      toast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast('New passwords do not match', 'error');
      return;
    }

    setPwdLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: user?.email,
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });

      if (res.ok) {
        toast('Password updated successfully!', 'success');
        setPwdModalOpen(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
      } else {
        const errText = await res.text();
        toast(errText || 'Failed to update password', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Server error occurred', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/management', icon: LayoutDashboard, exact: true },
    { label: 'Apartments', path: '/management/apartments', icon: Building2 },
    { label: 'Appointments', path: '/management/appointments', icon: CalendarCheck },
    { label: 'Reservations', path: '/management/reservations', icon: BookmarkCheck },
    { label: 'Verify Payments', path: '/management/payments', icon: CreditCard },
    { label: 'Inquiries', path: '/management/inquiries', icon: MessageSquare },
    { label: 'Moderate Reviews', path: '/management/reviews', icon: Star },
    { label: 'Sales & Records', path: '/management/sales', icon: TrendingUp },
    { label: 'Manage Users', path: '/management/users', icon: Users, adminOnly: true },
    { label: 'Reports', path: '/management/reports', icon: BarChart3, adminOnly: true },
  ];

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out flex flex-col justify-between ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-72 max-w-[85vw]`}
      >
        <div>
          <div className="h-20 flex items-center px-5 justify-between border-b border-slate-100 relative">
            <Link to="/management" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/25 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className={`transition-opacity duration-200 truncate ${collapsed ? 'lg:hidden' : 'block'}`}>
                <p className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                  Skyline<span className="text-amber-500">Living</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Management
                </p>
              </div>
            </Link>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex absolute -right-3.5 top-7 w-7 h-7 bg-white border border-slate-200/90 shadow-sm rounded-full items-center justify-center text-slate-500 hover:text-slate-900 hover:border-amber-400 transition cursor-pointer z-50"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-800'}`} />
                  <span className={`truncate ${collapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>
                  {isActive && <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-slate-950 ${collapsed ? 'lg:hidden' : 'block'}`} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Globe className="w-4 h-4 shrink-0 text-slate-400" />
            <span className={collapsed ? 'lg:hidden' : 'block'}>Back to Site</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : 'block'}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ml-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Welcome back,</p>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                <span className="truncate max-w-[130px] sm:max-w-xs">{user?.name || 'Administrator'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 uppercase tracking-wider shrink-0">
                  {user?.role || 'Admin'}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* CLEAN LUXURY NOTIFICATION POPOVER */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition relative cursor-pointer ${
                  notifOpen 
                    ? 'bg-amber-50 border-amber-300 text-amber-900' 
                    : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Customer Activities & Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:max-w-[450px] bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] border border-slate-200/90 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* Clean & Spacious Popover Header */}
                  <div className="px-5 pb-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                    
                    {/* Left: Title + Total Counter */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">
                        Customer Activities
                      </h4>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {activityAlerts.length} Total
                      </span>
                    </div>

                    {/* Right: Action Required Badge + Clean Mark All Read Link */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {unreadAlertsCount > 0 && (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs tracking-tight">
                          {unreadAlertsCount} Action Required
                        </span>
                      )}

                      {unreadAlertsCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAlertsRead}
                          className="text-[11px] font-bold text-slate-500 hover:text-amber-700 transition cursor-pointer pl-1"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                  </div>

                  {/* List (5 Customer Actions per Page) */}
                  <div className="divide-y divide-slate-100 min-h-[260px] max-h-[380px] overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading customer activities...</div>
                    ) : activityAlerts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium">No customer activities found</div>
                    ) : (
                      currentDisplayedAlerts.map((n) => {
                        const iconMap: Record<string, React.ReactNode> = {
                          payment: <CreditCard className="w-4 h-4 text-emerald-600" />,
                          appointment: <CalendarCheck className="w-4 h-4 text-amber-600" />,
                          reservation: <BookmarkCheck className="w-4 h-4 text-indigo-600" />,
                          inquiry: <MessageSquare className="w-4 h-4 text-blue-600" />,
                          review: <Star className="w-4 h-4 text-amber-500" />,
                        };
                        const bgMap: Record<string, string> = {
                          payment: 'bg-emerald-50 border-emerald-200/70',
                          appointment: 'bg-amber-50 border-amber-200/70',
                          reservation: 'bg-indigo-50 border-indigo-200/70',
                          inquiry: 'bg-blue-50 border-blue-200/70',
                          review: 'bg-amber-50 border-amber-200/70',
                        };

                        return (
                          <Link
                            key={n.id}
                            to={n.link}
                            onClick={() => setNotifOpen(false)}
                            className={`px-5 py-3.5 flex items-start gap-3.5 hover:bg-slate-50/80 transition-colors group relative ${
                              n.unread ? 'bg-amber-50/25' : ''
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${bgMap[n.type] || 'bg-slate-50 border-slate-200'}`}>
                              {iconMap[n.type] || <Bell className="w-4 h-4 text-slate-600" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                            </div>

                            {n.unread && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2 ring-2 ring-amber-100" />
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>

                  {/* 5 by 5 Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-5 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Page <strong className="text-slate-700">{notifPage}</strong> of {totalPages}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={notifPage <= 1}
                          onClick={() => setNotifPage(prev => Math.max(prev - 1, 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold text-[11px] transition cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={notifPage >= totalPages}
                          onClick={() => setNotifPage(prev => Math.min(prev + 1, totalPages))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold text-[11px] transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Popover Footer Links */}
                  <div className="px-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setNotifPage(1); fetchCustomerActivities(); }}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-bold transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingNotifs ? 'animate-spin text-amber-600' : ''}`} />
                      <span>Sync</span>
                    </button>

                    <div className="flex items-center gap-3 font-bold">
                      <Link to="/management/payments" onClick={() => setNotifOpen(false)} className="text-amber-700 hover:text-amber-800 transition">
                        Payments →
                      </Link>
                      <Link to="/management/appointments" onClick={() => setNotifOpen(false)} className="text-slate-600 hover:text-slate-900 transition">
                        Appointments →
                      </Link>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative pl-3 border-l border-slate-200" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100/70 transition cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                  {(user?.name || 'Admin').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                    {user?.email || 'admin@skylineliving.com'}
                  </p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-slate-50 rounded-2xl mb-1.5 border border-slate-100">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{user?.name || 'Admin User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@skylineliving.com'}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 uppercase">
                      {user?.role || 'Administrator'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); setPwdModalOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Change Password</span>
                    </button>

                    <Link
                      to="/"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>Back to Public Website</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out">
          <Outlet />
        </main>
      </div>

      {/* 3. PASSWORD MODAL */}
      <Modal
        open={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        title="Change Security Password"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={pwdLoading} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0">
              {pwdLoading ? 'Updating...' : 'Save Password'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
        </form>
      </Modal>

    </div>
  );
}