import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Tag,
  Flag,
  Clock,
  HelpCircle,
  ChevronRight,
  User,
  Building2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Sparkles,
  FileCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  Info,
  Clock3,
} from 'lucide-react';
import type { Inquiry, InquiryCategory, InquiryPriority, InquiryStatus, Apartment } from '@/shared/types';
import { inquiryService } from '@/shared/services/inquiryService';
import { apartmentService } from '@/shared/services/apartmentService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/shared/components/ui/Form';
import { timeAgo, formatDate } from '@/shared/utils/format';

type FilterTab = 'all' | 'Pending' | 'In Progress' | 'Resolved';

const INQUIRY_CATEGORIES: { value: InquiryCategory; label: string; desc: string }[] = [
  { value: 'General', label: 'General Inquiry', desc: 'Questions about Skyline Living projects' },
  { value: 'Pricing', label: 'Pricing & Discounts', desc: 'Payment amounts, discounts & schedules' },
  { value: 'Availability', label: 'Unit Availability', desc: 'Floor plans, unit allocations & tiers' },
  { value: 'Viewing', label: 'Private Viewing', desc: 'On-site appointments & tour logistics' },
  { value: 'Financing', label: 'Bank Financing', desc: 'Loan partners & customized payment plans' },
];

export default function InquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Instant SWR cache initialization (0ms)
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    if (user?.email) {
      return inquiryService.getCachedByCustomer(user.email) || [];
    }
    return [];
  });

  const [apartmentList, setApartmentList] = useState<Apartment[]>(() => {
    return apartmentService.getCached('apartments_all') || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (user?.email && inquiryService.getCachedByCustomer(user.email)) {
      return false;
    }
    return true;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const activeTab = (searchParams.get('tab') as FilterTab) || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'General' as InquiryCategory,
    priority: 'Medium' as InquiryPriority,
    apartmentId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Selected Inquiry for Conversation Thread Modal
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch Data Concurrently
  const loadData = useCallback(async (showRefreshing = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const [inqRes, aptRes] = await Promise.allSettled([
        inquiryService.getByCustomer(user.email),
        apartmentService.getAll({ includeSold: true }),
      ]);

      if (inqRes.status === 'fulfilled' && Array.isArray(inqRes.value)) {
        setInquiries(inqRes.value);
      } else if (inqRes.status === 'rejected') {
        console.error('Failed to load inquiries:', inqRes.reason);
        if (inquiries.length === 0) {
          setError('Unable to load your inquiry records. Please check your network connection.');
        }
      }

      if (aptRes.status === 'fulfilled' && Array.isArray(aptRes.value)) {
        setApartmentList(aptRes.value);
      }
    } catch (err: any) {
      console.error('Error fetching inquiries page data:', err);
      if (inquiries.length === 0) {
        setError(err?.message || 'Error communicating with the inquiry service.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.email, inquiries.length]);

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  // Tab switch
  const handleTabChange = (tab: FilterTab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params, { replace: true });
  };

  // Form Validation
  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.subject.trim()) {
      e.subject = 'Please enter an inquiry subject.';
    }
    if (!form.message.trim()) {
      e.message = 'Please provide details for your inquiry.';
    } else if (form.message.trim().length < 10) {
      e.message = 'Message must be at least 10 characters.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Submit Inquiry Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user || submitting) return;

    setSubmitting(true);
    try {
      const apt = apartmentList.find((a) => (a.id || (a as any)._id) === form.apartmentId);
      const newInq = await inquiryService.create({
        apartmentId: form.apartmentId || null,
        apartmentTitle: apt?.title || null,
        customerName: user.name,
        customerEmail: user.email,
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category,
        priority: form.priority,
      });

      setInquiries((prev) => [newInq, ...prev]);
      toast('Your inquiry has been submitted to the sales team.', 'success');
      setFormSuccess(true);
      setForm({
        subject: '',
        message: '',
        category: 'General',
        priority: 'Medium',
        apartmentId: '',
      });
      setErrors({});

      setTimeout(() => {
        setFormSuccess(false);
      }, 6000);
    } catch (err: any) {
      toast(err.message || 'Failed to submit inquiry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Adding Reply
  const handleReply = async () => {
    if (!replyText.trim() || !selectedInquiry || !user || submittingReply) return;

    setSubmittingReply(true);
    try {
      const updated = await inquiryService.addReply(selectedInquiry.id, {
        author: user.name,
        authorRole: 'customer',
        message: replyText.trim(),
      });

      setInquiries((prev) => prev.map((i) => (i.id === selectedInquiry.id ? updated : i)));
      setSelectedInquiry(updated);
      setReplyText('');
      toast('Your follow-up reply has been sent.', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to send reply. Please try again.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Filtered Inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // Tab filter
      const matchesTab = activeTab === 'all' || inq.status === activeTab;

      // Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        inq.subject?.toLowerCase().includes(query) ||
        inq.id?.toLowerCase().includes(query) ||
        inq.message?.toLowerCase().includes(query) ||
        inq.apartmentTitle?.toLowerCase().includes(query) ||
        inq.category?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [inquiries, activeTab, searchQuery]);

  // Status Badge Helper
  const getInquiryStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            In Review
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Awaiting Staff Response
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER BANNER (Consistent with Customer Portal)   */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-slate-200/80 pt-8 pb-7 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Property Inquiries
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 font-normal">
                Have a question about a property, apartment, viewing, reservation, or payment? Send us your inquiry and our team will get back to you.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh inquiries"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link
                to="/appointments"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>My Viewings</span>
              </Link>

              <Link
                to="/reservations"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>My Reservations</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CANVAS (Two-Column Space-Efficient Composition)      */}
      {/* ======================================================== */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="underline font-bold hover:text-rose-950 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT SECTION: INQUIRY FORM & HISTORY (8 cols on lg)      */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Form Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs">
              
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Send an Inquiry to Sales Desk
                    </h2>
                    <p className="text-xs text-slate-500">
                      Our certified property consultants respond within 1 business day.
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Alert */}
              {formSuccess && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-900 text-xs animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Inquiry Successfully Submitted</p>
                    <p className="text-emerald-800 mt-0.5">
                      Your inquiry has been assigned to a property concierge. You can track replies in the timeline below.
                    </p>
                  </div>
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Category Pill Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Inquiry Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {INQUIRY_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.value })}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                          form.category === cat.value
                            ? 'border-amber-400 bg-amber-50/50 shadow-2xs ring-1 ring-amber-400/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{cat.label}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{cat.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inquiring about 3BR pricing & customized payment plans"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
                  />
                  {errors.subject && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Residence Selector & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Related Residence (Optional)
                    </label>
                    <Select
                      value={form.apartmentId}
                      onChange={(e) => setForm({ ...form, apartmentId: e.target.value })}
                      placeholder="General project inquiry (no unit)"
                      options={apartmentList.map((a) => ({
                        value: a.id || (a as any)._id,
                        label: `${a.title} (${a.buildingName || a.city})`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Urgency / Priority
                    </label>
                    <Select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as InquiryPriority })}
                      options={[
                        { value: 'Low', label: 'Low - General inquiry' },
                        { value: 'Medium', label: 'Medium - Standard review' },
                        { value: 'High', label: 'High - Time-sensitive / Active Hold' },
                      ]}
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Message & Requirements <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {form.message.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Tell us what you'd like to know about the property, payment plans, or scheduled visits..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition resize-y"
                  />
                  {errors.message && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Form Footer Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct encrypted transmission to Skyline sales desk</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Send className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{submitting ? 'Sending Inquiry...' : 'Send Inquiry'}</span>
                  </button>
                </div>

              </form>

            </div>

            {/* ======================================================== */}
            {/* INQUIRY HISTORY DECK                                     */}
            {/* ======================================================== */}
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Inquiry History & Staff Replies
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click any inquiry to review conversation history or send follow-up replies.
                  </p>
                </div>
              </div>

              {/* Status Filter & Search Controls */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => handleTabChange('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>All</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {inquiries.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('Pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'Pending'
                        ? 'bg-white text-amber-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Pending</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'Pending' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                      {inquiries.filter((i) => i.status === 'Pending').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('In Progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'In Progress'
                        ? 'bg-white text-blue-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>In Review</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'In Progress' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {inquiries.filter((i) => i.status === 'In Progress').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('Resolved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'Resolved'
                        ? 'bg-white text-emerald-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Resolved</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'Resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {inquiries.filter((i) => i.status === 'Resolved').length}
                    </span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative min-w-[220px] sm:min-w-[280px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search inquiries or replies..."
                    className="w-full px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

              </div>

              {/* Inquiry Items */}
              <div className="space-y-3">
                {loading && inquiries.length === 0 ? (
                  /* Skeletons */
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs animate-pulse space-y-2.5"
                      >
                        <div className="h-5 w-48 bg-slate-200 rounded" />
                        <div className="h-4 w-72 bg-slate-100 rounded" />
                        <div className="h-4 w-36 bg-slate-50 rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredInquiries.length === 0 ? (
                  /* Empty State */
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {searchQuery || activeTab !== 'all'
                          ? 'No matching inquiries found'
                          : 'No inquiry history yet'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        {searchQuery || activeTab !== 'all'
                          ? 'Try adjusting your search terms or selecting another tab.'
                          : 'Use the form above to ask our property consultants any question.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Inquiry Cards */
                  filteredInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition duration-200 cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                            <MessageCircle className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition truncate">
                                {inq.subject}
                              </h3>
                              <span className="text-[11px] font-mono text-slate-400 font-medium">
                                #{inq.id}
                              </span>
                            </div>

                            {inq.apartmentTitle && (
                              <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                                <span>{inq.apartmentTitle}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                          {getInquiryStatusBadge(inq.status)}
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition hidden sm:block" />
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1">
                        {inq.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-100 mt-3 font-medium">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          {inq.category}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Flag className="w-3.5 h-3.5 text-amber-600" />
                          {inq.priority} Priority
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {timeAgo(inq.createdAt)}
                        </span>
                        {inq.replies && inq.replies.length > 0 && (
                          <span className="ml-auto font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 text-[11px]">
                            {inq.replies.length} {inq.replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT SECTION: HELPFUL SALES DESK & ACTIONS (4 cols on lg)*/}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Direct Contact Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Sales Desk</h3>
                  <p className="text-[11px] text-slate-500">Available Monday through Saturday</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Phone Support</p>
                    <p className="font-bold text-slate-900 mt-0.5">+94 11 234 5678</p>
                    <p className="text-slate-500 text-[11px]">+94 77 123 4567 (WhatsApp)</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Official Email</p>
                    <p className="font-bold text-slate-900 mt-0.5">sales@skylineliving.lk</p>
                    <p className="text-slate-500 text-[11px]">concierge@skylineliving.lk</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Sales Gallery</p>
                    <p className="font-bold text-slate-900 mt-0.5">Skyline Living Sales Gallery</p>
                    <p className="text-slate-500 text-[11px]">No. 45 Galle Road, Colombo 03</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Clock3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Gallery Hours</p>
                    <p className="font-bold text-slate-900 mt-0.5">8:30 AM – 6:30 PM (Mon–Sat)</p>
                    <p className="text-slate-500 text-[11px]">Sunday by private appointment</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Assistance Areas Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What We Can Help You With
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Penthouse & residence floor plans, sizing & luxury specifications.</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Customized installment plans & partner bank mortgage financing.</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>48-Hour priority hold deposits & deed transfer legal procedures.</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Private viewing appointments with dedicated property architects.</span>
                </div>
              </div>
            </div>

            {/* Quick Portal Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Shortcuts
              </h3>

              <div className="space-y-2">
                <Link
                  to="/apartments"
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-between transition block"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    Browse Residences Catalogue
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/appointments"
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-between transition block"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Book Private Viewing
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/payments"
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-between transition block"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Payments & Settlements
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* CONVERSATION THREAD & REPLY MODAL                        */}
      {/* ======================================================== */}
      <Modal
        open={!!selectedInquiry}
        onClose={() => {
          setSelectedInquiry(null);
          setReplyText('');
        }}
        title={selectedInquiry?.subject || 'Inquiry Details'}
        size="lg"
      >
        {selectedInquiry && (
          <div className="space-y-5 text-xs">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              {getInquiryStatusBadge(selectedInquiry.status)}
              <span className="font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                {selectedInquiry.category}
              </span>
              <span className="font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                {selectedInquiry.priority} Priority
              </span>
              {selectedInquiry.apartmentTitle && (
                <span className="font-semibold text-slate-600 ml-auto flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  {selectedInquiry.apartmentTitle}
                </span>
              )}
            </div>

            {/* Original Question Bubble */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="font-bold text-slate-900">
                  {selectedInquiry.customerName || user?.name}
                </span>
                <span className="text-[11px] text-slate-400 ml-auto">
                  {timeAgo(selectedInquiry.createdAt)} ({formatDate(selectedInquiry.createdAt)})
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                {selectedInquiry.message}
              </p>
            </div>

            {/* Replies Thread */}
            {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Conversation Thread ({selectedInquiry.replies.length})
                </p>
                {selectedInquiry.replies.map((rep) => (
                  <div
                    key={rep.id}
                    className={`rounded-2xl p-4 ${
                      rep.authorRole === 'customer'
                        ? 'bg-amber-50/60 border border-amber-200/70 ml-4 sm:ml-8'
                        : 'bg-white border border-slate-200 mr-4 sm:mr-8 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          rep.authorRole === 'customer'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {rep.author?.[0] || 'S'}
                      </div>
                      <span className="font-bold text-slate-900">{rep.author}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          rep.authorRole === 'customer'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rep.authorRole}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {timeAgo(rep.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-7 whitespace-pre-wrap">
                      {rep.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Box */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Write a follow-up reply to support..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                className="flex-1 px-3.5 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
              />
              <button
                type="button"
                onClick={handleReply}
                disabled={submittingReply || !replyText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {submittingReply ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}