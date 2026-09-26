/**
 * High-speed in-memory & sessionStorage cache for instant UI rendering (SWR pattern)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const fastCache = {
  get<T>(key: string, maxAgeMs = 120000): T | null {
    // 1. Check memory cache first (0ms)
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < maxAgeMs) {
      return mem.data as T;
    }

    // 2. Check sessionStorage
    try {
      const stored = sessionStorage.getItem(`skyline_cache_${key}`);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < maxAgeMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Ignore sessionStorage parse errors
    }

    return null;
  },

  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    try {
      sessionStorage.setItem(`skyline_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Storage quota exceeded or disabled, memory cache will suffice
    }
  },

  invalidate(pattern?: string): void {
    if (!pattern) {
      memoryCache.clear();
      try {
        const keys = Object.keys(sessionStorage);
        keys.forEach((k) => {
          if (k.startsWith('skyline_cache_')) sessionStorage.removeItem(k);
        });
      } catch {}
      return;
    }

    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((k) => {
        if (k.startsWith('skyline_cache_') && k.includes(pattern)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {}
  },
};
