import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bed, Bath, Maximize, MapPin, Building2, Calendar, Ruler, Home,
  Star, ChevronLeft, ChevronRight, Heart, CalendarCheck, FileText,
  MessageSquare, Send, CheckCircle2, Lock, ArrowLeft, Eye, Clock,
  Sparkles, ShieldCheck, DollarSign, Award, ArrowRight
} from 'lucide-react';
import type { Apartment, Review } from '@/shared/types';
import { apartmentService } from '@/shared/services/apartmentService';
import { reviewService } from '@/shared/services/reviewService';
import { appointmentService } from '@/shared/services/appointmentService';
import { reservationService } from '@/shared/services/reservationService';
import { inquiryService } from '@/shared/services/inquiryService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { useToast } from '@/shared/components/ui/Toast';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Tabs from '@/shared/components/ui/Tabs';
import { Input, Textarea, Select } from '@/shared/components/ui/Form';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import EmptyState from '@/shared/components/ui/EmptyState';
import Modal from '@/shared/components/ui/Modal';

const FACILITY_ICONS: Record<string, string> = {
  'Swimming Pool': '🌊',
  'Gym & Fitness Center': '💪',
  '24/7 Security': '🛡️',
  'Concierge Service': '🛎️',
  'Underground Parking': '🚗',
  'Rooftop Garden': '🌿',
  'Smart Home System': '🏠',
  'Central Air Conditioning': '❄️',
  'Elevator': '🛗',
  'Pet-Friendly': '🐾',
  'Co-working Space': '💼',
  "Children's Playground": '🎪',
  'Yoga Studio': '🧘',
  'Sauna & Spa': '♨️',
  'EV Charging Stations': '⚡',
  'Bicycle Storage': '🚲',
  'Mail Room': '📬',
  'Private Balcony': '🌅',
  'Floor-to-ceiling Windows': '🪟',
  'Panoramic City View': '🏙️',
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function ApartmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginAction, setLoginAction] = useState<'viewing' | 'reservation' | 'inquiry'>('viewing');

  // Modals
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [inquiryModal, setInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const [bookingModal, setBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const [reservationModal, setReservationModal] = useState(false);
  const [submittingReservation, setSubmittingReservation] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setActiveImage(0);
    apartmentService.getById(id).then((data) => {
      if (!active) return;
      setApartment(data);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    reviewService.getByApartment(id).then((data) => {
      if (!active) return;
      setReviews(data);
    }).catch(() => {});
    return () => { active = false; };
  }, [id]);

  const fav = apartment ? isFavorite(apartment.id) : false;

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const requireAuth = (action: 'viewing' | 'reservation' | 'inquiry') => {
    if (!isAuthenticated) {
      setLoginAction(action);
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const handleBookViewing = () => {
    if (!requireAuth('viewing')) return;
    setBookingModal(true);
  };

  const submitBooking = async () => {
    if (!user || !apartment) return;
    if (!bookingDate) {
      toast('Please select a viewing date', 'error');
      return;
    }
    setSubmittingBooking(true);
    try {
      await appointmentService.create({
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '',
        date: bookingDate,
        timeSlot: bookingTime,
        notes: bookingNotes,
      });
      toast('Viewing appointment booked successfully! Our team will confirm your VIP slot.', 'success');
      setBookingModal(false);
      navigate('/appointments');
    } catch (err: any) {
      toast(err.message || 'Failed to book viewing', 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleRequestReservation = () => {
    if (!requireAuth('reservation')) return;
    setReservationModal(true);
  };

  const submitReservation = async () => {
    if (!user || !apartment) return;
    setSubmittingReservation(true);
    const tenPercentFee = Math.round(Number(apartment.price) * 0.1);
    try {
      const createdRes = await reservationService.create({
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        customerName: user.name,
        customerEmail: user.email,
        reservationFee: tenPercentFee,
      });
      toast('Reservation hold placed! Please complete the 10% deposit.', 'success');
      setReservationModal(false);
      navigate('/payments', { state: { autoPayReservationId: createdRes?.id || apartment.id } });
    } catch (err: any) {
      toast(err.message || 'Failed to place reservation', 'error');
    } finally {
      setSubmittingReservation(false);
    }
  };

  const handleSendInquiry = () => {
    if (!requireAuth('inquiry')) return;
    setInquiryModal(true);
  };

  const handleToggleFavorite = () => {
    if (!apartment) return;
    toggleFavorite(apartment.id);
    toast(fav ? 'Removed from saved collection' : 'Saved to private portfolio', 'success');
  };

  const submitReview = async () => {
    if (!user || !apartment) return;
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast('Please fill in all review fields', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewService.create({
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        customerName: user.name,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      toast('Review submitted! It will appear once verified by concierge.', 'success');
      setReviewModal(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitInquiry = async () => {
    if (!user || !apartment) return;
    if (!inquiryForm.message.trim()) {
      toast('Please enter a message', 'error');
      return;
    }
    setSubmittingInquiry(true);
    try {
      await inquiryService.create({
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        customerName: user.name,
        customerEmail: user.email,
        subject: `Inquiry regarding ${apartment.title}`,
        message: inquiryForm.message,
        category: 'General',
        priority: 'Medium',
      });
      toast('Inquiry submitted! A dedicated senior advisor will reach out.', 'success');
      setInquiryModal(false);
      setInquiryForm({ message: '' });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfe] w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="h-[480px] w-full rounded-3xl mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="min-h-screen bg-[#fafbfe] flex items-center justify-center px-4">
        <div className="luxury-glass rounded-3xl border border-white/90 p-10 max-w-md w-full shadow-2xl text-center">
          <EmptyState
            icon={<Home className="w-12 h-12 text-gold-400" />}
            title="Residence Not Located"
            description="The requested apartment may have been acquired or updated in our private catalog."
            action={
              <Link to="/apartments">
                <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md">
                  Return to Residences
                </button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const images = apartment.images && apartment.images.length > 0 
    ? apartment.images 
    : [{ id: '1', url: (apartment as any).imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', caption: apartment.title }];

  const keyFacts = [
    { icon: <Bed className="w-5 h-5" />, label: 'Bedrooms', value: apartment.bedrooms === 0 ? 'Studio Suite' : `${apartment.bedrooms} Master Bedrooms` },
    { icon: <Bath className="w-5 h-5" />, label: 'Bathrooms', value: `${apartment.bathrooms} Luxury Baths` },
    { icon: <Maximize className="w-5 h-5" />, label: 'Floor Area', value: `${apartment.size} m² (${Math.round(apartment.size * 10.764)} sqft)` },
    { icon: <Building2 className="w-5 h-5" />, label: 'Tower Level', value: `Floor ${apartment.floor}` },
    { icon: <Calendar className="w-5 h-5" />, label: 'Completion Year', value: apartment.yearBuilt || '2024' },
    { icon: <Home className="w-5 h-5" />, label: 'Architecture Type', value: apartment.type },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-24 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-[800px] h-[400px] bg-gradient-to-b from-gold-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Breadcrumb Header */}
      <div className="bg-gradient-to-b from-white via-champagne-50/40 to-[#fafbfe] border-b border-gold-200/60 pt-6 pb-5 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <Link to="/apartments" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-gold-700 transition">
            <ArrowLeft className="w-4 h-4 text-gold-600" />
            <span>Back to Luxury Portfolio</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/compare"
              className="text-xs font-bold text-gold-800 bg-gold-50 border border-gold-200 hover:border-gold-300 px-3.5 py-1.5 rounded-xl transition"
            >
              Compare Specs
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        
        {/* Gallery Showcase */}
        <div className="mb-10 animate-fadeInUp">
          <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(180,83,9,0.12)] bg-slate-950 aspect-[16/9] sm:aspect-[21/9] max-h-[580px]">
            <img
              src={images[activeImage]?.url}
              alt={images[activeImage]?.caption}
              className="w-full h-full object-cover transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 shadow-xl transition cursor-pointer text-slate-900"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 shadow-xl transition cursor-pointer text-slate-900"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between text-white">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400 block mb-1">
                  Skyline Signature View
                </span>
                <p className="text-lg sm:text-2xl font-bold font-serif drop-shadow-md">
                  {images[activeImage]?.caption || apartment.title}
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-950/60 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl">
                {activeImage + 1} / {images.length} Photos
              </span>
            </div>
          </div>

          {/* Thumbnail Ribbon */}
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setActiveImage(i)}
                  className={`relative shrink-0 w-28 h-20 rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
                    activeImage === i ? 'border-gold-500 ring-2 ring-gold-400/40 scale-102' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Grid (Full Width Canvas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Title Header Card */}
            <div className="luxury-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-[0_10px_35px_rgba(180,83,9,0.05)] backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-3">
                    <span className="bg-white text-slate-900 border border-slate-200 text-xs font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider shadow-2xs">
                      {apartment.status}
                    </span>
                    {apartment.featured && (
                      <span className="bg-gradient-to-r from-gold-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Signature Release
                      </span>
                    )}
                    {avgRating && (
                      <div className="flex items-center gap-1.5 ml-2 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                        <StarRating rating={Math.round(avgRating)} />
                        <span>({reviews.length} reviews)</span>
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl font-black font-serif text-slate-900 mb-2">
                    {apartment.title}
                  </h1>
                  
                  <p className="text-slate-600 text-sm flex items-center gap-2 font-medium">
                    <MapPin className="w-4 h-4 text-gold-600 shrink-0" />
                    <span>{apartment.address}, {apartment.district}, {apartment.city}</span>
                  </p>
                </div>

                <button
                  onClick={handleToggleFavorite}
                  className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:border-rose-300 transition shadow-sm cursor-pointer"
                  title={fav ? "Remove from saved" : "Save residence"}
                >
                  <Heart className={`w-5 h-5 ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                </button>
              </div>

              {/* Price Strip */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-6 border-t border-gold-100 gap-4">
                <div>
                  <p className="text-[11px] font-extrabold text-gold-700 uppercase tracking-widest mb-1">Total Acquisition Price</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif">
                    {formatCurrency(apartment.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {apartment.buildingName || 'Signature Tower'}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Freehold Title
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="luxury-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-[0_10px_35px_rgba(180,83,9,0.05)] backdrop-blur-xl">
              <Tabs
                tabs={[
                  {
                    label: 'Overview & Amenities',
                    content: (
                      <div className="space-y-8">
                        <div>
                          <h3 className="font-serif font-bold text-slate-900 text-xl mb-3">Architectural Philosophy</h3>
                          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{apartment.description}</p>
                        </div>

                        {/* Included Facilities */}
                        <div className="pt-6 border-t border-gold-100">
                          <h3 className="font-serif font-bold text-slate-900 text-xl mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gold-600" />
                            Private Resident Amenities
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {apartment.facilities.map((facility) => (
                              <div
                                key={facility}
                                className="flex items-center gap-3.5 px-4 py-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-gold-300 transition"
                              >
                                <span className="text-xl shrink-0">
                                  {FACILITY_ICONS[facility] ?? '✨'}
                                </span>
                                <span className="text-xs font-bold text-slate-800">{facility}</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    label: 'Floor Plans & Dimensions',
                    content: (
                      <div className="space-y-6">
                        {apartment.floorPlanUrl ? (
                          <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white p-4 shadow-inner">
                            <img
                              src={apartment.floorPlanUrl}
                              alt="Floor plan schematic"
                              className="w-full object-contain max-h-[500px]"
                            />
                          </div>
                        ) : (
                          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center">
                            <Ruler className="w-12 h-12 text-gold-400 mx-auto mb-2" />
                            <p className="font-bold text-slate-900 text-sm">CAD Floor Plan in Preparation</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Detailed architectural schematics with exact room dimensions are available via VIP viewing appointment.
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: 'Total Volume', value: `${apartment.size} m²` },
                            { label: 'Bedrooms', value: apartment.bedrooms === 0 ? 'Studio' : apartment.bedrooms },
                            { label: 'Bathrooms', value: apartment.bathrooms },
                          ].map((item) => (
                            <div key={item.label} className="text-center p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                              <p className="text-xs text-slate-500 font-bold mb-1">{item.label}</p>
                              <p className="text-xl font-black text-slate-900 font-serif">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  },
                  {
                    label: `Verified Reviews (${reviews.length})`,
                    content: (
                      <div className="space-y-6">
                        {isAuthenticated && (
                          <div className="flex items-center justify-between p-5 bg-gold-50/80 border border-gold-200 rounded-2xl">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">Verified Resident Feedback</p>
                              <p className="text-xs text-slate-600">Provide an authentic evaluation of this tower and unit</p>
                            </div>
                            <button
                              onClick={() => setReviewModal(true)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md"
                            >
                              Write Review
                            </button>
                          </div>
                        )}

                        {reviews.length === 0 ? (
                          <EmptyState
                            variant="inbox"
                            title="No resident reviews yet"
                            description="Be the first verified customer to share an impression of this residence."
                          />
                        ) : (
                          <div className="space-y-3.5">
                            {reviews.map((review) => (
                              <div key={review.id} className="p-5 border border-slate-200/90 rounded-2xl bg-white shadow-2xs">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm font-serif">{review.customerName}</p>
                                    <StarRating rating={review.rating} />
                                  </div>
                                  <span className="text-xs text-slate-400 font-medium">{formatDate(review.createdAt)}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{review.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>

          </div>

          {/* Right Column: Sticky Action Booking Panel & Specifications */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Primary Action Card */}
            <div className="luxury-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-[0_15px_45px_rgba(180,83,9,0.08)] backdrop-blur-xl sticky top-24">
              <p className="text-[11px] font-extrabold text-gold-700 uppercase tracking-widest mb-1">Acquisition Price</p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tabular-nums tracking-tight mb-3">
                {formatCurrency(apartment.price)}
              </p>

              <div className="mb-6">
                {apartment.status === 'Available' ? (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Available for Immediate Hold
                  </span>
                ) : apartment.status === 'Reserved' ? (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600" /> Currently in 48-Hr Hold
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBookViewing}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-gold-600 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-gold-500/25 flex items-center justify-center gap-2 transition duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book Private VIP Viewing</span>
                </button>

                <button
                  onClick={handleRequestReservation}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gold-50/50 text-slate-900 border border-gold-300 font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition duration-300 hover:border-gold-500 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-gold-600" />
                  <span>Place 48-Hour Reservation Hold</span>
                </button>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={handleToggleFavorite}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:border-gold-300 bg-white hover:bg-gold-50/40 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    <span>{fav ? 'Saved' : 'Save Unit'}</span>
                  </button>
                  <button
                    onClick={handleSendInquiry}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:border-gold-300 bg-white hover:bg-gold-50/40 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-4 h-4 text-gold-600" />
                    <span>Inquire</span>
                  </button>
                </div>
              </div>

              {/* Social Proof info */}
              <div className="mt-6 pt-6 border-t border-gold-100/80 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <Eye className="w-3.5 h-3.5 text-gold-600" />
                <span>14 prospective buyers inspected this week</span>
              </div>
            </div>

            {/* Specifications Card */}
            <div className="luxury-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-[0_10px_35px_rgba(180,83,9,0.05)] backdrop-blur-xl">
              <h3 className="font-serif font-bold text-slate-900 text-lg mb-4 pb-3 border-b border-gold-100">
                Residence Specifications
              </h3>
              <dl className="space-y-3.5">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="text-gold-600">{fact.icon}</span>
                      <span>{fact.label}</span>
                    </dt>
                    <dd className="text-xs font-bold text-slate-900">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

          </div>

        </div>
      </div>

      {/* Book Viewing Modal */}
      <Modal
        open={bookingModal}
        onClose={() => setBookingModal(false)}
        title={`VIP Viewing: ${apartment.title}`}
        footer={
          <>
            <button
              onClick={() => setBookingModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={submittingBooking}
              onClick={submitBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{submittingBooking ? 'Confirming...' : 'Confirm VIP Appointment'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-gold-50/70 border border-gold-200/80 rounded-2xl">
            <p className="text-xs font-bold text-slate-900 font-serif">{apartment.title}</p>
            <p className="text-xs text-slate-600">{apartment.address}, {apartment.district}</p>
          </div>
          <Input
            label="Preferred Viewing Date"
            type="date"
            name="bookingDate"
            value={bookingDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setBookingDate(e.target.value)}
          />
          <Select
            label="Preferred Time Slot"
            value={bookingTime}
            onChange={(e) => setBookingTime(e.target.value)}
            options={[
              { value: '10:00 AM', label: '10:00 AM – Morning VIP Slot' },
              { value: '11:30 AM', label: '11:30 AM – Morning VIP Slot' },
              { value: '02:00 PM', label: '02:00 PM – Afternoon VIP Slot' },
              { value: '03:30 PM', label: '03:30 PM – Sunset Architecture Slot' },
              { value: '05:00 PM', label: '05:00 PM – Twilight Skyline Slot' },
            ]}
          />
          <Textarea
            label="Special Requests / Notes"
            name="bookingNotes"
            placeholder="Specify questions, private parking requirements, or architectural focuses…"
            rows={3}
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* Reservation Modal */}
      <Modal
        open={reservationModal}
        onClose={() => setReservationModal(false)}
        title={`Place Hold: ${apartment.title}`}
        footer={
          <>
            <button
              onClick={() => setReservationModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={submittingReservation}
              onClick={submitReservation}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{submittingReservation ? 'Securing...' : 'Place Priority Hold'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-5 bg-gold-50/70 rounded-2xl border border-gold-200">
            <p className="text-xs text-gold-800 font-extrabold uppercase tracking-wider">Total Residence Value</p>
            <p className="text-2xl font-black text-slate-900 font-serif">{formatCurrency(apartment.price)}</p>
            <div className="mt-3 pt-3 border-t border-gold-200 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">Priority 48-Hour Deposit (10%):</span>
              <span className="font-extrabold text-gold-800">{formatCurrency(Math.round(Number(apartment.price) * 0.1))}</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-2xs">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gold-600" />
              48-Hour Protection Protocol:
            </p>
            <p className="text-slate-600 leading-relaxed">
              Once initiated, the unit is locked from other prospective buyers for 48 hours to allow payment slip verification.
            </p>
          </div>
        </div>
      </Modal>

      {/* Inquiry Modal */}
      <Modal
        open={inquiryModal}
        onClose={() => setInquiryModal(false)}
        title={`Direct Concierge Inquiry: ${apartment.title}`}
        footer={
          <>
            <button
              onClick={() => setInquiryModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={submittingInquiry}
              onClick={submitInquiry}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submittingInquiry ? 'Sending...' : 'Transmit Inquiry'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="Inquiry Message"
            name="inquiryMessage"
            placeholder="Ask regarding milestone payment structures, bank partner pre-approvals, title deeds, or private parking…"
            rows={4}
            value={inquiryForm.message}
            onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Login Prompt Modal */}
      <Modal
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Resident Account Required"
      >
        <div className="py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4 text-gold-700 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Please sign in or register to {loginAction === 'viewing' ? 'book a VIP viewing slot' : loginAction === 'reservation' ? 'reserve this residence' : 'transmit a private concierge inquiry'}.
          </p>
          <Link to="/login" state={{ from: `/apartments/${id}` }}>
            <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Proceed to Sign In</span>
            </button>
          </Link>
        </div>
      </Modal>

    </div>
  );
}