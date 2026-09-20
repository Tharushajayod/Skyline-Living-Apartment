import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, MapPin, Home, ChevronDown,
  ArrowUpDown, LayoutGrid, List, Sparkles, Building2, Eye, Bed, Bath, Maximize, ArrowRight
} from 'lucide-react';
import type { Apartment, ApartmentType, ApartmentStatus } from '@/shared/types';
import { apartmentService } from '@/shared/services/apartmentService';
import ApartmentCard from '@/shared/components/ApartmentCard';
import { CardSkeleton } from '@/shared/components/ui/Skeleton';
import EmptyState from '@/shared/components/ui/EmptyState';
import { formatCurrency } from '@/shared/utils/format';

const APARTMENT_TYPES: ApartmentType[] = ['Studio', '1BR', '2BR', '3BR', 'Penthouse'];
const APARTMENT_STATUSES: ApartmentStatus[] = ['Available', 'Reserved'];

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'size';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest Releases' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'size', label: 'Largest Floor Area' },
];

export default function ApartmentListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [allApartments, setAllApartments] = useState<Apartment[]>([]);
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

  // Load apartments
  useEffect(() => {
    let active = true;
    setLoading(true);
    apartmentService.getAll().then((data) => {
      if (active) {
        setAllApartments(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
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

  // Apply filters - Do not display sold apartments
  const filtered = useMemo(() => {
    let result = allApartments.filter((a) => (a.status || '').toLowerCase() !== 'sold');
    if (search) {
      const q = search.toLowerCase();
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

    // Sort
    switch (sort) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'size': result.sort((a, b) => b.size - a.size); break;
      default: result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gold-200/60">
        <h3 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gold-600" />
          Filter Portfolio
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1 bg-gold-100/70 hover:bg-gold-200 px-2.5 py-1 rounded-lg transition"
          >
            <X className="w-3 h-3" /> Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
          Keyword Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tower name, street, specs..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 transition"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
          Residence Classification
        </label>
        <select
          value={type}
          onChange={(e) => updateParam('type', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 transition cursor-pointer"
        >
          <option value="all">All Architectural Types</option>
          {APARTMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Availability Status */}
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
          Availability Status
        </label>
        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 transition cursor-pointer"
        >
          <option value="all">All Availability States</option>
          {APARTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
          Metropolitan District
        </label>
        <select
          value={district}
          onChange={(e) => updateParam('district', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 transition cursor-pointer"
        >
          <option value="all">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
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
              className={`py-2 text-xs font-bold rounded-xl border transition ${
                bedrooms === item.val
                  ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-white border-gold-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-gold-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
          Price Range (Rs.)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-gold-500"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={clearAllFilters}
          className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-gold-300 bg-white hover:bg-gold-50/50 text-slate-700 font-bold text-xs transition"
        >
          Reset All Parameters
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[400px] bg-gradient-to-b from-gold-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Page Header */}
      <div className="bg-gradient-to-b from-white via-champagne-50/40 to-[#fafbfe] border-b border-gold-200/60 pt-10 pb-8 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
            <Link to="/" className="hover:text-gold-700 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-gold-600" />
              <span>Skyline Living</span>
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90 text-slate-400" />
            <span className="text-gold-800 font-bold">Residences Portfolio</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                Verified Architectural Collection
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 tracking-tight">
                Luxury Apartments & Penthouses
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-md font-normal">
              Explore freehold units, compare architectural floor plans, and secure 48-hour priority reservation holds directly online.
            </p>
          </div>
        </div>
      </div>

      {/* Full-Width Canvas Layout */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24 luxury-glass rounded-3xl p-6 border border-white/90 shadow-[0_15px_40px_rgba(180,83,9,0.06)] backdrop-blur-xl">
              <FilterPanel />
            </div>
          </aside>

          {/* Main Residences Canvas */}
          <div className="flex-1 min-w-0">
            
            {/* Top Toolbar */}
            <div className="luxury-glass rounded-2xl p-4 border border-white/90 shadow-sm backdrop-blur-md mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold-50 border border-gold-200 text-gold-900 font-bold text-xs"
                >
                  <SlidersHorizontal className="w-4 h-4 text-gold-600" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-gold-600 text-white text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                  {loading ? (
                    <span className="text-gold-700 animate-pulse">Scanning database...</span>
                  ) : (
                    <>
                      Showing <span className="font-extrabold text-slate-900">{filtered.length}</span> verified{' '}
                      {filtered.length === 1 ? 'residence' : 'residences'}
                    </>
                  )}
                </p>
              </div>

              {/* View mode toggle & Sort Dropdown */}
              <div className="flex items-center gap-3">
                {/* Grid / List View Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === 'grid'
                        ? 'bg-white text-gold-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === 'list'
                        ? 'bg-white text-gold-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Comprehensive Spec List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gold-600 hidden sm:block" />
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-gold-500 cursor-pointer shadow-sm"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Units Display */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="luxury-glass rounded-3xl p-12 text-center border border-white/90 shadow-sm">
                <EmptyState
                  variant="search"
                  title="No residences match your exact criteria"
                  description="Try clearing some filter tags or modifying your price boundary to view available units."
                  action={
                    activeFilterCount > 0 ? (
                      <button
                        onClick={clearAllFilters}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md"
                      >
                        Reset All Filters
                      </button>
                    ) : undefined
                  }
                />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeInUp">
                {filtered.map((apt) => (
                  <ApartmentCard key={apt.id} apartment={apt} />
                ))}
              </div>
            ) : (
              /* Spec List View (Full Horizontal Details with No Sideways Scroll) */
              <div className="space-y-4 animate-fadeInUp">
                {filtered.map((apt) => {
                  const img = apt.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
                  return (
                    <div
                      key={apt.id}
                      className="luxury-card-hover bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col md:flex-row items-center gap-6 group"
                    >
                      <div className="w-full md:w-60 h-44 rounded-2xl overflow-hidden shrink-0 relative bg-slate-100">
                        <img
                          src={img}
                          alt={apt.title}
                          className="w-full h-full object-cover group-hover:scale-108 transition duration-700"
                        />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <h3 className="text-xl font-bold font-serif text-slate-900 group-hover:text-gold-700 transition">
                              {apt.title}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                              {apt.district}, {apt.city} • {apt.buildingName || 'Signature Tower'}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] uppercase font-bold text-gold-600">List Price</p>
                            <p className="text-2xl font-black text-slate-900 font-sans tabular-nums">
                              {formatCurrency(apt.price)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {apt.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4 text-gold-600" />
                              {apt.bedrooms === 0 ? 'Studio' : `${apt.bedrooms} Beds`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="w-4 h-4 text-gold-600" />
                              {apt.bathrooms} Baths
                            </span>
                            <span className="flex items-center gap-1">
                              <Maximize className="w-4 h-4 text-gold-600" />
                              {apt.size} m² ({Math.round(apt.size * 10.764)} sqft)
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-500">Floor {apt.floor}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              to="/compare"
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-800 text-xs font-bold transition border border-slate-200"
                            >
                              Compare
                            </Link>
                            <Link
                              to={`/apartments/${apt.id}`}
                              className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white text-xs font-bold transition shadow-sm hover:shadow-md flex items-center gap-1.5"
                            >
                              <span>View Specs & Hold</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-84 max-w-[85%] bg-[#fafbfe] shadow-2xl overflow-y-auto p-6 z-10 border-r border-gold-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-bold text-slate-900 text-xl flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gold-600" />
                Filter Units
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel />
            <div className="mt-6">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md"
              >
                Show {filtered.length} Matching Units
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
