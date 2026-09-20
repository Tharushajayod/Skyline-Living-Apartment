import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, Plus, Send, Building2, ShieldCheck, CheckCircle2, 
  Clock, AlertCircle, MessageSquareQuote, ShoppingBag, Sparkles, Loader2 
} from 'lucide-react';
import type { Review, Apartment, Payment } from '@/shared/types';
import { reviewService } from '@/shared/services/reviewService';
import { apartmentService } from '@/shared/services/apartmentService';
import { paymentService } from '@/shared/services/paymentService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/shared/components/ui/Form';
import { formatDate } from '@/shared/utils/format';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl w-fit">
      {Array.from({ length: 5 }).map((_, i) => {
        const starNumber = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starNumber)}
            className="p-1 transition hover:scale-110 cursor-pointer"
          >
            <Star
              className={`w-6 h-6 transition ${
                starNumber <= value
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-200 hover:text-amber-200'
              }`}
            />
          </button>
        );
      })}
      <span className="text-xs font-bold text-slate-700 ml-2">
        {value} of 5 Stars
      </span>
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [apartmentList, setApartmentList] = useState<Apartment[]>([]);
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ apartmentId: '', rating: 5, title: '', comment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.allSettled([
      reviewService.getAll(),
      apartmentService.getAll(),
      paymentService.getByCustomer(user.email),
    ]).then(([revRes, aptRes, payRes]) => {
      if (!mounted) return;
      if (revRes.status === 'fulfilled' && Array.isArray(revRes.value)) {
        // Customer ගේ reviews විතරක් filter කරගන්නවා
        const myReviews = revRes.value.filter(
          r => r.customerName?.toLowerCase() === user.name?.toLowerCase()
        );
        setReviews(myReviews.length > 0 ? myReviews : revRes.value);
      }
      if (aptRes.status === 'fulfilled' && Array.isArray(aptRes.value)) {
        setApartmentList(aptRes.value);
      }
      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value)) {
        setCustomerPayments(payRes.value);
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [user]);

  // Customer සල්ලි ගෙවපු (Verified Payments තියෙන) Apartments විතරක් filter කිරීම
  const purchasedApartments = useMemo(() => {
    if (!customerPayments.length || !apartmentList.length) return [];

    // Verified payments තියෙන apartment titles හෝ ids ගන්නවා
    const paidApartmentTitles = new Set(
      customerPayments
        .filter(p => p.status === 'Verified' || p.status === 'Pending')
        .map(p => p.apartmentTitle?.trim().toLowerCase())
    );

    return apartmentList.filter(apt => 
      paidApartmentTitles.has(apt.title?.trim().toLowerCase())
    );
  }, [customerPayments, apartmentList]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!form.apartmentId) e.apartmentId = 'Please select your purchased residence';
    if (!form.title.trim()) e.title = 'Review headline is required';
    if (!form.comment.trim()) e.comment = 'Detailed feedback is required';
    setErrors(e);
    if (Object.keys(e).length > 0 || !user) return;

    setSubmitting(true);
    try {
      const apt = apartmentList.find(a => a.id === form.apartmentId);
      const created = await reviewService.create({
        apartmentId: form.apartmentId,
        apartmentTitle: apt?.title || '',
        customerName: user.name || 'Resident',
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
      });
      setReviews(prev => [created, ...prev]);
      toast('Review submitted! It will appear on the site once approved by management.', 'success');
      setShowNew(false);
      setForm({ apartmentId: '', rating: 5, title: '', comment: '' });
    } catch (err: any) {
      toast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWriteReview = () => {
    if (purchasedApartments.length === 0) {
      toast('You can only review apartments you have reserved or purchased.', 'warning');
      return;
    }
    // Automatically select the first purchased apartment
    setForm(prev => ({ ...prev, apartmentId: purchasedApartments[0].id }));
    setShowNew(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Resident Testimonials
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {reviews.length} Submitted
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Property Reviews
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Share authentic feedback on your acquired apartments, architectural layouts, and building facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenWriteReview}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>


      {/* Reviews Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-12 text-center">
          <EmptyState 
            icon={<Star className="w-12 h-12 text-amber-400" />} 
            title="No reviews submitted yet" 
            description="You haven't written any reviews yet. Share your experience with the apartments you have purchased or reserved."
            action={
              <button
                type="button"
                onClick={handleOpenWriteReview}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Write Your First Review</span>
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div 
              key={rev.id} 
              className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                <div>
                  <Link 
                    to={`/apartments/${rev.apartmentId}`} 
                    className="font-extrabold text-slate-900 text-base group-hover:text-amber-600 transition flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{rev.apartmentTitle}</span>
                  </Link>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">{rev.title}</h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant={statusToVariant(rev.status)} dot size="sm">
                    {rev.status}
                  </Badge>
                </div>
              </div>

              {/* Star Rating Display */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`} 
                  />
                ))}
                <span className="text-xs font-bold text-slate-600 ml-1.5">
                  {rev.rating}.0 / 5.0
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                "{rev.comment}"
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Verified Resident
                </span>
                <span>Submitted on {formatDate(rev.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* WRITE A REVIEW MODAL (ONLY PURCHASED APARTMENTS)          */}
      {/* ========================================================= */}
      <Modal 
        open={showNew} 
        onClose={() => setShowNew(false)} 
        title="Write a Property Review" 
        size="lg" 
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          
          {/* Purchased Property Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Select Your Purchased Residence *
            </label>
            <Select 
              value={form.apartmentId} 
              onChange={(e) => setForm({ ...form, apartmentId: e.target.value })} 
              placeholder="Choose from your verified properties..." 
              options={purchasedApartments.map(a => ({ 
                value: a.id, 
                label: `Verified Unit: ${a.title} (${a.buildingName})` 
              }))} 
              error={errors.apartmentId} 
            />
            {purchasedApartments.length === 0 && (
              <p className="text-xs text-rose-600 mt-1">
                No verified purchase records found under your account.
              </p>
            )}
          </div>

          {/* Interactive Star Picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Overall Experience Rating *
            </label>
            <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>

          <Input 
            label="Review Headline / Summary" 
            placeholder="e.g. Masterful finish, peaceful ambient lighting" 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            error={errors.title} 
          />

          <Textarea 
            label="Detailed Experience Feedback" 
            rows={4} 
            placeholder="Describe unit soundproofing, panoramic views, concierge quality, and facilities..." 
            value={form.comment} 
            onChange={(e) => setForm({ ...form, comment: e.target.value })} 
            error={errors.comment} 
          />

        </div>
      </Modal>

    </div>
  );
}