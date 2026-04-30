"use client";

import { useState, useCallback } from "react";

export interface ProductResult {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  shop_id: string;
  shop_name: string;
  shop_name_mm?: string;
  image_url?: string;
  price: number;
  booking_fee: number;
  currency: string;
  freshness_status: "green" | "orange" | "red";
  uploaded_at: string;
  shop_rating: number;
  distance_km: number;
}

export interface ProductSearchMeta {
  total_count: number;
  query: string;
  radius_km: number;
  sorted_by?: string;
}

interface ProductSearchRequest {
  query: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  language?: "en" | "my";
}

export function useProductSearch() {
  const [results, setResults] = useState<ProductResult[]>([]);
  const [meta, setMeta] = useState<ProductSearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (request: ProductSearchRequest) => {
      if (!request.query || request.query.trim().length < 2) {
        setError("Search term must be at least 2 characters");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/products/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            // No results is not an error, just empty results
            setResults([]);
            setMeta(data.meta || null);
            setError(null);
          } else {
            throw new Error(data.error || "Search failed");
          }
        } else {
          setResults(data.data);
          setMeta(data.meta);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search unavailable. Please try again.");
        setResults([]);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setMeta(null);
    setError(null);
  }, []);

  return {
    results,
    meta,
    loading,
    error,
    search,
    clearResults,
  };
}
