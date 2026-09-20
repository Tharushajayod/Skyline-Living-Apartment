import { Link } from 'react-router-dom';
import { Heart, Bed, Bath, Maximize, MapPin, ChevronRight, Sparkles, Eye } from 'lucide-react';
import type { Apartment } from '@/shared/types';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import { formatCurrency } from '@/shared/utils/format';

interface ApartmentCardProps {
  apartment: Apartment;
  compact?: boolean;
}

export default function ApartmentCard({ apartment, compact = false }: ApartmentCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(apartment.id);

  const imageUrl = apartment.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="luxury-card-hover bg-white rounded-3xl border border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col group transition-all duration-300">
      <div className="relative overflow-hidden aspect-[16/10] bg-slate-100">
        <img
          src={imageUrl}
          alt={apartment.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20" />
        
        {/* Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="bg-white/95 backdrop-blur-md text-slate-900 border border-white/80 text-[11px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider shadow-sm">
            {apartment.status}
          </span>
          {apartment.featured && (
            <span className="bg-gradient-to-r from-gold-500 to-amber-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Signature
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(apartment.id); }}
          className="absolute top-3.5 right-3.5 w-9 h-9 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-md text-slate-400 hover:text-rose-500"
          title={fav ? "Remove favorite" : "Add to favorites"}
        >
          <Heart className={`w-4 h-4 transition-all ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
        </button>

        {/* Quick Price Tag Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-gold-300 tracking-wider">Purchase Price</p>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight font-sans tabular-nums drop-shadow-md">
              {formatCurrency(apartment.price)}
            </p>
          </div>
          <span className="text-[11px] font-bold bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-slate-100 font-sans tabular-nums">
            Floor {apartment.floor} · {apartment.type}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-gold-700 transition line-clamp-1">
            {apartment.title}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
            <span>{apartment.district}, {apartment.city}</span>
          </p>

          {!compact && apartment.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">{apartment.description}</p>
          )}
        </div>

        <div>
          {/* Spec Badges */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
            <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl bg-slate-50">
              <Bed className="w-3.5 h-3.5 text-gold-600" />
              <span className="font-bold text-slate-800 text-[11px]">{apartment.bedrooms === 0 ? 'Studio' : `${apartment.bedrooms} Beds`}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl bg-slate-50">
              <Bath className="w-3.5 h-3.5 text-gold-600" />
              <span className="font-bold text-slate-800 text-[11px]">{apartment.bathrooms} Baths</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl bg-slate-50">
              <Maximize className="w-3.5 h-3.5 text-gold-600" />
              <span className="font-bold text-slate-800 text-[11px]">{apartment.size} m²</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Link
              to={`/apartments/${apartment.id}`}
              className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white transition shadow-sm flex items-center justify-center gap-1"
            >
              <span>Inspect Unit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

