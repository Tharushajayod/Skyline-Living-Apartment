import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, MapPin, Home, ChevronDown,
  ArrowUpDown, LayoutGrid, List, Sparkles, Building2, Eye, Bed, Bath, Maximize, ArrowRight,
  RefreshCw, CheckCircle2
} from 'lucide-react';
import type { Apartment, ApartmentType, ApartmentStatus } from '@/shared/types';
import { apartmentService } from '@/shared/services/apartmentService';
import ApartmentCard from '@/shared/components/ApartmentCard';
import { CardSkeleton } from '@/shared/components/ui/Skeleton';
import EmptyState from '@/shared/components/ui/EmptyState';
import { formatCurrency } from '@/shared/utils/format';
import { executeApartmentSort } from '../strategies/apartmentSortStrategies';

const APARTMENT_TYPES: ApartmentType[] = ['Studio', '1BR', '2BR', '3BR', 'Penthouse'];
const APARTMENT_STATUSES: ApartmentStatus[] = ['Available', 'Reserved'];

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'size';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest Releases' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'size', label: 'Largest Floor Area' },
];

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
      className={`transition-all ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function ApartmentListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cached = apartmentService.getCachedAll();
  const initialApartments = useMemo(() => {
    if (Array.isArray(cached) && cached.length > 0) {
      return cached.filter((a) => (a.status || '').toLowerCase() !== 'sold');
    }
    return [];
  }, []);
  const [loading, setLoading] = useState(initialApartments.length === 0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allApartments, setAllApartments] = useState<Apartment[]>(initialApartments);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state derived from URL
  const search = searchParams.get('search') ?? searchParams.get('query') ?? '';
  const type = searchParams.get('type') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const district = searchParams.get('district') ?? searchParams.get('location') ?? 'all';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const bedrooms = searchParams.get('bedrooms') ?? 'all';
  const sort = (searchParams.get('sort') as SortKey) ?? 'newest';

  const loadApartments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setFetchError(null);
      const data = await apartmentService.getAll();
      // Enforce: sold apartments must never appear in normal public listings
      const availableOnly = Array.isArray(data)
        ? data.filter((a) => (a.status || '').toLowerCase() !== 'sold')
        : [];
      setAllApartments(availableOnly);
    } catch (err: any) {
      console.error('Failed to load apartments:', err);
      setFetchError('Unable to load residences right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load apartments
  useEffect(() => {
    loadApartments(initialApartments.length === 0);
  }, []);

  // District options
  const districts = useMemo(() => {
    const set = new Set<string>();
    allApartments.forEach((a) => {
      if (a.district) set.add(a.district);
    });
    if (set.size === 0) {
      return ['Colombo 03', 'Colombo 07', 'Rajagiriya', 'Kollupitiya'];
    }
    return Array.from(set).sort();
  }, [allApartments]);

  // Apply filters - strictly exclude sold apartments
  const filtered = useMemo(() => {
    let result = allApartments.filter((a) => (a.status || '').toLowerCase() !== 'sold');
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter((a) =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.city && a.city.toLowerCase().includes(q)) ||
        (a.buildingName && a.buildingName.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q)),
      );
    }
    if (type !== 'all' && type !== 'All Types') result = result.filter((a) => a.type === type);
    if (status !== 'all' && status !== 'All Statuses') result = result.filter((a) => a.status === status);
    if (district !== 'all' && district !== 'All Locations') result = result.filter((a) => a.district === district);
    if (minPrice) result = result.filter((a) => a.price >= Number(minPrice));
    if (maxPrice) result = result.filter((a) => a.price <= Number(maxPrice));
    if (bedrooms !== 'all') {
      const beds = Number(bedrooms);
      if (beds === 0) result = result.filter((a) => a.bedrooms === 0);
      else result = result.filter((a) => a.bedrooms >= beds);
    }

    // Strategy Pattern: execute runtime sorting strategy
    executeApartmentSort(sort, result);
    return result;
  }, [allApartments, search, type, status, district, minPrice, maxPrice, bedrooms, sort]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'All Types' && value !== 'All Locations' && value !== '') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const handleSortChange = (value: string) => updateParam('sort', value);

  const clearAllFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = [search, type, status, district, minPrice, maxPrice, bedrooms].filter(
    (v) => v && v !== 'all' && v !== 'All Types' && v !== 'All Locations' && v !== '',
  ).length;

  // ---------- Filter Panel Component ----------
  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-600" />
          <span>Filters</span>
        </h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-3 h-3" /> Reset ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Keywords
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tower, street, specs..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition placeholder-slate-400"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Residence Type
        </label>
        <select
          value={type}
          onChange={(e) => updateParam('type', e.target.value)}
          className="w-full h-10 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition cursor-pointer"
        >
          <option value="all">All Residence Types</option>
          {APARTMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Availability Status */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Availability Status
        </label>
        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="w-full h-10 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition cursor-pointer"
        >
          <option value="all">All Available Units</option>
          {APARTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          District / Zone
        </label>
        <select
          value={district}
          onChange={(e) => updateParam('district', e.target.value)}
          className="w-full h-10 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition cursor-pointer"
        >
          <option value="all">All Locations</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Bedrooms
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { label: 'All', val: 'all' },
            { label: '0', val: '0' },
            { label: '1+', val: '1' },
            { label: '2+', val: '2' },
            { label: '3+', val: '3' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => updateParam('bedrooms', item.val)}
              className={`h-9 text-xs font-bold rounded-xl border transition cursor-pointer ${
                bedrooms === item.val
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Price Range (Rs.)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full h-10 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition placeholder-slate-400"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full h-10 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition placeholder-slate-400"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full h-10 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs"
        >
          Reset All Parameters
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[350px] bg-gradient-to-b from-amber-100/30 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Clean Header Area */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 pt-8 sm:pt-10 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90 text-slate-300" />
            <span className="text-slate-700 font-semibold">Residences</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Explore Residences
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-normal mt-1 leading-relaxed">
                Discover available verified luxury apartments and signature suites across Skyline Living.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium shrink-0">
              <span>{filtered.length} {filtered.length === 1 ? 'residence available' : 'residences available'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
              <FilterPanel />
            </div>
          </aside>

          {/* Main Residences Canvas */}
          <div className="flex-1 min-w-0">
            
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-900 font-bold text-xs transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <p className="text-xs text-slate-600 font-medium">
                  {loading ? (
                    <span className="text-amber-700 animate-pulse">Loading residences...</span>
                  ) : (
                    <>
                      Showing <span className="font-bold text-slate-900">{filtered.length}</span>{' '}
                      {filtered.length === 1 ? 'residence' : 'residences'}
                    </>
                  )}
                </p>
              </div>

              {/* View mode toggle & Sort Dropdown */}
              <div className="flex items-center gap-2.5">
                {/* Grid / List View Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Spec List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Error State */}
            {fetchError ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-10 text-center">
                <p className="text-slate-900 font-bold text-sm mb-1">{fetchError}</p>
                <p className="text-slate-500 text-xs mb-4">Please check your network connection and try again.</p>
                <button
                  type="button"
                  onClick={() => loadApartments()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : loading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* Clean Minimal Empty State */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs">
                <EmptyState
                  variant="search"
                  title="No residences match your search"
                  description="Try adjusting your filter options, clearing keywords, or resetting your price boundary."
                  action={
                    activeFilterCount > 0 ? (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    ) : undefined
                  }
                />
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((apt, index) => (
                  <RevealOnScroll key={apt.id} delay={(index % 6) * 60}>
                    <ApartmentCard apartment={apt} />
                  </RevealOnScroll>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filtered.map((apt, index) => {
                  const img =
                    apt.images?.[0]?.url ||
                    (apt as any).imageUrl ||
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
                  return (
                    <RevealOnScroll key={apt.id} delay={(index % 6) * 50}>
                      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-300 p-5 flex flex-col md:flex-row items-center gap-6 group">
                        <div className="w-full md:w-56 h-40 rounded-2xl overflow-hidden shrink-0 relative bg-slate-100">
                          <img
                            src={img}
                            alt={apt.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500 ease-out"
                            loading="lazy"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
                            {apt.status || 'Available'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-1">
                                {apt.title}
                              </h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{apt.district}, {apt.city} • {apt.buildingName || 'Skyline Tower'}</span>
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">Purchase Price</p>
                              <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                                {formatCurrency(apt.price)}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed font-normal">
                            {apt.description}
                          </p>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-semibold">
                                <Bed className="w-3.5 h-3.5 text-amber-600" />
                                {apt.bedrooms === 0 ? 'Studio' : `${apt.bedrooms} Beds`}
                              </span>
                              <span className="flex items-center gap-1 font-semibold">
                                <Bath className="w-3.5 h-3.5 text-amber-600" />
                                {apt.bathrooms} Baths
                              </span>
                              <span className="flex items-center gap-1 font-semibold">
                                <Maximize className="w-3.5 h-3.5 text-amber-600" />
                                {apt.size} m² ({Math.round(apt.size * 10.764)} sqft)
                              </span>
                              <span className="text-slate-300 hidden sm:inline">|</span>
                              <span className="text-slate-500 text-xs hidden sm:inline">Floor {apt.floor}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                to="/compare"
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
                              >
                                Compare
                              </Link>
                              <Link
                                to={`/apartments/${apt.id}`}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>View Details</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </RevealOnScroll>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white shadow-2xl overflow-y-auto p-6 z-10 border-r border-slate-200">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>Filters</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel />
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-sm transition"
              >
                Show {filtered.length} Matching Residences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
