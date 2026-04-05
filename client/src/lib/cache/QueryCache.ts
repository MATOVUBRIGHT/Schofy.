// client/src/lib/cache/QueryCache.ts
// Multi-level caching for frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QueryCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get or set - loads from cache or calls fetchFn
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.debug(`✓ Cache hit: ${key}`);
      return cached;
    }

    console.debug(`✗ Cache miss: ${key}, fetching...`);
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate entries by pattern (e.g., "students:*")
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, { ttl, timestamp }]) => ({
        key,
        age: Date.now() - timestamp,
        ttl,
      })),
    };
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.debug(`🧹 Cache cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Destructor
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Export singleton instance
export const queryCache = new QueryCacheService();

// Hook for React components
import { useCallback } from 'react';

export function useQueryCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) {
  const { ttl, enabled = true } = options;

  return useCallback(async () => {
    if (!enabled) return fetchFn();
    return queryCache.getOrSet(key, fetchFn, ttl);
  }, [key, fetchFn, ttl, enabled]);
}
