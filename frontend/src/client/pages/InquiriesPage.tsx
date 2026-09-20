import { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Send, Tag, Flag, Clock, 
  HelpCircle, ChevronRight, User, Building2, MessageCircle
} from 'lucide-react';
import type { Inquiry, InquiryCategory, InquiryPriority, Apartment } from '@/shared/types';
import { inquiryService } from '@/shared/services/inquiryService';
import { apartmentService } from '@/shared/services/apartmentService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/shared/components/ui/Form';
import { timeAgo } from '@/shared/utils/format';

export default function InquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [apartmentList, setApartmentList] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [form, setForm] = useState({ subject: '', message: '', category: 'General', priority: 'Medium', apartmentId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user?.email) {
      setLoading(false);
      return;
    }
    Promise.allSettled([
      inquiryService.getByCustomer(user.email),
      apartmentService.getAll(),
    ]).then(([inqRes, aptRes]) => {
      if (!mounted) return;
      if (inqRes.status === 'fulfilled') setInquiries(inqRes.value);
      if (aptRes.status === 'fulfilled') setApartmentList(aptRes.value);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [user]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;
    setSubmitting(true);
    try {
      const apt = apartmentList.find(a => (a.id || (a as any)._id) === form.apartmentId);
      const newInq = await inquiryService.create({
        apartmentId: form.apartmentId || null,
        apartmentTitle: apt?.title || null,
        customerName: user.name,
        customerEmail: user.email,
        subject: form.subject,
        message: form.message,
        category: form.category as InquiryCategory,
        priority: form.priority as InquiryPriority,
      });
      setInquiries(prev => [newInq, ...prev]);
      toast('Inquiry submitted successfully', 'success');
      setShowNew(false);
      setForm({ subject: '', message: '', category: 'General', priority: 'Medium', apartmentId: '' });
    } catch (err: any) {
      toast(err.message || 'Failed to submit inquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedInquiry || !user) return;
    try {
      const updated = await inquiryService.addReply(selectedInquiry.id, {
        author: user.name,
        authorRole: 'customer',
        message: replyText.trim(),
      });
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updated : i));
      setSelectedInquiry(updated);
      setReplyText('');
      toast('Reply sent', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to send reply', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                Client Support
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-amber-500" />
                Inquiries & Questions
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Submit questions regarding apartments, pricing, and track replies from our sales team.
              </p>
            </div>
            <Button 
              onClick={() => setShowNew(true)} 
              icon={<Plus className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20 py-2.5 px-5"
            >
              New Inquiry
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-12 text-center">
            <EmptyState 
              variant="inbox" 
              title="No inquiries found" 
              description="Have questions about a property or payment schedules? Submit an inquiry and our property concierge will get in touch." 
              action={
                <Button 
                  onClick={() => setShowNew(true)} 
                  icon={<Plus className="w-4 h-4" />}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20 mt-2"
                >
                  Submit Your First Inquiry
                </Button>
              } 
            />
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <div 
                key={inq.id} 
                onClick={() => setSelectedInquiry(inq)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 text-amber-700 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition truncate">
                        {inq.subject}
                      </h3>
                      {inq.apartmentTitle && (
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {inq.apartmentTitle}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {inq.message}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant={statusToVariant(inq.status)} dot size="sm">{inq.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition hidden sm:block" />
                  </div>
                </div>

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
                    <span className="ml-auto font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      {inq.replies.length} {inq.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Inquiry Modal */}
      <Modal 
        open={showNew} 
        onClose={() => setShowNew(false)} 
        title="Submit New Inquiry" 
        size="lg" 
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNew(false)} className="border-slate-200 text-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              loading={submitting} 
              icon={<Send className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
            >
              Submit Inquiry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Inquiry Subject" 
            placeholder="e.g. Inquiring about payment plan for Skyline Penthouse" 
            value={form.subject} 
            onChange={(e) => setForm({ ...form, subject: e.target.value })} 
            error={errors.subject} 
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Inquiry Category" 
              value={form.category} 
              onChange={(e) => setForm({ ...form, category: e.target.value })} 
              options={[
                { value: 'Pricing', label: 'Pricing & Discounts' }, 
                { value: 'Availability', label: 'Unit Availability' },
                { value: 'Viewing', label: 'Private Viewing' }, 
                { value: 'Financing', label: 'Bank Loan / Financing' },
                { value: 'General', label: 'General Inquiry' },
              ]} 
            />
            <Select 
              label="Priority Level" 
              value={form.priority} 
              onChange={(e) => setForm({ ...form, priority: e.target.value })} 
              options={[
                { value: 'Low', label: 'Low' }, 
                { value: 'Medium', label: 'Medium' }, 
                { value: 'High', label: 'High Priority' },
              ]} 
            />
          </div>
          <Select 
            label="Related Residence (Optional)" 
            value={form.apartmentId} 
            onChange={(e) => setForm({ ...form, apartmentId: e.target.value })} 
            placeholder="Select a property or leave empty" 
            options={apartmentList.map(a => ({ value: a.id || (a as any)._id, label: a.title }))} 
          />
          <Textarea 
            label="Detailed Message" 
            rows={5} 
            placeholder="Explain your requirements, questions or requested documents in detail…" 
            value={form.message} 
            onChange={(e) => setForm({ ...form, message: e.target.value })} 
            error={errors.message} 
          />
        </div>
      </Modal>

      {/* View & Reply Modal */}
      <Modal 
        open={!!selectedInquiry} 
        onClose={() => { setSelectedInquiry(null); setReplyText(''); }} 
        title={selectedInquiry?.subject || 'Inquiry Details'} 
        size="lg"
      >
        {selectedInquiry && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <Badge variant={statusToVariant(selectedInquiry.status)} dot size="sm">{selectedInquiry.status}</Badge>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                {selectedInquiry.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                {selectedInquiry.priority} Priority
              </span>
              {selectedInquiry.apartmentTitle && (
                <span className="text-xs font-semibold text-slate-500 ml-auto flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  {selectedInquiry.apartmentTitle}
                </span>
              )}
            </div>

            {/* Original Customer Inquiry */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-900">{selectedInquiry.customerName || user?.name}</span>
                <span className="text-[11px] text-slate-400 ml-auto">{timeAgo(selectedInquiry.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-normal">{selectedInquiry.message}</p>
            </div>

            {/* Replies Thread */}
            {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Conversation Thread</p>
                {selectedInquiry.replies.map(rep => (
                  <div 
                    key={rep.id} 
                    className={`rounded-2xl p-4 ${
                      rep.authorRole === 'customer' 
                        ? 'bg-amber-50/60 border border-amber-200/70 ml-6 sm:ml-10' 
                        : 'bg-white border border-slate-200 mr-6 sm:mr-10 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        rep.authorRole === 'customer' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-white'
                      }`}>
                        {rep.author?.[0] || 'S'}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{rep.author}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        rep.authorRole === 'customer' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rep.authorRole}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(rep.createdAt)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-7">{rep.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Box */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Input 
                placeholder="Write a reply to support team…" 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleReply()} 
                className="flex-1"
              />
              <Button 
                onClick={handleReply} 
                icon={<Send className="w-4 h-4" />}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 px-4"
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}