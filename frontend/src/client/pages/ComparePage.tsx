import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCompare, X, Plus, Check, Building2, Search, ArrowRight,
  ChevronRight, Home, Sparkles, CheckCircle2, Bed, Bath, Maximize, Eye
} from 'lucide-react';
import type { Apartment } from '@/shared/types';
import { apartmentService } from '@/shared/services/apartmentService';
import { formatCurrency } from '@/shared/utils/format';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import EmptyState from '@/shared/components/ui/EmptyState';

const MAX_COMPARE = 4;

export default function ComparePage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load real apartments from database
  useEffect(() => {
    let active = true;
    setLoading(true);
    apartmentService.getAll()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        setApartments(list);
        if (list.length >= 3) {
          setSelectedIds([
            list[0].id || (list[0] as any)._id,
            list[1].id || (list[1] as any)._id,
            list[2].id || (list[2] as any)._id
          ]);
        } else if (list.length === 2) {
          setSelectedIds([list[0].id || (list[0] as any)._id, list[1].id || (list[1] as any)._id]);
        } else if (list.length === 1) {
          setSelectedIds([list[0].id || (list[0] as any)._id]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedApartments = useMemo(() => {
    return selectedIds
      .map((id) => apartments.find((a) => (a.id || (a as any)._id) === id))
      .filter(Boolean) as Apartment[];
  }, [selectedIds, apartments]);

  const availableApartments = useMemo(() => {
    return apartments.filter(
      (a) => {
        const aptId = a.id || (a as any)._id;
        const matchesSearch = searchQuery === '' ||
          (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.city || '').toLowerCase().includes(searchQuery.toLowerCase());
        return !selectedIds.includes(aptId) && matchesSearch;
      }
    );
  }, [apartments, selectedIds, searchQuery]);

  const addApartment = (id: string) => {
    if (selectedIds.length >= MAX_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
    setShowAddMenu(false);
    setSearchQuery('');
  };

  const removeApartment = (id: string) => {
    setSelectedIds((prev) => prev.filter((s) => s !== id));
  };

  const bestPrice = Math.min(...selectedApartments.map((a) => a.price || 0));
  const largestSize = Math.max(...selectedApartments.map((a) => a.size || 0));

  const getApartmentImage = (apt: any) => {
    if (apt.imageUrl) return apt.imageUrl;
    if (apt.images && apt.images.length > 0) {
      return typeof apt.images[0] === 'string' ? apt.images[0] : apt.images[0]?.url;
    }
    if (apt.coverImage) return apt.coverImage;
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';
  };

  const comparisonRows = [
    {
      label: 'Purchase Price',
      render: (a: Apartment) => (
        <div>
          <span className={`font-extrabold text-base md:text-lg font-sans tabular-nums ${a.price === bestPrice && selectedApartments.length > 1 ? 'text-emerald-600' : 'text-slate-900'}`}>
            {formatCurrency(a.price)}
          </span>
          {a.price === bestPrice && selectedApartments.length > 1 && (
            <span className="block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit mx-auto mt-1">
              Lowest Price
            </span>
          )}
        </div>
      ),
    },
    {
      label: 'Price per Sqft',
      render: (a: Apartment) => {
        const sqft = Math.round((a.size || 100) * 10.764);
        const ppsqft = Math.round((a.price || 0) / (sqft || 1));
        return (
          <span className="text-xs font-bold text-slate-700">
            Rs. {ppsqft.toLocaleString()}/sqft
          </span>
        );
      },
    },
    {
      label: 'Classification',
      render: (a: Apartment) => (
        <span className="font-bold text-slate-800 text-xs px-2.5 py-1 bg-slate-100 rounded-lg">
          {a.type || 'Residence'}
        </span>
      ),
    },
    {
      label: 'Availability',
      render: (a: Apartment) => (
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-gold-50 border border-gold-200 text-gold-900">
          {a.status}
        </span>
      ),
    },
    {
      label: 'Bedrooms',
      render: (a: Apartment) => (
        <span className="font-bold text-slate-800 text-xs flex items-center justify-center gap-1">
          <Bed className="w-3.5 h-3.5 text-gold-600" />
          {a.bedrooms === 0 ? 'Studio' : `${a.bedrooms} Beds`}
        </span>
      ),
    },
    {
      label: 'Bathrooms',
      render: (a: Apartment) => (
        <span className="font-bold text-slate-800 text-xs flex items-center justify-center gap-1">
          <Bath className="w-3.5 h-3.5 text-gold-600" />
          {a.bathrooms} Baths
        </span>
      ),
    },
    {
      label: 'Floor Area',
      render: (a: Apartment) => (
        <div>
          <span className={`font-bold text-xs flex items-center justify-center gap-1 ${a.size === largestSize && selectedApartments.length > 1 ? 'text-amber-700' : 'text-slate-800'}`}>
            <Maximize className="w-3.5 h-3.5 text-gold-600" />
            {a.size} m² ({Math.round(a.size * 10.764)} sqft)
          </span>
          {a.size === largestSize && selectedApartments.length > 1 && (
            <span className="block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit mx-auto mt-1">
              Largest Space
            </span>
          )}
        </div>
      ),
    },
    {
      label: 'Floor Level',
      render: (a: Apartment) => <span className="text-slate-700 text-xs font-medium">Floor {a.floor}</span>,
    },
    {
      label: 'Location / District',
      render: (a: Apartment) => <span className="text-slate-700 text-xs font-bold">{a.district || a.city || 'Colombo'}</span>,
    },
    {
      label: 'Tower / Complex',
      render: (a: Apartment) => <span className="text-slate-700 text-xs font-medium">{a.buildingName || 'Signature Tower'}</span>,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-20 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[350px] bg-gradient-to-b from-gold-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-b from-white via-champagne-50/40 to-[#fafbfe] border-b border-gold-200/60 pt-10 pb-8 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
            <Link to="/" className="hover:text-gold-700 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-gold-600" />
              <span>Skyline Living</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link to="/apartments" className="hover:text-gold-700 transition">Apartments</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-gold-800 font-bold">Property Comparison</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                Feature Comparison
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 tracking-tight flex items-center gap-3">
                Compare Apartments
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                Compare up to {MAX_COMPARE} properties side by side on price, floor area, layout, and amenities.
              </p>
            </div>

            {selectedApartments.length < MAX_COMPARE && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-gold-500/20 flex items-center gap-2 cursor-pointer transition hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Residence ({selectedApartments.length}/{MAX_COMPARE})</span>
                </button>

                {/* Add dropdown modal */}
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 z-30 luxury-glass bg-white rounded-3xl shadow-2xl border border-gold-200 p-4 w-80 sm:w-96 backdrop-blur-xl animate-scaleIn">
                    <div className="relative mb-3">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-600" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by tower, district…"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 no-scrollbar">
                      {availableApartments.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No more residences available to add</p>
                      ) : (
                        availableApartments.map((apt) => {
                          const aptId = apt.id || (apt as any)._id;
                          return (
                            <button
                              key={aptId}
                              onClick={() => addApartment(aptId)}
                              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gold-50/80 border border-slate-100 hover:border-gold-300 transition text-left cursor-pointer"
                            >
                              <img src={getApartmentImage(apt)} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 truncate font-serif">{apt.title}</p>
                                <p className="text-[11px] text-gold-700 font-bold">{formatCurrency(apt.price)}</p>
                                <p className="text-[10px] text-slate-500 truncate">{apt.district || apt.city}</p>
                              </div>
                              <Plus className="w-4 h-4 text-gold-600 shrink-0" />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Canvas (Full Width max-w-[1600px]) */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {selectedApartments.length === 0 ? (
          <div className="luxury-glass rounded-3xl border border-white/90 p-12 text-center shadow-sm">
            <EmptyState
              icon={<GitCompare className="w-12 h-12 text-gold-400" />}
              title="No residences currently selected for comparison"
              description="Choose at least two residences to compare their architectural specifications side by side."
              action={
                apartments.length > 0 ? (
                  <button
                    onClick={() => addApartment(apartments[0].id || (apartments[0] as any)._id)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold text-xs shadow-md"
                  >
                    Add First Residence
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="luxury-glass rounded-3xl border border-white/90 shadow-[0_15px_45px_rgba(180,83,9,0.06)] overflow-hidden backdrop-blur-xl">
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
                <thead>
                  <tr className="border-b border-gold-200/60 bg-gradient-to-r from-white via-champagne-50/40 to-white">
                    <th className="w-56 p-6 text-xs font-black uppercase tracking-widest text-gold-800">
                      Property Details
                    </th>
                    {selectedApartments.map((apt) => {
                      const aptId = apt.id || (apt as any)._id;
                      return (
                        <th key={aptId} className="p-6 border-l border-gold-100 relative align-top font-normal">
                          <button
                            onClick={() => removeApartment(aptId)}
                            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition duration-200 hover:scale-105 cursor-pointer"
                            title="Remove this residence from comparison"
                          >
                            <X className="w-4 h-4 stroke-[3]" />
                            <span>Remove</span>
                          </button>
                          <div className="h-40 rounded-2xl overflow-hidden mb-3.5 bg-slate-100 relative group mt-8">
                            <img src={getApartmentImage(apt)} alt={apt.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          </div>
                          <Link to={`/apartments/${aptId}`} className="block">
                            <h3 className="font-serif font-bold text-slate-900 text-base hover:text-gold-700 transition truncate pr-2">
                              {apt.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{apt.district || apt.city} • Floor {apt.floor}</p>
                        </th>
                      );
                    })}

                    {/* Add Column Slot if room */}
                    {selectedApartments.length < MAX_COMPARE && (
                      <th className="p-6 border-l border-gold-100 bg-gold-50/20 text-center align-middle font-normal">
                        <button
                          onClick={() => setShowAddMenu(true)}
                          className="w-full h-48 rounded-2xl border-2 border-dashed border-gold-300 hover:border-gold-500 hover:bg-gold-50/40 flex flex-col items-center justify-center gap-2 text-gold-700 transition cursor-pointer"
                        >
                          <Plus className="w-7 h-7 text-gold-600" />
                          <span className="text-xs font-bold uppercase tracking-wider">Add Unit</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gold-100/60 text-xs">
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="hover:bg-gold-50/30 transition">
                      <td className="p-4 font-extrabold uppercase tracking-wider text-slate-600 bg-slate-50/50">
                        {row.label}
                      </td>
                      {selectedApartments.map((apt) => {
                        const aptId = apt.id || (apt as any)._id;
                        return (
                          <td key={`${row.label}-${aptId}`} className="p-4 border-l border-gold-100 text-center">
                            {row.render(apt)}
                          </td>
                        );
                      })}
                      {selectedApartments.length < MAX_COMPARE && (
                        <td className="p-4 border-l border-gold-100 bg-gold-50/10" />
                      )}
                    </tr>
                  ))}

                  {/* Amenities / Facilities Checklist */}
                  <tr className="hover:bg-gold-50/30 transition">
                    <td className="p-4 font-extrabold uppercase tracking-wider text-slate-600 bg-slate-50/50 align-top">
                      Included Amenities
                    </td>
                    {selectedApartments.map((apt) => {
                      const aptId = apt.id || (apt as any)._id;
                      const facilities = apt.facilities || [];
                      return (
                        <td key={`facilities-${aptId}`} className="p-4 border-l border-gold-100 align-top">
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {facilities.slice(0, 6).map((f) => (
                              <span key={f} className="text-[10px] font-bold px-2.5 py-1 bg-white text-slate-800 rounded-lg border border-gold-100 shadow-2xs">
                                ✓ {f}
                              </span>
                            ))}
                            {facilities.length > 6 && (
                              <span className="text-[10px] font-bold px-2 py-1 bg-gold-100 text-gold-900 rounded-lg">
                                +{facilities.length - 6} more
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {selectedApartments.length < MAX_COMPARE && (
                      <td className="p-4 border-l border-gold-100 bg-gold-50/10" />
                    )}
                  </tr>

                  {/* Action CTA Row */}
                  <tr className="bg-gradient-to-r from-white via-champagne-50/50 to-white">
                    <td className="p-6 font-black text-xs uppercase tracking-widest text-gold-800">
                      Reserve / Inspect
                    </td>
                    {selectedApartments.map((apt) => {
                      const aptId = apt.id || (apt as any)._id;
                      return (
                        <td key={`action-${aptId}`} className="p-6 border-l border-gold-100 text-center">
                          <Link
                            to={`/apartments/${aptId}`}
                            className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-gold-500/20 transition hover:scale-102"
                          >
                            Inspect & Place Hold
                          </Link>
                        </td>
                      );
                    })}
                    {selectedApartments.length < MAX_COMPARE && (
                      <td className="p-6 border-l border-gold-100" />
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Legend */}
        {selectedApartments.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Emerald highlights lowest acquisition price
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Amber highlights maximum floor area
            </span>
          </div>
        )}

      </div>

      {/* Modal backdrop click */}
      {showAddMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)} />
      )}

    </div>
  );
}