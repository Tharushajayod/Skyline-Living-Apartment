import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';

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

const GUEST_FAV_KEY = 'guest_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites when auth state changes (login, logout, or user switch)
  useEffect(() => {
    if (user) {
      apiClient.get<string[]>('/favorites')
        .then((ids) => {
          if (Array.isArray(ids)) {
            setFavorites(ids);
          }
        })
        .catch(() => {});
    } else {
      // Guest mode: load from localStorage
      try {
        const stored = localStorage.getItem(GUEST_FAV_KEY);
        setFavorites(stored ? JSON.parse(stored) : []);
      } catch {
        setFavorites([]);
      }
    }
  }, [user]);

  const isFavorite = useCallback((id: string) => {
    if (!id) return false;
    const cleanId = id.trim();
    const numericPart = cleanId.replace(/\D+/g, '');
    return favorites.some(f => {
      if (f === cleanId) return true;
      if (numericPart && f.replace(/\D+/g, '') === numericPart) return true;
      return false;
    });
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    if (!id) return;
    const cleanId = id.trim();
    const isFav = isFavorite(cleanId);

    // Optimistic UI update
    setFavorites(prev => {
      const next = isFav
        ? prev.filter(f => f !== cleanId && f.replace(/\D+/g, '') !== cleanId.replace(/\D+/g, ''))
        : [...prev, cleanId];

      if (!user) {
        try {
          localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(next));
        } catch {
          // ignore storage error
        }
      }
      return next;
    });

    if (user) {
      if (isFav) {
        apiClient.delete(`/favorites/${cleanId}`).catch(() => {
          setFavorites(prev => [...prev, cleanId]);
        });
      } else {
        apiClient.post(`/favorites/${cleanId}`, {}).catch(() => {
          setFavorites(prev => prev.filter(f => f !== cleanId));
        });
      }
    }
  };

  const count = favorites.length;

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, count }}>
      {children}
    </FavoritesContext.Provider>
  );
}
