import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight,
  Building2, CheckCircle2, Sparkles
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Button from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Form';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Name is too short';

    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';

    if (form.phone && !/^[\d\s+\-()]+$/.test(form.phone)) e.phone = 'Enter a valid phone number';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) e.confirmPassword = 'Confirm password is required';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const success = await register(form.name, form.email, form.password, form.phone);
      if (success) {
        toast('Account created successfully! Welcome to Skyline Living.', 'success');
        navigate('/dashboard');
      } else {
        toast('Registration failed. Email may already be registered.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-stretch justify-center">

      {/* Left Section: Light Luxury Visual Banner (Exact Match with LoginPage) */}
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
            Join the <br />
            <span className="gold-gradient-text">
              Skyline Community
            </span>
          </h1>

          <p className="text-slate-600 text-sm xl:text-base leading-relaxed mb-8">
            Create your verified account to reserve luxury residences, track milestone payment schedules, and schedule private showings.
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

      {/* Right Section: Luxury Light Register Form (Matches LoginPage) */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-md">

          <div className="luxury-glass rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden">

            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Your Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Join Skyline Living and discover your next home.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                placeholder="e.g. Tharusha Jayod"
                icon={<User className="w-4 h-4 text-slate-400" />}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                error={errors.name}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="name@example.com"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                error={errors.email}
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="077 123 4567"
                icon={<Phone className="w-4 h-4 text-slate-400" />}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                error={errors.phone}
              />

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
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

              <div>
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="leading-relaxed">
                  I agree to the{' '}
                  <span className="text-amber-700 hover:text-amber-800 font-bold hover:underline">Terms of Service</span> and{' '}
                  <span className="text-amber-700 hover:text-amber-800 font-bold hover:underline">Privacy Policy</span>
                </span>
              </label>

              {/* Submit Button (Exact match with LoginPage) */}
              <div className="pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  icon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold text-sm py-3 rounded-2xl border-0 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  Create Account
                </Button>
              </div>
            </form>

            <p className="text-center text-xs sm:text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100 font-normal">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-700 hover:text-amber-800 font-extrabold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}