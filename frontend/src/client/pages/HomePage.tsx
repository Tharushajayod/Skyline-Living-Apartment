import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Eye,
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { apartmentService } from '@/shared/services/apartmentService';

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
        const data = Array.isArray(res) ? res : res?.data || res?.content || [];
        const available = data.filter((a: any) => (a.status || '').toLowerCase() !== 'sold');
        setApartments(available.slice(0, 6)); // Display top 6 featured available residences
      } catch (error) {
        console.error("Failed to load apartments from database:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApartments();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/apartments?query=${encodeURIComponent(keyword)}&type=${encodeURIComponent(propertyType)}&location=${encodeURIComponent(district)}`);
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
    <div className="bg-[#fafbfe] text-slate-900 min-h-screen relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-gold-100/50 via-champagne-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-gradient-to-tl from-amber-100/40 via-gold-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Search */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gold-100/90 border border-gold-300/80 text-gold-900 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm animate-fadeInUp">
              <Sparkles className="w-4 h-4 text-gold-600 animate-spin-slow" />
              <span>Sri Lanka's Premier Architectural Residences</span>
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] font-serif mb-6">
              Elevated Living <br />
              <span className="gold-gradient-text">Above The Skyline</span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed mb-10">
              Discover verified signature penthouses, duplex suites, and luxury apartments designed with floor-to-ceiling glass, private sky decks, and concierge amenities.
            </p>

            {/* SEARCH BAR CARD */}
            <div className="luxury-glass rounded-3xl p-4 sm:p-6 border border-white/90 shadow-[0_20px_50px_rgba(180,83,9,0.08)] backdrop-blur-xl">
              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 items-center">
                
                <div className="text-left px-4 py-3 rounded-2xl bg-white border border-slate-200/90 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-400/20 transition shadow-sm">
                  <label className="text-[10px] font-extrabold text-gold-700 uppercase tracking-widest block mb-1">Keywords</label>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gold-600 shrink-0" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Tower, street, specs..."
                      className="bg-transparent text-sm w-full focus:outline-none text-slate-900 placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div className="text-left px-4 py-3 rounded-2xl bg-white border border-slate-200/90 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-400/20 transition shadow-sm">
                  <label className="text-[10px] font-extrabold text-gold-700 uppercase tracking-widest block mb-1">Residence Type</label>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gold-600 shrink-0" />
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="bg-transparent text-sm w-full focus:outline-none text-slate-900 cursor-pointer font-medium"
                    >
                      <option value="All Types">All Types</option>
                      <option value="Sky Villa">Sky Villa</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Duplex Suite">Duplex Suite</option>
                      <option value="Executive Suite">Executive Suite</option>
                    </select>
                  </div>
                </div>

                <div className="text-left px-4 py-3 rounded-2xl bg-white border border-slate-200/90 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-400/20 transition shadow-sm">
                  <label className="text-[10px] font-extrabold text-gold-700 uppercase tracking-widest block mb-1">District</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold-600 shrink-0" />
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="bg-transparent text-sm w-full focus:outline-none text-slate-900 cursor-pointer font-medium"
                    >
                      <option value="All Locations">All Locations</option>
                      <option value="Colombo 03">Colombo 03 (Kollupitiya)</option>
                      <option value="Colombo 07">Colombo 07 (Cinnamon Gardens)</option>
                      <option value="Rajagiriya">Rajagiriya Waterway</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-600 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-bold tracking-wide text-sm transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Units</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Quick Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Freehold Title Deeds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>0% Down 48-Hour Reservation Hold</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Private VIP Concierge</span>
              </div>
            </div>
          </div>

          {/* Right Visual Floating Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-lg aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(180,83,9,0.15)] border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" 
                alt="Skyline Penthouse" 
                className="w-full h-full object-cover transform hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
              
              <div className="absolute top-4 left-4">
                <span className="px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold shadow-md border border-white/60">
                  ★ Architectural Showcase 2026
                </span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">The Grand Horizon Penthouse</p>
                <h3 className="text-2xl font-bold font-serif">Alfred Tower • Colombo 03</h3>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/20 text-sm">
                  <span className="text-xl font-black text-amber-300">Rs. 185,000,000</span>
                  <Link to="/apartments" className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gold-600/90 hover:bg-gold-500 px-3 py-1.5 rounded-lg transition">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Stat Pill 1 */}
            <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gold-200/80 shadow-xl flex items-center gap-3 animate-float hidden sm:flex">
              <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">8 Signature Towers</p>
                <p className="text-[11px] text-slate-500">Metropolitan Prime Zones</p>
              </div>
            </div>

            {/* Floating Stat Pill 2 */}
            <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gold-200/80 shadow-xl flex items-center gap-3 animate-float hidden sm:flex" style={{ animationDelay: '1.5s' }}>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">4.9/5 Rating</p>
                <p className="text-[11px] text-slate-500">450+ Verified Residents</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-gold-200/60 bg-gradient-to-r from-white via-champagne-50/50 to-white py-10">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-4 rounded-2xl hover:bg-white/60 transition">
            <div className="text-3xl sm:text-5xl font-black text-slate-900 font-sans tabular-nums tracking-tight">8+</div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-gold-700 mt-2">Signature Towers</div>
          </div>
          <div className="p-4 rounded-2xl hover:bg-white/60 transition">
            <div className="text-3xl sm:text-5xl font-black text-slate-900 font-sans tabular-nums tracking-tight">65+</div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-gold-700 mt-2">Prime Residences Sold</div>
          </div>
          <div className="p-4 rounded-2xl hover:bg-white/60 transition">
            <div className="text-3xl sm:text-5xl font-black text-slate-900 font-sans tabular-nums tracking-tight">100%</div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-gold-700 mt-2">Verified Freehold Deeds</div>
          </div>
          <div className="p-4 rounded-2xl hover:bg-white/60 transition">
            <div className="text-3xl sm:text-5xl font-black text-slate-900 font-sans tabular-nums tracking-tight">4.9/5</div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-gold-700 mt-2">Resident Satisfaction</div>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES (From Database) */}
      <section className="py-24 px-4 sm:px-6 lg:px-10 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gold-200/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              Exquisite Portfolio
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-serif tracking-tight">
              Featured Residences
            </h2>
          </div>
          <Link 
            to="/apartments" 
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold text-gold-700 hover:text-gold-800 transition group px-4 py-2 rounded-xl bg-gold-50 border border-gold-200 hover:border-gold-300"
          >
            <span>View Full Collection ({apartments.length}+)</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/80 rounded-3xl border border-gold-100">
            <Loader2 className="w-10 h-10 text-gold-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading exquisite residences from database...</p>
          </div>
        ) : apartments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-slate-600 text-base font-medium">No apartments currently found in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.map((apt) => (
              <div 
                key={apt.id || apt._id} 
                className="luxury-card-hover bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)] flex flex-col group"
              >
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img 
                    src={getApartmentImage(apt)} 
                    alt={apt.title || apt.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition duration-700" 
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/95 backdrop-blur-md text-slate-900 border border-white/80 text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">
                      {apt.status || apt.category || 'Available'}
                    </span>
                    {apt.isFeatured && (
                      <span className="bg-gradient-to-r from-gold-500 to-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">
                        ★ Signature
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-5 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-gold-300 tracking-wider">Starting From</p>
                      <span className="text-2xl font-black text-white tracking-tight font-sans tabular-nums">
                        {formatPrice(apt.price)}
                      </span>
                    </div>
                    <Link
                      to={`/apartments/${apt.id || apt._id}`}
                      className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md hover:bg-gold-500 text-white flex items-center justify-center transition shadow-lg"
                      title="Inspect Residence"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-gold-700 transition line-clamp-1 font-serif">
                      {apt.title || apt.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                      {apt.location || apt.address || 'Colombo, Sri Lanka'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                      <Bed className="w-4 h-4 text-gold-600" />
                      <span className="font-bold text-slate-800">{apt.bedrooms || apt.beds || 3} Beds</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                      <Bath className="w-4 h-4 text-gold-600" />
                      <span className="font-bold text-slate-800">{apt.bathrooms || apt.baths || 2} Baths</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                      <Maximize className="w-4 h-4 text-gold-600" />
                      <span className="font-bold text-slate-800">{apt.area || apt.sqft || '2,100'} sqft</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      to={`/apartments/${apt.id || apt._id}`}
                      className="flex-1 py-3 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white transition shadow-md shadow-gold-500/20"
                    >
                      View Details & Floor Plans
                    </Link>
                    <Link
                      to="/compare"
                      className="px-3.5 py-3 text-center text-xs font-bold rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-800 transition border border-slate-200"
                      title="Compare specs"
                    >
                      Compare
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-24 bg-gradient-to-b from-white via-champagne-50/30 to-white border-y border-gold-200/60">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-100 text-gold-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            The Standard of Distinction
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 font-serif tracking-tight">
            Why Skyline Living Stands Apart
          </h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mt-4 font-normal">
            Every home in our portfolio undergoes rigorous architectural, acoustic, and legal validation before presenting to clients.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 rounded-3xl bg-white border border-gold-200/70 shadow-[0_10px_30px_rgba(180,83,9,0.04)] hover:shadow-xl hover:border-gold-400 transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gold-100 flex items-center justify-center text-gold-700 mb-6 border border-gold-200">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif">Vetted & Authenticated</h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Direct developer ties, clear legal deeds, and full transparency on unit property titles with escrow-protected transactions.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gold-200/70 shadow-[0_10px_30px_rgba(180,83,9,0.04)] hover:shadow-xl hover:border-gold-400 transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gold-100 flex items-center justify-center text-gold-700 mb-6 border border-gold-200">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif">Private VIP Concierge</h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Dedicated viewing schedules, VIP chauffeur services to viewings, and prioritized paperwork handling tailored to your schedule.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gold-200/70 shadow-[0_10px_30px_rgba(180,83,9,0.04)] hover:shadow-xl hover:border-gold-400 transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gold-100 flex items-center justify-center text-gold-700 mb-6 border border-gold-200">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif">Capital Appreciation</h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Strategic central city locations with proven high capital growth, exceptional liquidity, and maximum rental yields.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER (Light Luxury Theme) */}
      <section className="py-20 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px] mx-auto rounded-3xl p-10 md:p-16 relative overflow-hidden bg-gradient-to-r from-gold-500 via-gold-600 to-amber-700 text-white shadow-[0_25px_60px_rgba(180,83,9,0.25)] text-center">
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
              <Sparkles className="w-4 h-4 text-amber-200" />
              Begin Your Journey
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-serif tracking-tight">
              Ready to Discover Your Dream Residence?
            </h2>
            <p className="mt-4 text-amber-50 text-base sm:text-lg max-w-2xl mx-auto">
              Schedule a bespoke private architectural viewing with our senior property advisors today.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link
                to="/apartments"
                className="px-8 py-4 rounded-xl bg-white hover:bg-gold-50 text-slate-950 font-bold text-sm transition transform hover:scale-105 shadow-xl cursor-pointer"
              >
                Browse Penthouse Units
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl bg-slate-950/40 hover:bg-slate-950/60 text-white border border-white/30 font-bold text-sm transition backdrop-blur-md cursor-pointer"
              >
                Create Resident Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}