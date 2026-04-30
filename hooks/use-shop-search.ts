"use client";

import { useState, useCallback, useEffect } from "react";

export interface SearchShop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  distance_km: number;
  rating: number;
  review_count: number;
  response_speed_score: number;
  delivery_available: boolean;
  latitude: number;
  longitude: number;
  logo_url?: string;
}

export interface SearchFilters {
  query: string;
  categories: string[];
  radiusKm: number;
}

interface SearchResponse {
  data: SearchShop[];
  total_count: number;
  pagination: {
    page: number;
    limit: number;
    has_more: boolean;
  };
}

export function useShopSearch(
  userLat: number | null,
  userLon: number | null
) {
  const [results, setResults] = useState<SearchShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const search = useCallback(
    async (filters: SearchFilters) => {
      if (!userLat || !userLon) {
        setError("Location not available");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/shops/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: filters.query,
            categories: filters.categories,
            radius_km: filters.radiusKm,
            user_location: {
              latitude: userLat,
              longitude: userLon,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Search failed");
        }

        const data: SearchResponse = await response.json();
        setResults(data.data);
        setTotalCount(data.total_count);
        setHasMore(data.pagination.has_more);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to search. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [userLat, userLon]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setTotalCount(0);
    setHasMore(false);
  }, []);

  return {
    results,
    loading,
    error,
    totalCount,
    hasMore,
    search,
    clearResults,
  };
}

// Recent searches management
const RECENT_SEARCHES_KEY = "zaymap_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  id: string;
  query: string;
  categories: string[];
  radiusKm: number;
  timestamp: number;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save to localStorage
  const saveRecentSearch = useCallback((search: Omit<RecentSearch, "id" | "timestamp">) => {
    if (typeof window === "undefined") return;

    const newSearch: RecentSearch = {
      ...search,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    setRecentSearches((prev) => {
      // Remove duplicates (same query and categories)
      const filtered = prev.filter(
        (s) => !(s.query === search.query && JSON.stringify(s.categories) === JSON.stringify(search.categories))
      );
      
      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    if (typeof window === "undefined") return;
    
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const removeRecentSearch = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  return {
    recentSearches,
    saveRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
