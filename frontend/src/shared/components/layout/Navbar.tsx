import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Heart, Bell, User, LogOut, Menu, X,
  LayoutDashboard, ChevronDown, Shield,
  CalendarCheck, FileText, MessageSquare, CreditCard
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import { initials } from '@/shared/utils/format';
import SignOutConfirmModal from '@/shared/components/auth/SignOutConfirmModal';

const mainNavLinks = [
  { label: 'Home', path: '/' },
  { label: 'Apartments', path: '/apartments' },
  { label: 'Compare', path: '/compare' },
  { label: 'Reviews', path: '/reviews' },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { count } = useFavorites();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const signOutTriggerRef = useRef<HTMLButtonElement>(null);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isStaffOrAdmin = (user?.role as string)?.toLowerCase() === 'staff' || (user?.role as string)?.toLowerCase() === 'admin';

  const openSignOutModal = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    setSignOutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setSignOutModalOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_rgba(15,23,42,0.03)] transition-all">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo & Main Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Building2 className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                Skyline<span className="text-amber-600">Living</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${isActive(link.path)
                    ? 'text-amber-900 bg-amber-50 border border-amber-300/70 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {isAuthenticated ? (
              <>
                {/* Direct Resident Links in Navbar */}
                <Link
                  to="/reservations"
                  className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${isActive('/reservations')
                    ? 'text-amber-900 bg-amber-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reservations</span>
                </Link>

                <Link
                  to="/appointments"
                  className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${isActive('/appointments')
                    ? 'text-amber-900 bg-amber-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Viewings</span>
                </Link>

                <Link
                  to="/payments"
                  className={`hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${isActive('/payments')
                    ? 'text-amber-900 bg-amber-50 border border-amber-300'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Payments</span>
                </Link>

                {/* Dashboard Button */}
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${isActive('/dashboard')
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/25 ring-2 ring-amber-300'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                >
                  <LayoutDashboard className={`w-3.5 h-3.5 ${isActive('/dashboard') ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>Dashboard</span>
                </Link>

                {/* Management Portal Button (Staff & Admin) */}
                {isStaffOrAdmin && (
                  <Link
                    to="/management"
                    className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Management</span>
                  </Link>
                )}

                {/* Favorites Icon */}
                <Link
                  to="/favorites"
                  className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center justify-center border border-slate-200/70"
                  title="Saved Favorites"
                >
                  <Heart className="w-4 h-4" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                      {count}
                    </span>
                  )}
                </Link>

                {/* Notifications Icon */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center justify-center border border-slate-200/70"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Avatar Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black rounded-xl flex items-center justify-center text-xs shadow-sm">
                      {initials(user!.name)}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200/90 p-2 z-20 animate-scaleIn">
                        <div className="px-4 py-3 bg-slate-50 rounded-2xl mb-1.5 border border-slate-100">
                          <p className="text-xs font-extrabold text-slate-900 truncate">{user!.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user!.email}</p>
                        </div>

                        <div className="space-y-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-600" />
                            <span>Dashboard</span>
                          </Link>

                          <Link
                            to="/my-apartments"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          >
                            <Building2 className="w-4 h-4 text-amber-600" />
                            <span>My Purchased Apartments</span>
                          </Link>

                          <Link
                            to="/reservations"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          >
                            <FileText className="w-4 h-4 text-amber-600" />
                            <span>My Holds & Reservations</span>
                          </Link>

                          <Link
                            to="/payments"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          >
                            <CreditCard className="w-4 h-4 text-amber-600" />
                            <span>Payments & Invoices</span>
                          </Link>

                          <Link
                            to="/appointments"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          >
                            <CalendarCheck className="w-4 h-4 text-amber-600" />
                            <span>Viewing Appointments</span>
                          </Link>

                          <Link
                            to="/inquiries"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          >
                            <MessageSquare className="w-4 h-4 text-amber-600" />
                            <span>My Inquiries</span>
                          </Link>

                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span>Profile Settings</span>
                          </Link>

                          {isStaffOrAdmin && (
                            <Link
                              to="/management"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 transition"
                            >
                              <Shield className="w-4 h-4 text-amber-600" />
                              <span>Management Console</span>
                            </Link>
                          )}

                          <button
                            ref={signOutTriggerRef}
                            type="button"
                            onClick={openSignOutModal}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 active:scale-95 text-slate-950 rounded-xl shadow-md shadow-amber-500/20 transition"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 max-h-[calc(100vh-5rem)] overflow-y-auto animate-in fade-in duration-200">
            <nav className="flex flex-col gap-1.5 pb-4">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl ${isActive(link.path) ? 'text-amber-900 bg-amber-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <div className="pt-2 my-1 border-t border-slate-100" />
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-50 rounded-xl"
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-600" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/my-apartments"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>My Purchased Apartments</span>
                  </Link>
                  <Link
                    to="/reservations"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Holds & Reservations</span>
                  </Link>
                  <Link
                    to="/payments"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Payments</span>
                  </Link>
                  <Link
                    to="/appointments"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <CalendarCheck className="w-4 h-4 text-amber-600" />
                    <span>Appointments</span>
                  </Link>
                  <Link
                    to="/inquiries"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <span>Inquiries</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile Settings</span>
                  </Link>

                  {isStaffOrAdmin && (
                    <Link
                      to="/management"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100/60 rounded-xl"
                    >
                      <Shield className="w-4 h-4 text-amber-700" />
                      <span>Management Console</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={openSignOutModal}
                    className="text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 text-xs font-bold text-center text-slate-700 bg-slate-100 rounded-xl">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 text-xs font-bold text-center text-slate-950 bg-amber-500 rounded-xl">Create Account</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Customer Sign-Out Confirmation Dialog */}
      <SignOutConfirmModal
        open={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        triggerRef={signOutTriggerRef}
      />
    </header>
  );
}