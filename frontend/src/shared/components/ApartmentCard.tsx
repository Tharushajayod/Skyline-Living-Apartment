import { Link } from 'react-router-dom';
import { Heart, Bed, Bath, Maximize, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import type { Apartment } from '@/shared/types';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { formatCurrency } from '@/shared/utils/format';

interface ApartmentCardProps {
  apartment: Apartment;
  compact?: boolean;
}

export default function ApartmentCard({ apartment, compact = false }: ApartmentCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(apartment.id);

  const imageUrl =
    apartment.images?.[0]?.url ||
    (apartment as any).imageUrl ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  const isSold = (apartment.status || '').toLowerCase() === 'sold';
  const isReserved = (apartment.status || '').toLowerCase() === 'reserved';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full">
      
      {/* Card Image Area */}
      <div className="relative overflow-hidden aspect-[16/10] bg-slate-100">
        <img
          src={imageUrl}
          alt={apartment.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
        
        {/* Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
          {isSold ? (
            <span className="bg-rose-50/95 backdrop-blur-md text-rose-800 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
              ● Sold
            </span>
          ) : isReserved ? (
            <span className="bg-amber-50/95 backdrop-blur-md text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
              Reserved
            </span>
          ) : (
            <span className="bg-white/95 backdrop-blur-md text-slate-900 border border-white/80 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
              {apartment.status || 'Available'}
            </span>
          )}

          {apartment.featured && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-950" /> Signature
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(apartment.id);
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-400 hover:text-rose-500 cursor-pointer"
          title={fav ? 'Remove favorite' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 transition-all ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
        </button>

        {/* Bottom Price Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
          <div>
            <p className="text-[9px] uppercase font-bold text-amber-300 tracking-wider">Purchase Price</p>
            <p className="text-lg sm:text-xl font-black text-white tracking-tight tabular-nums drop-shadow-sm">
              {formatCurrency(apartment.price)}
            </p>
          </div>
          <span className="text-[10px] font-bold bg-slate-950/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 text-slate-100 tabular-nums">
            Floor {apartment.floor} · {apartment.type}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-1">
            {apartment.title}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{apartment.district}, {apartment.city} • {apartment.buildingName || 'Skyline Tower'}</span>
          </p>

          {!compact && apartment.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed font-normal">
              {apartment.description}
            </p>
          )}
        </div>

        <div>
          {/* Spec Badges */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
            <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-slate-50">
              <Bed className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-slate-800 text-[11px]">
                {apartment.bedrooms === 0 ? 'Studio' : `${apartment.bedrooms} Beds`}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-slate-50">
              <Bath className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-slate-800 text-[11px]">{apartment.bathrooms} Baths</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-slate-50">
              <Maximize className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-slate-800 text-[11px]">{apartment.size} m²</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Link
              to={`/apartments/${apartment.id}`}
              className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

