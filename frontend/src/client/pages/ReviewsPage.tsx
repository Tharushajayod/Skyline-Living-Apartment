import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star, Plus, Send, Building2,
  Search, ArrowUpDown, MessageSquareQuote,
  Sparkles, Loader2, RefreshCw, User, Users,
  Home, ChevronDown, CheckCircle2, SlidersHorizontal,
  ThumbsUp, ShieldCheck
} from 'lucide-react';
import type { Review, EligibleApartment } from '@/shared/types';
import { reviewService } from '@/shared/services/reviewService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/shared/components/ui/Form';
import { formatDate, initials } from '@/shared/utils/format';

// Lightweight scroll reveal wrapper
function RevealOnScroll({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: '650ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all ${isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5 pointer-events-none'
        } ${className}`}
    >
      {children}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl w-fit">
      {Array.from({ length: 5 }).map((_, i) => {
        const starNumber = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starNumber)}
            className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${starNumber <= value
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

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
        />
      ))}
    </div>
  );
}

function formatSafeName(name?: string): string {
  if (!name || !name.trim()) return 'Resident';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  }
  return parts[0];
}

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [publicReviews, setPublicReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [eligibleApartments, setEligibleApartments] = useState<EligibleApartment[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ apartmentId: '', rating: 5, title: '', comment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const publicData = await reviewService.getPublic();
      const approvedOnly = Array.isArray(publicData)
        ? publicData.filter(
          (r) =>
            r.status?.toUpperCase() === 'PUBLISHED' ||
            r.status?.toUpperCase() === 'APPROVED' ||
            !r.status
        )
        : [];
      setPublicReviews(approvedOnly);

      if (isAuthenticated) {
        setLoadingEligible(true);
        try {
          const [userReviews, eligible] = await Promise.all([
            reviewService.getAll(),
            reviewService.getEligibleApartments(),
          ]);
          if (Array.isArray(userReviews)) {
            const myFiltered = user?.name
              ? userReviews.filter((r) => r.customerName?.toLowerCase() === user.name?.toLowerCase())
              : userReviews;
            setMyReviews(myFiltered.length > 0 ? myFiltered : userReviews);
          }
          if (Array.isArray(eligible)) {
            setEligibleApartments(eligible);
          }
        } catch (e) {
          console.error('Failed to load user reviews or eligible apartments:', e);
          if (user?.name) {
            setMyReviews(approvedOnly.filter((r) => r.customerName?.toLowerCase() === user.name?.toLowerCase()));
          }
        } finally {
          setLoadingEligible(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setFetchError('Unable to load customer reviews at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, user]);

  const currentPool = useMemo(() => {
    return activeTab === 'my' ? myReviews : publicReviews;
  }, [activeTab, myReviews, publicReviews]);

  const stats = useMemo(() => {
    const total = publicReviews.length;
    if (total === 0) {
      return { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const sum = publicReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const average = (sum / total).toFixed(1);

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    publicReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating || 5));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return { average: Number(average), total, distribution };
  }, [publicReviews]);

  const filteredReviews = useMemo(() => {
    return currentPool
      .filter((r) => {
        if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = r.title?.toLowerCase().includes(q);
          const matchComment = r.comment?.toLowerCase().includes(q);
          const matchApt = r.apartmentTitle?.toLowerCase().includes(q);
          const matchAuthor = r.customerName?.toLowerCase().includes(q);
          if (!matchTitle && !matchComment && !matchApt && !matchAuthor) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'lowest') return (a.rating || 0) - (b.rating || 0);
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [currentPool, ratingFilter, searchQuery, sortBy]);

  const handleOpenWriteReview = (targetApartmentId?: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (eligibleApartments.length === 0) {
      toast('You can write reviews for residences you have reserved or purchased.', 'warning');
      return;
    }

    if (targetApartmentId) {
      const target = eligibleApartments.find((a) => (a.apartmentId || a.id) === targetApartmentId);
      if (target?.hasReviewed) {
        toast('You have already reviewed this apartment.', 'info');
        return;
      }
      const actualId = target ? (target.apartmentId || target.id) : targetApartmentId;
      setForm((prev) => ({ ...prev, apartmentId: actualId }));
      setErrors({});
      setShowNew(true);
      return;
    }

    const firstAvailable = eligibleApartments.find((a) => !a.hasReviewed);
    if (!firstAvailable) {
      toast('You have already reviewed all your eligible residences.', 'info');
      return;
    }

    const firstId = firstAvailable.apartmentId || firstAvailable.id;
    setForm((prev) => ({ ...prev, apartmentId: firstId }));
    setErrors({});
    setShowNew(true);
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    const selectedAptId = form.apartmentId?.trim();
    if (!selectedAptId || selectedAptId === 'undefined' || selectedAptId === 'null') {
      e.apartmentId = 'Please select your residence';
    }
    if (!form.title.trim()) e.title = 'Review headline is required';
    if (!form.comment.trim()) e.comment = 'Detailed feedback is required';
    setErrors(e);
    if (Object.keys(e).length > 0 || !user) return;

    const selected = eligibleApartments.find((a) => (a.apartmentId || a.id) === selectedAptId);
    if (selected?.hasReviewed) {
      toast('You have already reviewed this apartment.', 'info');
      setShowNew(false);
      return;
    }

    setSubmitting(true);
    try {
      const created = await reviewService.create({
        apartmentId: selectedAptId,
        apartmentTitle: selected?.apartmentTitle || selected?.title || '',
        customerName: user.name || 'Resident',
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
      });
      setMyReviews((prev) => [created, ...prev]);
      setEligibleApartments((prev) =>
        prev.map((a) =>
          (a.apartmentId || a.id) === selectedAptId
            ? {
              ...a,
              hasReviewed: true,
              existingReviewId: created.id,
              existingReviewStatus: created.status || 'PENDING_REVIEW',
              existingReviewRating: created.rating,
              existingReviewTitle: created.title,
              existingReviewComment: created.comment,
            }
            : a
        )
      );
      toast('Review submitted! It will appear publicly once approved by moderation.', 'success');
      setShowNew(false);
      setForm({ apartmentId: '', rating: 5, title: '', comment: '' });
      setActiveTab('my');
    } catch (err: any) {
      toast(err.message || 'Unable to submit your review. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-24 font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* Top Hero / Header Section with Integrated Rating Details */}
      <div className="bg-white border-b border-slate-200/80 pt-10 pb-9 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90 text-slate-300" />
            <span className="text-slate-700 font-semibold">Property Reviews</span>
          </div>

          {/* Two-Column Header Composition */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">

            {/* Left Side: Title, Description & Action */}
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Property Reviews
              </h1>


              {/* Action Button - Only When Authenticated */}
              {isAuthenticated && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenWriteReview()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Write a Review</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Side: Integrated Rating Details (No Card Box, Clean Whitespace) */}
            {!loading && stats.total > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center lg:items-end gap-6 sm:gap-8 lg:gap-10 shrink-0">

                {/* Score & Stars Block */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight tabular-nums">
                      {stats.average}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
                  </div>

                  <div className="flex items-center gap-1 my-1.5">
                    <StarRating rating={Math.round(stats.average)} size="md" />
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    <span className="font-bold text-slate-800">{stats.total}</span> {stats.total === 1 ? 'Review' : 'Reviews'}
                  </p>
                </div>

                {/* Subtle Micro-Distribution Bars */}
                <div className="w-48 sm:w-56 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star] || 0;
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2.5 text-xs select-none">
                        <span className="w-6 font-bold text-slate-600 flex items-center gap-0.5 text-[11px] shrink-0">
                          <span>{star}</span>
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        </span>

                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <span className="w-8 text-right font-medium text-slate-400 text-[11px] shrink-0 tabular-nums">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">

        {/* Toolbar & Filter Bar */}
        <div className="space-y-4 mb-8">

          {/* Tabs for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Reviews</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600'
                    }`}
                >
                  {publicReviews.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'my'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Reviews</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'my' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600'
                    }`}
                >
                  {myReviews.length}
                </span>
              </button>
            </div>
          )}

          {/* Eligible Residences for Review Section (When on 'My Reviews' Tab) */}
          {isAuthenticated && activeTab === 'my' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>Eligible Residences for Review</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                      {eligibleApartments.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    You can write reviews for residences you have reserved or purchased.
                  </p>
                </div>

                {eligibleApartments.some((a) => !a.hasReviewed) && (
                  <button
                    type="button"
                    onClick={() => handleOpenWriteReview()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer self-start sm:self-auto shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Write Review</span>
                  </button>
                )}
              </div>

              {loadingEligible ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 bg-slate-50 rounded-2xl border border-slate-200/80 animate-pulse" />
                  ))}
                </div>
              ) : eligibleApartments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center max-w-md mx-auto">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700">No Eligible Residences Found</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    You can write reviews for residences you have reserved or purchased. Once an apartment hold is placed or full payment is verified, it will appear here.
                  </p>
                  <Link
                    to="/apartments"
                    className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 underline"
                  >
                    Explore Residences
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {eligibleApartments.map((apt) => {
                    const isPurchased = apt.relationshipType === 'PURCHASED';
                    const aptId = apt.apartmentId || apt.id;
                    const aptTitle = apt.apartmentTitle || apt.title;
                    return (
                      <div
                        key={aptId}
                        className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image & Status Badge */}
                          <div className="relative h-36 bg-slate-100 overflow-hidden group">
                            <img
                              src={apt.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                              alt={aptTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-md ${isPurchased
                                    ? 'bg-emerald-600/90 text-white'
                                    : 'bg-amber-600/90 text-white'
                                  }`}
                              >
                                {isPurchased ? (
                                  <ShieldCheck className="w-3 h-3 text-white" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                )}
                                <span>{isPurchased ? 'Purchased' : 'Reserved'}</span>
                              </span>
                            </div>

                            {apt.hasReviewed && (
                              <div className="absolute top-2.5 right-2.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900/85 text-white backdrop-blur-md shadow-xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Reviewed</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Body Content */}
                          <div className="p-4">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                {apt.buildingName || 'Skyline Tower'} {apt.unitNumber || apt.apartmentNumber ? `• Unit ${apt.unitNumber || apt.apartmentNumber}` : ''}
                              </p>
                              {apt.floor !== undefined && apt.floor !== null && (
                                <span className="text-[10px] text-slate-400 font-medium">Floor {apt.floor}</span>
                              )}
                            </div>

                            <Link
                              to={`/apartments/${aptId}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-600 transition block truncate"
                            >
                              {aptTitle}
                            </Link>

                            <p className="text-[11px] text-slate-500 mt-1">
                              {isPurchased
                                ? 'Completed full payment sale agreement'
                                : 'Active 4-day reservation hold'}
                            </p>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 pt-0">
                          {apt.hasReviewed ? (
                            <div className="w-full py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Already Reviewed</span>
                              </div>
                              {apt.existingReviewRating && (
                                <div className="flex items-center gap-0.5 text-xs font-bold text-slate-800">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{apt.existingReviewRating}.0</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenWriteReview(aptId)}
                              className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                              <span>Write Review</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section Heading for Submitted Reviews when in 'My Reviews' tab */}
          {isAuthenticated && activeTab === 'my' && (
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                My Submitted Reviews ({myReviews.length})
              </h3>
            </div>
          )}

          {/* Search, Star Filter & Sort Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">

            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  activeTab === 'my'
                    ? 'Search within your reviews...'
                    : 'Search by apartment title, headline, or keywords...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition placeholder-slate-400"
              />
            </div>

            {/* Star Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRatingFilter('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${ratingFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                All Stars
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingFilter(s)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${ratingFilter === s
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <span>{s}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-amber-500 transition cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

          </div>
        </div>

        {/* Review Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl border border-slate-200/80 p-6 animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-3xl border border-rose-200/80 shadow-2xs p-12 text-center max-w-lg mx-auto">
            <p className="text-rose-600 font-semibold mb-4 text-xs sm:text-sm">{fetchError}</p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-12 sm:p-16 text-center max-w-lg mx-auto">
            <EmptyState
              icon={<MessageSquareQuote className="w-12 h-12 text-amber-500" />}
              title={
                activeTab === 'my'
                  ? 'You haven’t submitted any reviews yet'
                  : publicReviews.length === 0
                    ? 'No reviews have been published yet'
                    : 'No matching reviews found'
              }
              description={
                activeTab === 'my'
                  ? 'Share your authentic experience with the residences you have reserved or purchased.'
                  : publicReviews.length === 0
                    ? 'Check back later for resident impressions and feedback.'
                    : 'Try adjusting your search query or star rating filter.'
              }
              action={
                isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleOpenWriteReview()}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Write a Review</span>
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {filteredReviews.map((rev, idx) => {
              const authorDisplayName = formatSafeName(rev.customerName);
              const authorInitials = initials(rev.customerName || 'Resident');
              const isMyReview =
                activeTab === 'my' ||
                (user?.name && rev.customerName?.toLowerCase() === user.name.toLowerCase());

              return (
                <RevealOnScroll key={rev.id || idx} delay={idx * 50}>
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group h-full">

                    {/* Header: Author Info & Rating */}
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar Initials */}
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 tracking-wider">
                            {authorInitials}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {authorDisplayName}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {formatDate(rev.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80">
                            <StarRating rating={rev.rating || 5} />
                            <span className="text-xs font-bold text-slate-800 ml-0.5 tabular-nums">
                              {rev.rating}.0
                            </span>
                          </div>

                          {isMyReview && rev.status && (
                            <div className="mt-1.5">
                              <Badge variant={statusToVariant(rev.status)} size="sm" dot>
                                {rev.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Link if available */}
                      {rev.apartmentTitle && (
                        <div className="mb-2.5">
                          {rev.apartmentId ? (
                            <Link
                              to={`/apartments/${rev.apartmentId}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-600 transition group/link"
                            >
                              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{rev.apartmentTitle}</span>
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{rev.apartmentTitle}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Headline */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug">
                        {rev.title}
                      </h3>

                      {/* Comment */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Resident</span>
                      </span>
                    </div>

                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        )}

      </div>

      {/* Write a Review Modal */}
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
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Submit Review</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Your Eligible Residence *
            </label>
            <Select
              value={form.apartmentId}
              onChange={(e) => {
                const chosenId = e.target.value;
                const chosen = eligibleApartments.find((a) => (a.apartmentId || a.id) === chosenId);
                if (chosen?.hasReviewed) {
                  toast('You have already reviewed this apartment.', 'info');
                  return;
                }
                setForm((prev) => ({ ...prev, apartmentId: chosenId }));
              }}
              placeholder="Choose from your verified properties..."
              options={eligibleApartments.map((a) => {
                const aId = a.apartmentId || a.id;
                const aTitle = a.apartmentTitle || a.title;
                const relLabel = a.relationshipLabel || (a.relationshipType === 'PURCHASED' ? 'Purchased' : 'Reserved');
                return {
                  value: aId,
                  label: `${aTitle} (${relLabel})${a.hasReviewed ? ' — Already Reviewed' : ''}`,
                };
              })}
              error={errors.apartmentId}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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