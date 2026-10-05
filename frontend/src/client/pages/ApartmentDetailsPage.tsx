import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bed, Bath, Maximize, MapPin, Building2, Calendar, Ruler, Home,
  Star, ChevronLeft, ChevronRight, Heart, CalendarCheck, FileText,
  MessageSquare, Send, CheckCircle2, Lock, ArrowLeft, Eye, Clock,
  Sparkles, ShieldCheck, DollarSign, Award, ArrowRight
} from 'lucide-react';
import type { Apartment, Appointment, Review, ReviewEligibility } from '@/shared/types';
import { apartmentService } from '@/shared/services/apartmentService';
import { reviewService } from '@/shared/services/reviewService';
import { appointmentService } from '@/shared/services/appointmentService';
import { reservationService } from '@/shared/services/reservationService';
import { inquiryService } from '@/shared/services/inquiryService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { useToast } from '@/shared/components/ui/Toast';
import { formatCurrency, formatDate, getTodayDateString, isPastDate, getAvailableTimeSlots, ALL_VIEWING_TIME_SLOTS, getFriendlyErrorMessage } from '@/shared/utils/format';
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
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginAction, setLoginAction] = useState<'viewing' | 'reservation' | 'inquiry'>('viewing');

  // Modals
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [inquiryModal, setInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const todayStr = getTodayDateString();
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTime, setBookingTime] = useState('10:00 AM - 11:00 AM');
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
    }).catch(() => { });

    if (isAuthenticated) {
      reviewService.checkEligibility(id).then((data) => {
        if (!active) return;
        setReviewEligibility(data);
      }).catch(() => {
        if (!active) return;
        setReviewEligibility(null);
      });
    } else {
      setReviewEligibility(null);
    }

    return () => { active = false; };
  }, [id, isAuthenticated]);

  const isSold = (apartment?.status || '').toLowerCase() === 'sold';
  const isReserved = (apartment?.status || '').toLowerCase() === 'reserved';

  const fav = apartment ? isFavorite(apartment.id) : false;

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const ALL_TIME_SLOTS = useMemo(() => [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
  ], []);

  const availableBookingSlots = useMemo(() => {
    return getAvailableTimeSlots(bookingDate, ALL_VIEWING_TIME_SLOTS);
  }, [bookingDate]);

  useEffect(() => {
    if (availableBookingSlots.length > 0 && !availableBookingSlots.includes(bookingTime)) {
      setBookingTime(availableBookingSlots[0]);
    }
  }, [availableBookingSlots, bookingTime]);

  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user?.email) {
      appointmentService.getByCustomer(user.email).then((data) => {
        if (Array.isArray(data)) setUserAppointments(data);
      }).catch(() => { });
    }
  }, [user?.email]);

  const relevantAppointment = useMemo(() => {
    if (!apartment || !userAppointments.length) return null;
    return userAppointments.find(
      (a) => a.apartmentId === apartment.id || a.apartmentId === id
    ) || null;
  }, [apartment, id, userAppointments]);

  const hasCompletedTour = relevantAppointment?.status === 'Completed';
  const hasScheduledTour = relevantAppointment && ['Pending', 'Approved', 'Rescheduled'].includes(relevantAppointment.status);

  const requireAuth = (action: 'viewing' | 'reservation' | 'inquiry') => {
    if (!isAuthenticated) {
      setLoginAction(action);
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const handleBookViewing = () => {
    if (isSold) return;
    if (!requireAuth('viewing')) return;
    setBookingModal(true);
  };

  const submitBooking = async () => {
    if (!user || !apartment || isSold) return;
    if (!bookingDate) {
      toast('Please select an appointment date', 'error');
      return;
    }
    if (isPastDate(bookingDate)) {
      toast('Appointment date cannot be in the past.', 'error');
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
      toast(getFriendlyErrorMessage(err, 'Unable to create the appointment. Please check the details and try again.'), 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleRequestReservation = () => {
    if (isSold) return;
    if (!requireAuth('reservation')) return;

    if (!hasCompletedTour) {
      if (hasScheduledTour) {
        toast(
          `Viewing tour must be completed before placing a reservation. Your viewing is scheduled for ${formatDate(relevantAppointment!.date)} (${relevantAppointment!.timeSlot}).`,
          'info'
        );
        navigate('/appointments');
        return;
      }
      toast('Viewing appointment required before reserving. Schedule your private VIP viewing first!', 'info');
      setBookingModal(true);
      return;
    }

    setReservationModal(true);
  };

  const submitReservation = async () => {
    if (!user || !apartment || isSold) return;
    if (!hasCompletedTour) {
      toast('Reservation requires a completed viewing tour. Please complete your appointment first.', 'error');
      return;
    }
    setSubmittingReservation(true);
    const tenPercentFee = Math.round(Number(apartment.price) * 0.1);
    try {
      const createdRes = await reservationService.create({
        apartmentId: apartment.id,
        appointmentId: relevantAppointment?.id,
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
    if (isSold) return;
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
      setReviewEligibility((prev) => (prev ? { ...prev, hasReviewed: true } : null));
      reviewService.getByApartment(apartment.id).then(setReviews).catch(() => { });
    } catch (err: any) {
      toast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitInquiry = async () => {
    if (!user || !apartment || isSold) return;
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
      <div className="min-h-screen bg-[#fafbfe] w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="h-[460px] w-full rounded-3xl mb-8" />
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
        <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-md w-full shadow-lg text-center">
          <EmptyState
            icon={<Home className="w-12 h-12 text-amber-500" />}
            title="Residence Not Found"
            description="The requested apartment could not be located in our active catalog."
            action={
              <Link to="/apartments">
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer">
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
    { icon: <Bed className="w-4 h-4" />, label: 'Bedrooms', value: apartment.bedrooms === 0 ? 'Studio' : `${apartment.bedrooms} Bedrooms` },
    { icon: <Bath className="w-4 h-4" />, label: 'Bathrooms', value: `${apartment.bathrooms} Baths` },
    { icon: <Maximize className="w-4 h-4" />, label: 'Floor Area', value: `${apartment.size} m² (${Math.round(apartment.size * 10.764)} sqft)` },
    { icon: <Building2 className="w-4 h-4" />, label: 'Tower Level', value: `Floor ${apartment.floor}` },
    { icon: <Calendar className="w-4 h-4" />, label: 'Year Built', value: apartment.yearBuilt || '2024' },
    { icon: <Home className="w-4 h-4" />, label: 'Architecture Type', value: apartment.type },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-24 relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-[700px] h-[350px] bg-gradient-to-b from-amber-100/30 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Breadcrumb Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 pt-6 pb-5 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto flex items-center justify-between">
          <Link to="/apartments" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition">
            <ArrowLeft className="w-4 h-4 text-amber-600" />
            <span>Back to Residences</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/compare"
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-1.5 rounded-xl transition"
            >
              Compare Specs
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">

        {/* Gallery Showcase */}
        <div className="mb-8">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_10px_35px_rgba(15,23,42,0.06)] bg-slate-950 aspect-[16/9] sm:aspect-[21/9] max-h-[540px]">
            <img
              src={images[activeImage]?.url}
              alt={images[activeImage]?.caption}
              className="w-full h-full object-cover transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 shadow-lg transition cursor-pointer text-slate-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 shadow-lg transition cursor-pointer text-slate-900"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block mb-0.5">
                  Skyline Signature Residence
                </span>
                <p className="text-base sm:text-xl font-bold drop-shadow-sm">
                  {images[activeImage]?.caption || apartment.title}
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-950/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-xl">
                {activeImage + 1} / {images.length} Photos
              </span>
            </div>
          </div>

          {/* Thumbnail Ribbon */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative shrink-0 w-24 h-16 rounded-xl overflow-hidden transition-all duration-200 border-2 cursor-pointer ${activeImage === i ? 'border-amber-500 ring-2 ring-amber-400/30 scale-102' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SOLD Notice Banner if Apartment is Sold */}
        {isSold && (
          <div className="mb-8 p-5 rounded-3xl bg-rose-50/80 border border-rose-200/90 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-2xs">
                ● SOLD
              </span>
              <div>
                <p className="font-bold text-slate-900 text-sm">This residence is no longer available for reservation or viewing.</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  The property transaction for this residence has been completed. Details are retained for historical reference and community reviews.
                </p>
              </div>
            </div>
            <Link
              to="/apartments"
              className="shrink-0 px-4 py-2 rounded-xl bg-white border border-rose-200 hover:border-rose-300 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              Browse Available Units
            </Link>
          </div>
        )}

        {/* Layout Grid (Main Info + Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Title Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    {isSold ? (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
                        ● Sold Out
                      </span>
                    ) : isReserved ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
                        Reserved
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
                        Available
                      </span>
                    )}

                    {apartment.featured && (
                      <span className="bg-amber-500 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-slate-950" /> Signature
                      </span>
                    )}

                    {avgRating && (
                      <div className="flex items-center gap-1.5 ml-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                        <StarRating rating={Math.round(avgRating)} />
                        <span>({reviews.length} reviews)</span>
                      </div>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5 tracking-tight">
                    {apartment.title}
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{apartment.address}, {apartment.district}, {apartment.city}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="shrink-0 w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition shadow-2xs cursor-pointer"
                  title={fav ? 'Remove from saved' : 'Save residence'}
                >
                  <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                </button>
              </div>

              {/* Price Strip */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-5 border-t border-slate-100 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                    Acquisition Price
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {formatCurrency(apartment.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {apartment.buildingName || 'Skyline Tower'}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Freehold Deed
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
              <Tabs
                tabs={[
                  {
                    label: 'Overview & Amenities',
                    content: (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg mb-2">Description</h3>
                          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">{apartment.description}</p>
                        </div>

                        {/* Included Facilities */}
                        <div className="pt-5 border-t border-slate-100">
                          <h3 className="font-bold text-slate-900 text-lg mb-3.5 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>Private Resident Amenities</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {apartment.facilities.map((facility) => (
                              <div
                                key={facility}
                                className="flex items-center gap-3 px-3.5 py-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl shadow-2xs hover:bg-white transition"
                              >
                                <span className="text-lg shrink-0">
                                  {FACILITY_ICONS[facility] ?? '✨'}
                                </span>
                                <span className="text-xs font-semibold text-slate-800">{facility}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
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
                      <div className="space-y-5">
                        {apartment.floorPlanUrl ? (
                          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white p-3 shadow-inner">
                            <img
                              src={apartment.floorPlanUrl}
                              alt="Floor plan schematic"
                              className="w-full object-contain max-h-[480px]"
                            />
                          </div>
                        ) : (
                          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                            <Ruler className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                            <p className="font-bold text-slate-900 text-sm">Floor Plan Available Upon Request</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Detailed architectural schematics with exact room dimensions are provided during viewing.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Total Area', value: `${apartment.size} m²` },
                            { label: 'Bedrooms', value: apartment.bedrooms === 0 ? 'Studio' : apartment.bedrooms },
                            { label: 'Bathrooms', value: apartment.bathrooms },
                          ].map((item) => (
                            <div key={item.label} className="text-center p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{item.label}</p>
                              <p className="text-lg font-bold text-slate-900">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  },
                  {
                    label: `Verified Reviews (${reviews.length})`,
                    content: (
                      <div className="space-y-5">
                        {isAuthenticated ? (
                          reviewEligibility?.eligible ? (
                            reviewEligibility.hasReviewed ? (
                              <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                  <div>
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Review Submitted</p>
                                    <p className="text-xs text-slate-600">You have already submitted a review for this residence.</p>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                                  Verified {reviewEligibility.relationshipType === 'PURCHASED' ? 'Owner' : 'Resident'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Resident Feedback</p>
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                      {reviewEligibility.relationshipLabel || (reviewEligibility.relationshipType === 'PURCHASED' ? 'Purchased' : 'Reserved')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-0.5">Provide an authentic evaluation of this tower and unit</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setReviewModal(true)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
                                >
                                  Write Review
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-500">
                              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>Verified reviews can be submitted by residents who have reserved or purchased this apartment.</span>
                            </div>
                          )
                        ) : null}

                        {reviews.length === 0 ? (
                          <EmptyState
                            variant="inbox"
                            title="No resident reviews yet"
                            description="Be the first verified customer to share an impression of this residence."
                          />
                        ) : (
                          <div className="space-y-3">
                            {reviews.map((review) => (
                              <div key={review.id} className="p-4 border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                                <div className="flex items-start justify-between mb-1.5">
                                  <div>
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{review.customerName}</p>
                                    <StarRating rating={review.rating} />
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium">{formatDate(review.createdAt)}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">{review.title}</h4>
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
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sticky top-24">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                Acquisition Price
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight mb-3">
                {formatCurrency(apartment.price)}
              </p>

              <div className="mb-5">
                {isSold ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-600" /> ● Sold Out
                  </span>
                ) : isReserved ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Currently in 48-Hr Hold
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Available for Immediate Hold
                  </span>
                )}
              </div>

              {/* Action Buttons: Disabled when SOLD */}
              {isSold ? (
                <div className="space-y-2.5">
                  <div className="w-full py-3 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs flex items-center justify-between cursor-not-allowed select-none">
                    <span className="flex items-center gap-2">
                      <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Viewing Appointment</span>
                    </span>
                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded">
                      UNAVAILABLE
                    </span>
                  </div>

                  <div className="w-full py-3 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs flex items-center justify-between cursor-not-allowed select-none">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reservation Hold</span>
                    </span>
                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded">
                      UNAVAILABLE
                    </span>
                  </div>

                  <div className="w-full py-3 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs flex items-center justify-between cursor-not-allowed select-none">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>Concierge Inquiry</span>
                    </span>
                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded">
                      UNAVAILABLE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Workflow Status Callout */}
                  {hasCompletedTour ? null : hasScheduledTour ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Tour Booked ({formatDate(relevantAppointment!.date)})</span>
                      </div>
                      <Link to="/appointments" className="text-[11px] font-bold text-amber-700 underline shrink-0">
                        View Visit
                      </Link>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Viewing tour required before reserving this residence.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBookViewing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4 text-slate-950" />
                    <span>{hasScheduledTour ? 'Manage Viewing Appointment' : 'Book Viewing Appointment'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestReservation}
                    className={`w-full py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${hasCompletedTour
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/15'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400'
                      }`}
                  >
                    <FileText className={`w-4 h-4 ${hasCompletedTour ? 'text-white' : 'text-amber-600'}`} />
                    <span>Place 48-Hour Reservation Hold</span>
                  </button>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      <span>{fav ? 'Saved' : 'Save Unit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendInquiry}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Inquire</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Social Proof info */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Verified Skyline Living Residence</span>
              </div>
            </div>

            {/* Specifications Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
              <h3 className="font-bold text-slate-900 text-base mb-3.5 pb-2.5 border-b border-slate-100">
                Residence Specifications
              </h3>
              <dl className="space-y-3">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-0">
                    <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="text-amber-600">{fact.icon}</span>
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
        title={`Viewing Appointment`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setBookingModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingBooking}
              onClick={submitBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-slate-950" />
              <span>{submittingBooking ? 'Confirming...' : 'Confirm Appointment'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <p className="text-xs font-bold text-slate-900">{apartment.title}</p>
            <p className="text-xs text-slate-600">{apartment.address}, {apartment.district}</p>
          </div>
          <Input
            label="Preferred Viewing Date"
            type="date"
            name="bookingDate"
            value={bookingDate}
            min={todayStr}
            onChange={(e) => setBookingDate(e.target.value)}
          />
          {availableBookingSlots.length === 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              No remaining viewing slots for today. Please choose a future date.
            </div>
          ) : (
            <Select
              label="Preferred Time Slot"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              options={availableBookingSlots.map((s) => ({ value: s, label: s }))}
            />
          )}
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
              type="button"
              onClick={() => setReservationModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingReservation}
              onClick={submitReservation}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>{submittingReservation ? 'Securing...' : 'Place Priority Hold'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
            <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Total Residence Value</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(apartment.price)}</p>
            <div className="mt-2.5 pt-2.5 border-t border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">Priority Deposit (10%):</span>
              <span className="font-bold text-amber-900">{formatCurrency(Math.round(Number(apartment.price) * 0.1))}</span>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1 shadow-2xs">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>48-Hour Hold Protocol:</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Once initiated, the unit is held exclusively for you to upload the deposit payment slip for verification.
            </p>
          </div>
        </div>
      </Modal>

      {/* Inquiry Modal */}
      <Modal
        open={inquiryModal}
        onClose={() => setInquiryModal(false)}
        title={`Concierge Inquiry: ${apartment.title}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setInquiryModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingInquiry}
              onClick={submitInquiry}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-slate-950" />
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

      {/* Review Modal */}
      <Modal
        open={reviewModal}
        onClose={() => setReviewModal(false)}
        title={`Write Review: ${apartment.title}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReviewModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingReview}
              onClick={submitReview}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Review Title"
            name="reviewTitle"
            placeholder="e.g. Exceptional architectural craftsmanship"
            value={reviewForm.title}
            onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Review Comment"
            name="reviewComment"
            placeholder="Share your experience living at or inspecting this residence…"
            rows={4}
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Login Prompt Modal */}
      <Modal
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Account Required"
      >
        <div className="py-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-700 shadow-2xs">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
            Please sign in or register to {loginAction === 'viewing' ? 'book a viewing appointment' : loginAction === 'reservation' ? 'reserve this residence' : 'transmit a private concierge inquiry'}.
          </p>
          <Link to="/login" state={{ from: `/apartments/${id}` }}>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Sign In</span>
            </button>
          </Link>
        </div>
      </Modal>

    </div>
  );
}