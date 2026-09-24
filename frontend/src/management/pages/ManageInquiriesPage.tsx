import { useMemo, useState, useEffect } from 'react';
import {
  Search, Eye, Send, MessageSquare, User, Clock, Building2,
  CheckCircle2, AlertCircle, MessageCircle, ChevronRight, Sparkles, Filter
} from 'lucide-react';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/shared/contexts/AuthContext';
import { inquiryService } from '@/shared/services/inquiryService';
import { formatDateTime, timeAgo } from '@/shared/utils/format';
import type { Inquiry, InquiryCategory, InquiryPriority, InquiryStatus } from '@/shared/types';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
];
const categoryOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'Pricing', label: 'Pricing & Terms' },
  { value: 'Availability', label: 'Unit Availability' },
  { value: 'Viewing', label: 'Private Viewings' },
  { value: 'Financing', label: 'Bank Financing' },
  { value: 'General', label: 'General Questions' },
];
const priorityOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'High', label: 'High Priority' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export default function ManageInquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const cached = inquiryService.getCachedAll();
  const [list, setList] = useState<Inquiry[]>(() => (Array.isArray(cached) ? cached : []));
  const [loading, setLoading] = useState(!cached || cached.length === 0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [detailTarget, setDetailTarget] = useState<Inquiry | null>(null);
  const [reply, setReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchInquiries = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await inquiryService.getAll();
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries(!cached || cached.length === 0);
  }, []);

  const counts = useMemo(() => ({
    total: list.length,
    pending: list.filter(i => i.status === 'Pending').length,
    inProgress: list.filter(i => i.status === 'In Progress').length,
    resolved: list.filter(i => i.status === 'Resolved').length,
  }), [list]);

  const filtered = useMemo(() => {
    return list.filter(i => {
      const matchesSearch = !search ||
        i.subject.toLowerCase().includes(search.toLowerCase()) ||
        i.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (i.apartmentTitle && i.apartmentTitle.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || i.status === statusFilter;
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      const matchesPriority = !priorityFilter || i.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [list, search, statusFilter, categoryFilter, priorityFilter]);

  async function updateStatus(id: string, status: InquiryStatus, msg: string) {
    try {
      const updated = await inquiryService.updateStatus(id, status);
      setList(prev => prev.map(i => i.id === id ? updated : i));
      if (detailTarget?.id === id) setDetailTarget(updated);
      toast(msg, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  }

  async function sendReply() {
    if (!detailTarget || !reply.trim()) {
      toast('Please enter a reply message', 'error');
      return;
    }
    setSubmittingReply(true);
    try {
      const updated = await inquiryService.addReply(detailTarget.id, {
        author: user?.name || 'Staff Member',
        authorRole: user?.role || 'staff',
        message: reply.trim(),
      });
      setList(prev => prev.map(i => i.id === detailTarget.id ? updated : i));
      setDetailTarget(updated);
      setReply('');
      toast('Reply dispatched to customer', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to send reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Customer Concierge
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {counts.total} Total Questions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Inquiries
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit client questions, provide pricing consultations, and maintain support threads.
          </p>
        </div>

        {counts.pending > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {counts.pending} client question(s) awaiting response
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input 
          placeholder="Search by subject, customer, or unit..." 
          icon={<Search className="w-4 h-4 text-slate-400" />} 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <Select 
          options={statusOptions} 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
        />
        <Select 
          options={categoryOptions} 
          value={categoryFilter} 
          onChange={e => setCategoryFilter(e.target.value)} 
        />
        <Select 
          options={priorityOptions} 
          value={priorityFilter} 
          onChange={e => setPriorityFilter(e.target.value)} 
        />
      </div>

      {/* Main Inquiries Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            Loading client inquiries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState 
              variant="search" 
              title="No inquiries found" 
              description="No customer inquiries match the current search or filter criteria." 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3.5">Inquiry & Residence</th>
                  <th className="px-5 py-3.5">Client & Date</th>
                  <th className="px-5 py-3.5">Category & Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(i => (
                  <tr 
                    key={i.id} 
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group" 
                    onClick={() => setDetailTarget(i)}
                  >
                    {/* 1. Subject & Property */}
                    <td className="px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition truncate max-w-xs sm:max-w-md">
                          {i.subject}
                        </p>
                        {i.apartmentTitle && (
                          <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            {i.apartmentTitle}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 2. Customer & Date */}
                    <td className="px-5 py-3.5">
                      <p className="font-extrabold text-slate-900 text-sm">{i.customerName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        {timeAgo(i.createdAt)}
                      </p>
                    </td>

                    {/* 3. Category & Priority */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {i.category}
                        </span>
                        <Badge variant={statusToVariant(i.priority)} size="sm">
                          {i.priority}
                        </Badge>
                      </div>
                    </td>

                    {/* 4. Status */}
                    <td className="px-5 py-3.5">
                      <Badge variant={statusToVariant(i.status)} size="sm" dot>
                        {i.status}
                      </Badge>
                    </td>

                    {/* 5. Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {i.replies && i.replies.length > 0 && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {i.replies.length}
                          </span>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDetailTarget(i); }} 
                          className="p-2 text-slate-400 group-hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer border border-transparent hover:border-amber-200" 
                          title="View and Reply to Inquiry"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail & Live Thread Modal */}
      <Modal
        open={!!detailTarget}
        onClose={() => { setDetailTarget(null); setReply(''); }}
        title={detailTarget?.subject || "Inquiry Conversation"}
        size="lg"
        footer={
          detailTarget && (
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                {detailTarget.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(detailTarget.id, 'In Progress', 'Inquiry marked as in progress')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Mark In Progress
                  </button>
                )}
                {detailTarget.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(detailTarget.id, 'Resolved', 'Inquiry marked as resolved')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                )}
              </div>
              <Button variant="outline" onClick={() => { setDetailTarget(null); setReply(''); }}>
                Close
              </Button>
            </div>
          )
        }
      >
        {detailTarget && (
          <div className="space-y-5">
            
            {/* Meta Header */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <Badge variant={statusToVariant(detailTarget.status)} size="sm" dot>{detailTarget.status}</Badge>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                {detailTarget.category}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                {detailTarget.priority} Priority
              </span>
              {detailTarget.apartmentTitle && (
                <span className="text-xs font-bold text-amber-700 ml-auto flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {detailTarget.apartmentTitle}
                </span>
              )}
            </div>

            {/* Original Customer Question */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                  {detailTarget.customerName?.[0] || 'C'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{detailTarget.customerName}</span>
                  <span className="text-[10px] text-slate-400 block">{formatDateTime(detailTarget.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-normal pl-9">
                {detailTarget.message}
              </p>
            </div>

            {/* Response Thread */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                Conversation History ({detailTarget.replies.length})
              </p>
              
              {detailTarget.replies.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                  No replies recorded yet. Submit the first staff response below.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {detailTarget.replies.map((r) => {
                    const isStaff = r.authorRole === 'staff' || r.authorRole === 'admin';
                    return (
                      <div 
                        key={r.id} 
                        className={`rounded-2xl p-3.5 border ${
                          isStaff 
                            ? 'bg-amber-50/70 border-amber-200/80 ml-6 sm:ml-10' 
                            : 'bg-white border-slate-200 mr-6 sm:mr-10 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isStaff ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-white'
                          }`}>
                            {r.author?.[0] || 'S'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{r.author}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded capitalize ${
                            isStaff ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.authorRole}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(r.createdAt)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-7">{r.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply Input Box */}
            <div className="border-t border-slate-100 pt-4">
              <Textarea
                label="Dispatch Staff Response"
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Compose a clear response regarding property specifications, payment terms, or scheduling..."
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={submittingReply}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}