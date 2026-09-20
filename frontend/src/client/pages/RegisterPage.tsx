import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight,
  Building2, CheckCircle2, Sparkles, ShieldCheck, Star, KeyRound, Award
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

  const benefits = [
    { title: 'Priority 48-Hour Holds', desc: 'Lock signature units before public open-houses' },
    { title: 'Architectural Viewings', desc: 'Schedule private VIP on-site walk-throughs' },
    { title: 'Transparent Deed Tracking', desc: 'Direct legal deed registration & payment records' },
    { title: 'Direct Concierge Channel', desc: '24/7 dedicated luxury apartment advisor' },
  ];

  return (
    <div className="min-h-screen flex bg-[#fafbfe] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-gradient-to-br from-gold-100/60 via-champagne-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-amber-100/40 via-gold-50/50 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Left Section: Full Height Light Luxury Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 xl:p-16 flex-col justify-between overflow-hidden border-r border-gold-200/50 bg-gradient-to-br from-white via-champagne-50/60 to-gold-50/40">
        
        {/* Background Subtle Architectural Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-15" />
        
        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-white shadow-lg shadow-gold-500/25 group-hover:scale-105 transition duration-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-900 font-serif">
                Skyline<span className="text-gold-600">Living</span>
              </p>
              <p className="text-[11px] uppercase tracking-widest text-gold-700 font-bold">
                Ultra-Luxury Residences
              </p>
            </div>
          </Link>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-100/80 border border-gold-300/60 text-gold-900 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            Exclusive Membership Privileges
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-[1.15] font-serif tracking-tight mb-4">
            Own Your Place Above The <br />
            <span className="gold-gradient-text">Skyline Horizon</span>
          </h1>

          <p className="text-slate-600 text-base leading-relaxed mb-8">
            Create an account to gain instant access to verified architectural floor plans, flexible milestone payment schedules, and priority reservation allocations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {benefits.map((b, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/80 border border-gold-100/80 shadow-sm hover:shadow-md hover:border-gold-300 transition duration-300 group">
                <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center font-bold text-xs mb-2.5 group-hover:bg-gold-500 group-hover:text-white transition">
                  {i === 0 ? <KeyRound className="w-4 h-4" /> : i === 1 ? <Star className="w-4 h-4" /> : i === 2 ? <ShieldCheck className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{b.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Trust Banner */}
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="flex -space-x-2">
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Avatar" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Avatar" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="Avatar" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Joined by over 450+ verified penthouse owners</p>
              <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold mt-0.5">
                <div className="flex text-amber-500">★★★★★</div>
                <span className="text-slate-500 ml-1">4.9/5 satisfaction rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>© 2026 Skyline Living. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="hover:text-gold-700 transition">VIP Concierge</Link>
            <Link to="/apartments" className="hover:text-gold-700 transition">Explore Units</Link>
          </div>
        </div>
      </div>

      {/* Right Section: Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 py-12 relative z-10">
        <div className="w-full max-w-lg">
          
          <div className="luxury-glass rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(180,83,9,0.08)] p-8 sm:p-10 backdrop-blur-xl">
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                Register New Resident
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
                Create Your Account
              </h2>
              <p className="text-sm text-slate-600 mt-1 font-normal">
                Join Skyline Living and access private luxury properties.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                placeholder="e.g. Tharusha Jayod"
                icon={<User className="w-4 h-4 text-gold-600" />}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                error={errors.name}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="name@example.com"
                icon={<Mail className="w-4 h-4 text-gold-600" />}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                error={errors.email}
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="077 123 4567"
                icon={<Phone className="w-4 h-4 text-gold-600" />}
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
                    icon={<Lock className="w-4 h-4 text-gold-600" />}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[38px] text-slate-400 hover:text-gold-700 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  icon={<Lock className="w-4 h-4 text-gold-600" />}
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-gold-600 focus:ring-gold-400 cursor-pointer accent-gold-600"
                />
                <span className="leading-relaxed">
                  I agree to the{' '}
                  <span className="text-gold-700 font-bold hover:underline">Terms of Service</span> and{' '}
                  <span className="text-gold-700 font-bold hover:underline">Privacy Policy</span>
                </span>
              </label>

              {/* Luxury Gold Create Account Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 via-gold-600 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-gold-500/25 flex items-center justify-center gap-2 transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-xs sm:text-sm text-slate-500 mt-6 pt-6 border-t border-gold-100 font-normal">
              Already have an account?{' '}
              <Link to="/login" className="text-gold-700 hover:text-gold-800 font-bold hover:underline">
                Sign in to your portal
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}