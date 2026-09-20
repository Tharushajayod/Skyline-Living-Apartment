import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { apartments } from '@/shared/mockData';
import { useFavorites } from '@/shared/contexts/FavoritesContext';
import ApartmentCard from '@/shared/components/ApartmentCard';
import EmptyState from '@/shared/components/ui/EmptyState';
import Button from '@/shared/components/ui/Button';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const favApartments = apartments.filter(a => favorites.includes(a.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy-900">My Favorites</h1>
        <p className="text-navy-400 mt-1">{favApartments.length} saved apartment{favApartments.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="skeleton h-56 w-full" />
              <div className="p-5 space-y-4">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : favApartments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card">
          <EmptyState
            icon={<Heart className="w-12 h-12 text-navy-300" />}
            title="No favorites yet"
            description="Save apartments you're interested in by clicking the heart icon on any property card."
            action={<Link to="/apartments"><Button icon={<Search className="w-4 h-4" />}>Browse Apartments</Button></Link>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favApartments.map(apt => <ApartmentCard key={apt.id} apartment={apt} />)}
        </div>
      )}
    </div>
  );
}
