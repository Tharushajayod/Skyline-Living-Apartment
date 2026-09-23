import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCompare, X, Plus, Check, Minus, Search, ArrowRight,
  ChevronDown, Home, Bed, Bath, Maximize, Eye, Sparkles,
  SlidersHorizontal, CheckCircle2, ShieldAlert
} from 'lucide-react';
import type { Apartment } from '@/shared/types';
import { apartmentService } from '@/shared/services/apartmentService';
import { formatCurrency } from '@/shared/utils/format';

const MAX_COMPARE = 4;

// Standard key amenities to compare side-by-side
const AMENITY_KEYS = [
  { key: 'Swimming Pool', label: 'Swimming Pool' },
  { key: 'Gym & Fitness Center', label: 'Gym & Fitness' },
  { key: '24/7 Security', label: '24/7 Security' },
  { key: 'Concierge Service', label: 'Concierge Service' },
  { key: 'Elevator', label: 'High-Speed Elevators' },
  { key: 'Underground Parking', label: 'Underground Parking' },
  { key: 'Rooftop Garden', label: 'Rooftop Garden' },
  { key: 'Smart Home System', label: 'Smart Home Automation' },
  { key: 'Central Air Conditioning', label: 'Central Air Conditioning' },
  { key: 'EV Charging Stations', label: 'EV Charging' },
  { key: 'Private Balcony', label: 'Private Balcony' },
  { key: 'Pet-Friendly', label: 'Pet-Friendly' },
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

export default function ComparePage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDifferencesOnly, setShowDifferencesOnly] = useState<boolean>(false);

  // Load real apartments from database
  useEffect(() => {
    let active = true;
    setLoading(true);
    apartmentService.getAll()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        setApartments(list);
        
        // Pick initial apartments excluding SOLD ones
        const activeList = list.filter((a: Apartment) => (a.status || '').toLowerCase() !== 'sold');
        if (activeList.length >= 3) {
          setSelectedIds([
            activeList[0].id || (activeList[0] as any)._id,
            activeList[1].id || (activeList[1] as any)._id,
            activeList[2].id || (activeList[2] as any)._id,
          ]);
        } else if (activeList.length === 2) {
          setSelectedIds([
            activeList[0].id || (activeList[0] as any)._id,
            activeList[1].id || (activeList[1] as any)._id,
          ]);
        } else if (activeList.length === 1) {
          setSelectedIds([activeList[0].id || (activeList[0] as any)._id]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load apartments for comparison:', err);
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedApartments = useMemo(() => {
    return selectedIds
      .map((id) => apartments.find((a) => (a.id || (a as any)._id) === id))
      .filter(Boolean) as Apartment[];
  }, [selectedIds, apartments]);

  // Strictly exclude sold apartments from available selection pool
  const availableApartments = useMemo(() => {
    return apartments.filter((a) => {
      const isSold = (a.status || '').toLowerCase() === 'sold';
      if (isSold) return false;

      const aptId = a.id || (a as any)._id;
      const matchesSearch = searchQuery === '' ||
        (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.buildingName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return !selectedIds.includes(aptId) && matchesSearch;
    });
  }, [apartments, selectedIds, searchQuery]);

  const addApartment = (id: string) => {
    if (selectedIds.length >= MAX_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
    setShowAddModal(false);
    setSearchQuery('');
  };

  const removeApartment = (id: string) => {
    setSelectedIds((prev) => prev.filter((s) => s !== id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const bestPrice = useMemo(() => {
    if (selectedApartments.length === 0) return 0;
    return Math.min(...selectedApartments.map((a) => a.price || 0));
  }, [selectedApartments]);

  const largestSize = useMemo(() => {
    if (selectedApartments.length === 0) return 0;
    return Math.max(...selectedApartments.map((a) => a.size || 0));
  }, [selectedApartments]);

  const getApartmentImage = (apt: any) => {
    if (apt.imageUrl) return apt.imageUrl;
    if (apt.images && apt.images.length > 0) {
      return typeof apt.images[0] === 'string' ? apt.images[0] : apt.images[0]?.url;
    }
    if (apt.coverImage) return apt.coverImage;
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';
  };

  // Helper to check if row has differences across selected apartments
  const hasDifference = (extractor: (a: Apartment) => any) => {
    if (selectedApartments.length <= 1) return false;
    const firstVal = extractor(selectedApartments[0]);
    return selectedApartments.some((a) => extractor(a) !== firstVal);
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'sold') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          SOLD
        </span>
      );
    }
    if (s === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Reserved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Available
      </span>
    );
  };

  // Calculate empty slots to always show 4 slots total
  const emptySlotsCount = Math.max(0, MAX_COMPARE - selectedApartments.length);

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-24 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 pt-10 pb-8 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90 text-slate-300" />
            <Link to="/apartments" className="hover:text-amber-600 transition">
              Residences
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90 text-slate-300" />
            <span className="text-slate-700 font-semibold">Compare</span>
          </div>

          {/* Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Compare Residences
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-normal mt-1 leading-relaxed">
                View specifications and amenities side by side.
              </p>
            </div>

            {/* Top Toolbar */}
            {selectedApartments.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Differences toggle */}
                {selectedApartments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      showDifferencesOnly
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                    <span>Highlight Differences</span>
                  </button>
                )}

                {/* Add Residence Button */}
                {selectedApartments.length < MAX_COMPARE && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add Residence ({selectedApartments.length}/{MAX_COMPARE})</span>
                  </button>
                )}

                {/* Clear All */}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 transition px-2 py-1 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-2xs">
            <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-semibold text-slate-500">Loading residences comparison...</p>
          </div>
        ) : selectedApartments.length === 0 ? (
          /* Empty Comparison State */
          <RevealOnScroll>
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center shadow-2xs max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100/60 flex items-center justify-center mx-auto mb-4">
                <GitCompare className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
                No residences selected for comparison
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                Select luxury apartments from the residences catalogue to compare pricing, layouts, and amenities side by side.
              </p>
              <Link
                to="/apartments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                <span>Explore Residences</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </RevealOnScroll>
        ) : (
          /* Comparison Matrix Container */
          <div className="space-y-6">
            
            {/* Scrollable Matrix Layout */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[960px]">
                  
                  {/* Property Header Cards Row */}
                  <div className="grid grid-cols-[200px_repeat(4,1fr)] border-b border-slate-200/80 bg-slate-50/50">
                    {/* Fixed Label Column Header */}
                    <div className="p-6 flex flex-col justify-end border-r border-slate-200/80 bg-slate-50/70">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Comparing
                      </span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5">
                        {selectedApartments.length} of {MAX_COMPARE} Residences
                      </span>
                    </div>

                    {/* Selected Apartments Header Cards */}
                    {selectedApartments.map((apt) => {
                      const aptId = apt.id || (apt as any)._id;
                      const isSold = (apt.status || '').toLowerCase() === 'sold';
                      return (
                        <div
                          key={aptId}
                          className="p-5 border-r border-slate-200/80 last:border-r-0 flex flex-col justify-between relative group hover:bg-white transition"
                        >
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeApartment(aptId)}
                            aria-label={`Remove ${apt.title} from comparison`}
                            className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white backdrop-blur-md flex items-center justify-center transition duration-200 cursor-pointer shadow-2xs"
                            title="Remove from comparison"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div>
                            {/* Image */}
                            <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-3.5 bg-slate-100 relative">
                              <img
                                src={getApartmentImage(apt)}
                                alt={apt.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <div className="absolute bottom-2 left-2">
                                {renderStatusBadge(apt.status)}
                              </div>
                            </div>

                            {/* Title & Complex */}
                            <Link
                              to={`/apartments/${aptId}`}
                              className="font-bold text-slate-900 text-sm hover:text-amber-600 transition line-clamp-1 block"
                            >
                              {apt.title}
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {apt.buildingName || 'Signature Complex'} • {apt.district || apt.city || 'Colombo'}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-base font-bold text-slate-900 tracking-tight tabular-nums">
                                {formatCurrency(apt.price)}
                              </span>
                            </div>
                            {apt.price === bestPrice && selectedApartments.length > 1 && (
                              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md mt-1">
                                Lowest Price
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Slots */}
                    {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                      <div
                        key={`empty-slot-${idx}`}
                        className="p-5 border-r border-slate-200/80 last:border-r-0 flex flex-col items-center justify-center text-center bg-slate-50/20"
                      >
                        <button
                          type="button"
                          onClick={() => setShowAddModal(true)}
                          className="w-full h-full min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 flex flex-col items-center justify-center gap-2 p-4 transition group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition">
                            <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-amber-900 block transition">
                              Add Residence
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Slot {selectedApartments.length + idx + 1} of {MAX_COMPARE}
                            </span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Section 1: Property Overview */}
                  <div className="divide-y divide-slate-100">
                    <div className="bg-slate-100/60 px-6 py-2.5 border-b border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Property Details
                      </span>
                    </div>

                    {/* Acquisition Price Row */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.price) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Purchase Price
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-bold text-slate-900 text-center">
                          {formatCurrency(a.price)}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Price per Sqft Row */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => Math.round((a.price || 0) / (a.size * 10.764 || 1))) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Price per Sq.Ft
                      </div>
                      {selectedApartments.map((a) => {
                        const sqft = Math.round((a.size || 100) * 10.764);
                        const ppsqft = Math.round((a.price || 0) / (sqft || 1));
                        return (
                          <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-semibold text-slate-700 text-center">
                            Rs. {ppsqft.toLocaleString('en-LK')}/sqft
                          </div>
                        );
                      })}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Classification */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.type) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Classification
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-medium text-slate-800 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {a.type || 'Residence'}
                          </span>
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Location / District */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.district || a.city) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Location & District
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-medium text-slate-700 text-center">
                          {a.district || a.city || 'Colombo'}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Tower / Building */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.buildingName) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Tower / Complex
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-medium text-slate-700 text-center">
                          {a.buildingName || 'Signature Tower'}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Floor Level */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.floor) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Floor Level
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-medium text-slate-700 text-center">
                          Floor {a.floor}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Year Built */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.yearBuilt) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Year Built
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-medium text-slate-700 text-center">
                          {a.yearBuilt || '—'}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Status */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.status) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Status
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-medium text-center">
                          {renderStatusBadge(a.status)}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Living Specifications */}
                  <div className="divide-y divide-slate-100 border-t border-slate-200/80">
                    <div className="bg-slate-100/60 px-6 py-2.5 border-b border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Specifications
                      </span>
                    </div>

                    {/* Floor Area */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.size) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Floor Area
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-semibold text-slate-800 text-center">
                          <div>
                            {a.size} m² ({Math.round(a.size * 10.764)} sqft)
                          </div>
                          {a.size === largestSize && selectedApartments.length > 1 && (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.2 rounded-md mt-0.5">
                              Largest Area
                            </span>
                          )}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Bedrooms */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.bedrooms) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Bedrooms
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-semibold text-slate-800 text-center flex items-center justify-center gap-1.5">
                          <Bed className="w-3.5 h-3.5 text-amber-600" />
                          <span>{a.bedrooms === 0 ? 'Studio' : `${a.bedrooms} Bed${a.bedrooms > 1 ? 's' : ''}`}</span>
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>

                    {/* Bathrooms */}
                    <div className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                      showDifferencesOnly && !hasDifference((a) => a.bathrooms) ? 'opacity-30' : 'hover:bg-slate-50/60'
                    }`}>
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Bathrooms
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-xs font-semibold text-slate-800 text-center flex items-center justify-center gap-1.5">
                          <Bath className="w-3.5 h-3.5 text-amber-600" />
                          <span>{a.bathrooms} Bath{a.bathrooms > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Amenities & Facilities */}
                  <div className="divide-y divide-slate-100 border-t border-slate-200/80">
                    <div className="bg-slate-100/60 px-6 py-2.5 border-b border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Amenities & Facilities
                      </span>
                    </div>

                    {AMENITY_KEYS.map((amenity) => {
                      const hasAmenityDiff = hasDifference((a) =>
                        (a.facilities || []).some((f) => f.toLowerCase().includes(amenity.key.toLowerCase()))
                      );
                      return (
                        <div
                          key={amenity.key}
                          className={`grid grid-cols-[200px_repeat(4,1fr)] transition ${
                            showDifferencesOnly && !hasAmenityDiff ? 'opacity-30' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                            {amenity.label}
                          </div>
                          {selectedApartments.map((a) => {
                            const hasIt = (a.facilities || []).some((f) =>
                              f.toLowerCase().includes(amenity.key.toLowerCase())
                            );
                            return (
                              <div
                                key={a.id}
                                className="p-4 border-r border-slate-200/80 last:border-r-0 text-center flex items-center justify-center"
                              >
                                {hasIt ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-bold">—</span>
                                )}
                              </div>
                            );
                          })}
                          {Array.from({ length: emptySlotsCount }).map((_, i) => (
                            <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Section 4: Floor Plan & Layout */}
                  <div className="divide-y divide-slate-100 border-t border-slate-200/80">
                    <div className="bg-slate-100/60 px-6 py-2.5 border-b border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Layout & Floor Plan
                      </span>
                    </div>

                    <div className="grid grid-cols-[200px_repeat(4,1fr)] hover:bg-slate-50/60 transition">
                      <div className="p-4 border-r border-slate-200/80 text-xs font-semibold text-slate-500 bg-slate-50/30">
                        Floor Plan
                      </div>
                      {selectedApartments.map((a) => (
                        <div key={a.id} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-xs">
                          {a.floorPlanUrl ? (
                            <a
                              href={a.floorPlanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2 inline-flex items-center gap-1"
                            >
                              <span>View Plan</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 font-medium">Available on request</span>
                          )}
                        </div>
                      ))}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <div key={i} className="p-4 border-r border-slate-200/80 last:border-r-0 text-center text-slate-300 text-xs">—</div>
                      ))}
                    </div>
                  </div>

                  {/* Section 5: Actions */}
                  <div className="grid grid-cols-[200px_repeat(4,1fr)] bg-slate-50/70 border-t border-slate-200/80">
                    <div className="p-6 border-r border-slate-200/80 flex items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Actions
                      </span>
                    </div>

                    {selectedApartments.map((a) => {
                      const aptId = a.id || (a as any)._id;
                      const isSold = (a.status || '').toLowerCase() === 'sold';
                      return (
                        <div key={aptId} className="p-5 border-r border-slate-200/80 last:border-r-0 flex flex-col gap-2">
                          <Link
                            to={`/apartments/${aptId}`}
                            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition cursor-pointer shadow-2xs block"
                          >
                            View Details
                          </Link>

                          {isSold ? (
                            <span className="text-[11px] font-bold text-rose-600 text-center py-1">
                              ● SOLD — Unavailable
                            </span>
                          ) : (
                            <Link
                              to={`/apartments/${aptId}`}
                              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs text-center transition cursor-pointer block"
                            >
                              Book Viewing
                            </Link>
                          )}
                        </div>
                      );
                    })}

                    {Array.from({ length: emptySlotsCount }).map((_, i) => (
                      <div key={i} className="p-5 border-r border-slate-200/80 last:border-r-0" />
                    ))}
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Add Residence Selection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 z-10 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add Residence</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a residence to add to the comparison matrix</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-4 mb-3">
              <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search by tower, district, layout..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>

            {/* Available Apartments List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {availableApartments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-medium text-slate-400">No additional residences available to add</p>
                </div>
              ) : (
                availableApartments.map((apt) => {
                  const aptId = apt.id || (apt as any)._id;
                  return (
                    <button
                      key={aptId}
                      type="button"
                      onClick={() => addApartment(aptId)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/20 text-left transition group cursor-pointer"
                    >
                      <img
                        src={getApartmentImage(apt)}
                        alt={apt.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-900 transition">
                          {apt.title}
                        </p>
                        <p className="text-xs font-bold text-amber-700 mt-0.5">
                          {formatCurrency(apt.price)}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {apt.buildingName || 'Tower'} • {apt.district || apt.city || 'Colombo'} • {apt.bedrooms} Bed • {apt.size} m²
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center shrink-0 transition">
                        <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-700" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}