import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sparkles,
  Receipt,
  Search,
  KeyRound,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { apartmentService } from '@/shared/services/apartmentService';
import type { PurchasedApartment } from '@/shared/types';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import Button from '@/shared/components/ui/Button';

export default function MyApartmentsPage() {
  const { user } = useAuth();
  const [apartments, setApartments] = useState<PurchasedApartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apartmentService
      .getMyPurchased()
      .then((data) => {
        if (isMounted) {
          setApartments(Array.isArray(data) ? data : []);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error('Error fetching purchased apartments:', err);
          setError(
            err?.message || 'Unable to load your purchased apartments. Please try again later.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-bold mb-3 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Verified Ownership Portfolio</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight font-serif">
                My Apartments
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1.5 leading-relaxed">
                Apartments you have successfully purchased with confirmed deed transfers and ownership records.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/apartments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Explore Catalog</span>
              </Link>
              <Link
                to="/payments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Payment Records</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-4 animate-pulse"
              >
                <div className="h-56 bg-slate-100 rounded-2xl w-full" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
                  <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-10 bg-slate-50 rounded-xl" />
                  <div className="h-10 bg-slate-50 rounded-xl" />
                  <div className="h-10 bg-slate-50 rounded-xl" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-2xs">
            <h3 className="text-sm font-bold text-rose-900 mb-1">Failed to Load Portfolio</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : apartments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center shadow-2xs max-w-2xl mx-auto space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-10 h-10 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                You haven't purchased any apartments yet.
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                When you complete your reservation, fulfill all payment milestones, and the sales agreement is finalized, your deed records and purchased luxury properties will appear here.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/apartments"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-sm hover:shadow"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Browse Residences</span>
              </Link>
              <Link
                to="/reservations"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                <span>Check Active Holds</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Purchased Apartments Grid */
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing <strong className="text-slate-900">{apartments.length}</strong> purchased residence{apartments.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Verified Deeds
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {apartments.map((apt) => {
                const coverImage =
                  apt.imageUrl ||
                  (apt.images && apt.images.length > 0 ? apt.images[0] : '');

                return (
                  <div
                    key={apt.saleId || apt.apartmentId}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    {/* Apartment Image with Overlays */}
                    <div className="relative h-60 w-full overflow-hidden bg-slate-100 shrink-0">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={apt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 gap-2">
                          <Building2 className="w-12 h-12 text-slate-300" />
                          <span className="text-xs font-semibold">Skyline Luxury Residences</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Purchased</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/85 backdrop-blur-xs text-white border border-white/20">
                          <FileCheck2 className="w-3 h-3 text-amber-400" />
                          <span>{apt.ownershipStatus || 'Deed Transferred'}</span>
                        </span>
                      </div>

                      {/* Bottom Banner on Image: Unit Identifier */}
                      <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center justify-between text-white text-xs font-bold border border-white/10">
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Unit {apt.apartmentNumber || apt.apartmentId}</span>
                        </span>
                        <span className="text-[11px] text-slate-300 font-normal">
                          Floor {apt.floor ?? 1}
                        </span>
                      </div>
                    </div>

                    {/* Apartment Details Body */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                              {apt.buildingName || apt.type || 'Luxury Residence'}
                            </p>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-700 transition">
                              {apt.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {apt.address ? `${apt.address}, ${apt.city}` : apt.city || 'Colombo, Sri Lanka'}
                          </span>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bedrooms</span>
                          <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                            {apt.bedrooms ?? '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center border-x border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baths</span>
                          <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-slate-400" />
                            {apt.bathrooms ?? '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area</span>
                          <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                            {apt.size ? `${apt.size.toLocaleString()} sq.ft` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Purchase Metadata */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Purchase Date
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatDate(apt.purchaseDate)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            Purchase Amount
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {formatCurrency(apt.purchasePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Action Button: View Apartment */}
                      <div className="pt-2">
                        <Link
                          to={`/apartments/${apt.apartmentId}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs group-hover:bg-amber-500 group-hover:text-slate-950 duration-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Apartment</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
