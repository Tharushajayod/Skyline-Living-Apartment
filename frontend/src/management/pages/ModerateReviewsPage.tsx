import { useMemo, useState, useEffect } from 'react';
import { 
  Star, CheckCircle2, EyeOff, RotateCcw, MessageSquareQuote, 
  Search, Building2, User, Clock, ShieldCheck, ThumbsUp, AlertCircle 
} from 'lucide-react';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Select, Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { reviewService } from '@/shared/services/reviewService';
import { formatDate } from '@/shared/utils/format';
import type { Review } from '@/shared/types';

const tabFilters = ['Pending', 'Published', 'Hidden', 'All'] as const;
type TabFilter = typeof tabFilters[number];

const ratingOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars ★★★★★' },
  { value: '4', label: '4 Stars ★★★★☆' },
  { value: '3', label: '3 Stars ★★★☆☆' },
  { value: '2', label: '2 Stars ★★☆☆☆' },
  { value: '1', label: '1 Star ★☆☆☆☆' },
];

export default function ModerateReviewsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('Pending');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [hideTarget, setHideTarget] = useState<Review | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getAll();
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  async function updateStatus(id: string, status: 'Published' | 'Hidden', msg: string) {
    try {
      const updated = await reviewService.moderate(id, status);
      setList(prev => prev.map(r => r.id === id ? updated : r));
      toast(msg, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to moderate review', 'error');
    }
  }

  function confirmHide() {
    if (!hideTarget) return;
    updateStatus(hideTarget.id, 'Hidden', 'Review hidden from public view');
    setHideTarget(null);
  }

  const counts = useMemo(() => ({
    Pending: list.filter(r => r.status === 'Pending').length,
    Published: list.filter(r => r.status === 'Published').length,
    Hidden: list.filter(r => r.status === 'Hidden').length,
    All: list.length,
  }), [list]);

  const filtered = useMemo(() => {
    return list.filter(r => {
      const matchesTab = activeTab === 'All' || r.status === activeTab;
      const matchesRating = !ratingFilter || r.rating === Number(ratingFilter);
      const matchesSearch = !search ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.apartmentTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.comment.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesRating && matchesSearch;
    });
  }, [list, activeTab, ratingFilter, search]);

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <Star 
            key={n} 
            className={`w-4 h-4 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Community & Feedback
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {counts.All} Total Submissions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Moderate Reviews
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit client ratings and approve authentic resident testimonials before public display.
          </p>
        </div>

        {counts.Pending > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {counts.Pending} feedback submission(s) pending approval
          </div>
        )}
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Custom Status Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto w-full md:w-auto border border-slate-200/70">
          {tabFilters.map((tab) => {
            const count = counts[tab] || 0;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab === 'Pending' ? 'Pending Approval' : tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Rating Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search feedback or reviewer..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={ratingOptions}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reviews Content Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Loading customer feedback...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-12 text-center">
          <EmptyState 
            variant="inbox" 
            title="No reviews in this category" 
            description="Resident reviews submitted online will appear here for audit and public approval." 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((r) => (
            <div 
              key={r.id} 
              className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Property Title, User & Status */}
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      {r.apartmentTitle}
                    </p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">{r.customerName}</p>
                  </div>
                  <Badge variant={statusToVariant(r.status)} size="sm" dot>
                    {r.status}
                  </Badge>
                </div>

                {/* Rating Stars & Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {renderStars(r.rating)}
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(r.createdAt)}
                  </span>
                </div>

                {/* Review Title & Comment */}
                <h4 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition">
                  {r.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                  "{r.comment}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-5 border-t border-slate-100">
                {r.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(r.id, 'Published', 'Review published successfully')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Publish
                  </button>
                )}

                {r.status === 'Published' && (
                  <button
                    type="button"
                    onClick={() => setHideTarget(r)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide from Site
                  </button>
                )}

                {r.status === 'Hidden' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(r.id, 'Published', 'Review restored and published')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore & Publish
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Hide Confirmation Modal */}
      <Modal
        open={!!hideTarget}
        onClose={() => setHideTarget(null)}
        title="Hide Resident Review"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setHideTarget(null)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              icon={<EyeOff className="w-4 h-4" />} 
              onClick={confirmHide}
            >
              Hide Review
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Are you sure you want to hide this review from the public website? The feedback entry will remain in internal records and can be restored at any time.
          </p>

          {hideTarget && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700">{hideTarget.apartmentTitle}</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{hideTarget.title}</p>
              <div className="my-2">{renderStars(hideTarget.rating)}</div>
              <p className="text-xs text-slate-500 line-clamp-3 italic">"{hideTarget.comment}"</p>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}