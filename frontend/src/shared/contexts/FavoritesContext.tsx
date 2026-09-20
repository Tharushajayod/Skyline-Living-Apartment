import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '@/shared/services/api';

interface FavoritesContextValue {
  favorites: string[];
  toggleFavorite: (apartmentId: string) => void;
  isFavorite: (apartmentId: string) => boolean;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.get<string[]>('/favorites')
        .then((ids) => {
          if (Array.isArray(ids)) {
            setFavorites(ids);
          }
        })
        .catch(() => {});
    }
  }, []);

  const toggleFavorite = (id: string) => {
    const isFav = favorites.includes(id);
    const token = localStorage.getItem('auth_token');

    // Optimistic UI update
    setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);

    if (token) {
      if (isFav) {
        apiClient.delete(`/favorites/${id}`).catch(() => {
          setFavorites(prev => [...prev, id]);
        });
      } else {
        apiClient.post(`/favorites/${id}`, {}).catch(() => {
          setFavorites(prev => prev.filter(f => f !== id));
        });
      }
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);
  const count = favorites.length;

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, count }}>
      {children}
    </FavoritesContext.Provider>
  );
}
