import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ShieldCheck,
  Award,
  TrendingUp,
  Star,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Sparkles,
  Eye,
  CheckCircle2,
  Building2,
  ArrowRight,
  Clock,
  Compass
} from 'lucide-react';
import { apartmentService } from '@/shared/services/apartmentService';

// Lightweight scroll reveal component
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
    // Respect prefers-reduced-motion
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
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
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [propertyType, setPropertyType] = useState('All Types');
  const [district, setDistrict] = useState('All Locations');

  // Database apartments state
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setLoading(true);
        const res = await apartmentService.getAll();
        const data = Array.isArray(res) ? res : [];
        const available = data.filter((a: any) => (a.status || '').toLowerCase() !== 'sold');
        setApartments(available.slice(0, 6)); // Display top 6 featured available residences
      } catch (error) {
        console.error('Failed to load apartments from database:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApartments();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/apartments?query=${encodeURIComponent(keyword)}&type=${encodeURIComponent(
        propertyType
      )}&location=${encodeURIComponent(district)}`
    );
  };

  const getApartmentImage = (apt: any) => {
    if (apt.imageUrl) return apt.imageUrl;
    if (apt.images && apt.images.length > 0) {
      return typeof apt.images[0] === 'string' ? apt.images[0] : apt.images[0]?.url;
    }
    if (apt.coverImage) return apt.coverImage;
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
  };

  const formatPrice = (price: any) => {
    if (!price) return 'Rs. Contact for Price';
    const num = Number(price);
    return isNaN(num) ? `Rs. ${price}` : `Rs. ${num.toLocaleString('en-LK')}`;
  };

  return (
    <div className="bg-[#fafbfe] text-slate-900 min-h-screen relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-amber-100/30 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-gradient-to-tl from-amber-100/20 via-slate-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-16 sm:pt-20 lg:pt-24 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 text-left">
            
            {/* 1. Subtle Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold tracking-wide mb-5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sri Lanka's Premier Architectural Residences</span>
            </div>

            {/* 2. Apple-inspired Hero Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.12] mb-4">
              Elevated Living <br />
              <span className="gold-gradient-text">Above The Skyline</span>
            </h1>

            {/* 3. Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 max-w-xl font-normal leading-relaxed mb-8">
              Discover verified signature penthouses, duplex suites, and luxury residences crafted with panoramic ocean views, private sky decks, and VIP concierge services.
            </p>

            {/* 4. Unified 4-Box Search Component (EQUAL WIDTH & HEIGHT) */}
            <div className="p-3 sm:p-3.5 rounded-3xl bg-white/90 border border-slate-200/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch w-full">
                
                {/* Box 1: Keywords */}
                <div className="flex flex-col justify-center px-4 py-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all shadow-2xs h-[60px] sm:h-[62px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Keywords
                  </label>
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Tower, street, specs..."
                      className="bg-transparent text-xs sm:text-sm w-full focus:outline-none text-slate-900 placeholder-slate-400 font-medium truncate"
                    />
                  </div>
                </div>

                {/* Box 2: Residence Type */}
                <div className="flex flex-col justify-center px-4 py-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all shadow-2xs h-[60px] sm:h-[62px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Residence Type
                  </label>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm w-full focus:outline-none text-slate-900 cursor-pointer font-medium truncate pr-1"
                    >
                      <option value="All Types">All Types</option>
                      <option value="Sky Villa">Sky Villa</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Duplex Suite">Duplex Suite</option>
                      <option value="Executive Suite">Executive Suite</option>
                    </select>
                  </div>
                </div>

                {/* Box 3: District */}
                <div className="flex flex-col justify-center px-4 py-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all shadow-2xs h-[60px] sm:h-[62px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    District / Zone
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm w-full focus:outline-none text-slate-900 cursor-pointer font-medium truncate pr-1"
                    >
                      <option value="All Locations">All Locations</option>
                      <option value="Colombo 03">Colombo 03 (Kollupitiya)</option>
                      <option value="Colombo 07">Colombo 07 (Cinnamon Gardens)</option>
                      <option value="Rajagiriya">Rajagiriya Waterway</option>
                    </select>
                  </div>
                </div>

                {/* Box 4: Explore Units Action Button (Equal Width & Height) */}
                <button
                  type="submit"
                  className="w-full h-[60px] sm:h-[62px] px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold tracking-wide text-xs sm:text-sm transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Units</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-950" />
                </button>

              </form>
            </div>

            {/* Quick Feature Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Freehold Deeds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>48-Hour Reservation Hold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Private VIP Concierge</span>
              </div>
            </div>

          </div>

          {/* Right Visual Floating Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] border-4 border-white group">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                alt="Skyline Penthouse"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold shadow-sm border border-white/70 flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Showcase 2026</span>
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-0.5">
                  The Grand Horizon Penthouse
                </p>
                <h3 className="text-xl font-bold tracking-tight text-white">Alfred Tower • Colombo 03</h3>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/15 text-xs">
                  <span className="text-lg font-black text-amber-300">Rs. 185,000,000</span>
                  <Link
                    to="/apartments"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition shadow-sm"
                  >
                    <span>View Units</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Stat Pill 1 */}
            <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3 hidden sm:flex">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">8 Signature Towers</p>
                <p className="text-[10px] text-slate-500 font-medium">Metropolitan Zones</p>
              </div>
            </div>

            {/* Floating Stat Pill 2 */}
            <div className="absolute -top-3 -right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3 hidden sm:flex">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">4.9 / 5.0 Rating</p>
                <p className="text-[10px] text-slate-500 font-medium">Verified Community</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* STATS BAR                                                 */}
      {/* ========================================================= */}
      <RevealOnScroll>
        <section className="border-y border-slate-200/70 bg-white py-8 sm:py-10">
          <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3 rounded-2xl">
              <div className="text-2xl sm:text-4xl font-bold text-slate-900 tabular-nums tracking-tight">8+</div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mt-1">Signature Towers</div>
            </div>
            <div className="p-3 rounded-2xl">
              <div className="text-2xl sm:text-4xl font-bold text-slate-900 tabular-nums tracking-tight">65+</div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mt-1">Residences Sold</div>
            </div>
            <div className="p-3 rounded-2xl">
              <div className="text-2xl sm:text-4xl font-bold text-slate-900 tabular-nums tracking-tight">100%</div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mt-1">Freehold Deeds</div>
            </div>
            <div className="p-3 rounded-2xl">
              <div className="text-2xl sm:text-4xl font-bold text-slate-900 tabular-nums tracking-tight">4.9 / 5.0</div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mt-1">Resident Satisfaction</div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ========================================================= */}
      {/* FEATURED PROPERTIES                                       */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10 w-full max-w-[1520px] mx-auto">
        
        <RevealOnScroll>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200/70">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Exquisite Portfolio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Featured Residences
              </h2>
            </div>
            <Link
              to="/apartments"
              className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-amber-600 transition group px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200"
            >
              <span>View All Residences ({apartments.length}+)</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </RevealOnScroll>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/80 rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading residences from database...</p>
          </div>
        ) : apartments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-slate-600 text-sm font-medium">No apartments currently available in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {apartments.map((apt, index) => (
              <RevealOnScroll key={apt.id || apt._id} delay={index * 80}>
                <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-300 flex flex-col group h-full">
                  
                  {/* Card Image */}
                  <div className="relative h-60 sm:h-64 overflow-hidden bg-slate-100">
                    <img
                      src={getApartmentImage(apt)}
                      alt={apt.title || apt.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 flex gap-1.5">
                      <span className="bg-white/95 backdrop-blur-md text-slate-900 border border-white/80 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
                        {apt.status || apt.category || 'Available'}
                      </span>
                      {apt.isFeatured && (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
                          ★ Signature
                        </span>
                      )}
                    </div>

                    {/* Bottom Price Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-4 flex items-end justify-between">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-amber-300 tracking-wider">Starting From</p>
                        <span className="text-xl font-black text-white tracking-tight tabular-nums">
                          {formatPrice(apt.price)}
                        </span>
                      </div>
                      <Link
                        to={`/apartments/${apt.id || apt._id}`}
                        className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center transition shadow-sm"
                        title="Inspect Residence"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-1">
                        {apt.title || apt.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{apt.location || apt.address || 'Colombo, Sri Lanka'}</span>
                      </p>
                    </div>

                    {/* Quick Specs */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                      <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-slate-50">
                        <Bed className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-slate-800 text-[11px]">{apt.bedrooms || apt.beds || 3} Beds</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-slate-50">
                        <Bath className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-slate-800 text-[11px]">{apt.bathrooms || apt.baths || 2} Baths</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-slate-50">
                        <Maximize className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-slate-800 text-[11px]">{apt.area || apt.sqft || '2,100'} sqft</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex items-center gap-2.5">
                      <Link
                        to={`/apartments/${apt.id || apt._id}`}
                        className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition shadow-sm"
                      >
                        View Details
                      </Link>
                      <Link
                        to="/compare"
                        className="px-3 py-2.5 text-center text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
                        title="Compare specifications"
                      >
                        Compare
                      </Link>
                    </div>

                  </div>

                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* WHY CHOOSE US                                             */}
      {/* ========================================================= */}
      <RevealOnScroll>
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-amber-50/20 to-white border-y border-slate-200/70">
          <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>The Standard of Distinction</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Why Skyline Living Stands Apart
            </h2>
            
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto mt-2 font-normal leading-relaxed">
              Every home in our portfolio undergoes rigorous architectural, acoustic, and legal validation before presenting to discerning buyers.
            </p>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left">
              
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 transition duration-300">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 mb-5 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Vetted & Authenticated</h3>
                <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Direct developer ties, clear legal deeds, and full transparency on unit property titles with escrow-protected transactions.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 transition duration-300">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 mb-5 border border-amber-500/20">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Private VIP Concierge</h3>
                <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Dedicated viewing schedules, VIP chauffeur services to viewings, and prioritized paperwork handling tailored to your schedule.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 transition duration-300">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 mb-5 border border-amber-500/20">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Capital Appreciation</h3>
                <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Strategic central city locations with proven capital growth, exceptional liquidity, and maximum long-term rental yields.
                </p>
              </div>

            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ========================================================= */}
      {/* CALL TO ACTION                                            */}
      {/* ========================================================= */}
      <RevealOnScroll>
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-[1520px] mx-auto rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl text-center border border-slate-800">
            <div className="relative z-10 max-w-2xl mx-auto">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-400 text-xs font-bold uppercase tracking-wider mb-3.5 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Begin Your Journey</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Ready to Discover Your Dream Residence?
              </h2>
              
              <p className="mt-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed">
                Schedule a bespoke private architectural viewing with our senior property advisors today.
              </p>
              
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/apartments"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition transform hover:scale-[1.02] shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Browse Available Units
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs sm:text-sm transition backdrop-blur-md cursor-pointer"
                >
                  Create Resident Account
                </Link>
              </div>

            </div>
          </div>
        </section>
      </RevealOnScroll>

    </div>
  );
}