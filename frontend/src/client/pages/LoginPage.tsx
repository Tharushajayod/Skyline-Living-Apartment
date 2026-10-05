import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Button from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Form';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from;

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser) {
        toast('Welcome back to Skyline Living!', 'success');
        const role = (loggedUser.role || '').toLowerCase();
        if (role === 'admin' || role === 'staff') {
          navigate('/management');
        } else {
          navigate(from || '/dashboard');
        }
      } else {
        toast('Invalid email or password. Please try again.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-stretch justify-center">

      {/* Left Section: Light Luxury Visual Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 border-r border-amber-200/60 p-12 xl:p-16 flex-col justify-between overflow-hidden">

        {/* Decorative Ambient Shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-slate-900">
                Skyline<span className="text-amber-600">Living</span>
              </p>
              <p className="text-[11px] uppercase tracking-wider text-amber-700 font-bold">
                Luxury Real Estate Concierge
              </p>
            </div>
          </Link>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs font-bold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Colombo's Most Prestigious Residences</span>
          </div>

          <h1 className="text-3xl xl:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight mb-4">
            Welcome to <br />
            <span className="gold-gradient-text">
              Skyline Living
            </span>
          </h1>

          <p className="text-slate-600 text-sm xl:text-base leading-relaxed mb-8">
            Access verified property deeds, reserve luxury apartments, verify bank deposit slips, and schedule private penthouse viewings.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-amber-200/60">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-amber-200/50 shadow-xs">
              <p className="text-2xl font-black text-amber-600 font-sans tabular-nums">100%</p>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Verified Deeds</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-amber-200/50 shadow-xs">
              <p className="text-2xl font-black text-slate-900 font-sans tabular-nums">10%</p>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Initial Hold Fee</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-amber-200/50 shadow-xs">
              <p className="text-2xl font-black text-emerald-600 font-sans tabular-nums">Live</p>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Payment Sync</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>© 2026 Skyline Living. All rights reserved.</p>

        </div>

      </div>

      {/* Right Section: Luxury Light Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-md">

          <div className="luxury-glass rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden">

            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your email and password to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="name@example.com"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span>Remember my session</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast('Please contact Skyline support to reset your password.', 'info')}
                  className="text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  icon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold text-sm py-3 rounded-2xl border-0 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  Sign In
                </Button>
              </div>
            </form>

            <p className="text-center text-xs sm:text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100 font-normal">
              New to Skyline Living?{' '}
              <Link to="/register" className="text-amber-700 hover:text-amber-800 font-extrabold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}