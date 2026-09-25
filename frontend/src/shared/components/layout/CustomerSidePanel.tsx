import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2, Scale, CreditCard, BookmarkCheck, CalendarCheck,
  MessageSquare, Bell, Star, ChevronRight, Sparkles, X,
  Compass, LayoutDashboard, Heart, ArrowRight, Shield
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { useNotifications } from '@/shared/contexts/NotificationsContext';

interface CustomerSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerSidePanel({ isOpen, onClose }: CustomerSidePanelProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { count: favCount } = useFavorites();
  const { unreadCount } = useNotifications();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      group: 'EXPLORATION',
      items: [
        { label: 'Featured Residences', path: '/apartments', icon: Building2, count: null },
        { label: 'Compare Specifications', path: '/compare', icon: Scale, count: null },
        { label: 'Saved Favorites', path: '/favorites', icon: Heart, count: favCount > 0 ? favCount : null },
        { label: 'Resident Reviews', path: '/reviews', icon: Star, count: null },
      ],
    },
    {
      group: 'CLIENT CONCIERGE & ACCOUNTS',
      items: [
        { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard, count: null, authOnly: true },
        { label: 'My Purchased Residences', path: '/my-apartments', icon: Building2, count: null, authOnly: true },
        { label: 'Payments & Milestones', path: '/payments', icon: CreditCard, count: null, authOnly: true },
        { label: 'Priority Unit Holds', path: '/reservations', icon: BookmarkCheck, count: null, authOnly: true },
        { label: 'Viewing Appointments', path: '/appointments', icon: CalendarCheck, count: null, authOnly: true },
        { label: 'Inquiries & Consultation', path: '/inquiries', icon: MessageSquare, count: null, authOnly: true },
        { label: 'Notifications', path: '/notifications', icon: Bell, count: unreadCount > 0 ? unreadCount : null, authOnly: true },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Side Panel Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Skyline Quick Access
                </h3>
                <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Luxury Living Concierge
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            
            {/* User Greeting Card */}
            {isAuthenticated && user ? (
              <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 rounded-2xl p-4 border border-amber-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-300 text-[11px] font-bold text-slate-700 hover:text-amber-800 transition"
                >
                  Profile
                </Link>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Skyline Membership</p>
                <h4 className="text-base font-extrabold mt-1">Unlock Resident Portal</h4>
                <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
                  Sign in to manage verified reservation holds, viewing schedules, and bank payments.
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-sm hover:brightness-105 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* Menu Groups */}
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3">
                  {group.group}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    if (item.authOnly && !isAuthenticated) return null;
                    const active = isActive(item.path);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-xs'
                            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.count !== null && item.count > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                              {item.count}
                            </span>
                          )}
                          <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-amber-600' : 'text-slate-300'}`} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Management link if admin/staff */}
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') && (
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/management"
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 hover:bg-amber-100/70 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs font-extrabold">Executive Console</p>
                      <p className="text-[10px] text-amber-700">Admin management dashboard</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </Link>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Skyline Living™ Colombo Luxury Real Estate
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
