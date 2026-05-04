"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { calculateDistance } from "./use-geolocation";

export interface Shop {
  shopId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  rating?: number;
  logoUrl?: string;
  createdAt?: Date;
  distance?: number;
}

interface UseShopsNearbyOptions {
  userLat: number;
  userLon: number;
  radiusKm: number;
}

export function useShopsNearby({ userLat, userLon, radiusKm }: UseShopsNearbyOptions) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchLocation = useRef<{ lat: number; lon: number } | null>(null);

  const fetchShops = useCallback(async (force = false) => {
    // Validate user location
    if (!userLat || !userLon || isNaN(userLat) || isNaN(userLon)) {
      console.log("[useShopsNearby] Invalid user location:", userLat, userLon);
      setError("Unable to get your location. Please enable location services.");
      setLoading(false);
      return;
    }

    // Skip refetch if user hasn't moved significantly (less than 100m) unless forced
    if (!force && lastFetchLocation.current) {
      const distanceMoved = calculateDistance(
        userLat,
        userLon,
        lastFetchLocation.current.lat,
        lastFetchLocation.current.lon
      );
      if (distanceMoved < 0.1) { // Less than 100 meters
        console.log(`[useShopsNearby] Skipping refetch - only moved ${(distanceMoved * 1000).toFixed(0)}m`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[useShopsNearby] Fetching shops for location (${userLat}, ${userLon}) with radius ${radiusKm}km`);
      
      // Use search API to get shops with calculated ratings
      const response = await fetch('/api/shops/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '',
          categories: [],
          radius_km: radiusKm,
          user_location: {
            latitude: userLat,
            longitude: userLon,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      
      const result = await response.json();
      const apiShops = result.data || [];
      
      console.log(`[useShopsNearby] Fetched ${apiShops.length} shops from Search API`);

      // Convert API response to Shop format
      const shopsData: Shop[] = apiShops.map((shop: {
        shop_id: string;
        name: string;
        category: string;
        latitude: number;
        longitude: number;
        distance_km?: number;
        rating?: number;
        logo_url?: string;
        address?: string;
        phone?: string;
      }) => ({
        shopId: shop.shop_id,
        name: shop.name,
        category: shop.category,
        latitude: shop.latitude,
        longitude: shop.longitude,
        distance: shop.distance_km,
        rating: shop.rating,
        logoUrl: shop.logo_url,
        address: shop.address || "",
        phone: shop.phone,
      }));

      console.log(`[useShopsNearby] Found ${shopsData.length} shops within ${radiusKm}km`);
      setShops(shopsData);
      lastFetchLocation.current = { lat: userLat, lon: userLon };
    } catch (err) {
      console.error("Error fetching shops:", err);
      setError("Failed to load shops. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userLat, userLon, radiusKm]);

  useEffect(() => {
    // Debounce the fetch to avoid excessive queries
    const timeoutId = setTimeout(() => {
      fetchShops(false); // Don't force - check distance threshold
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [fetchShops]);

  const retry = useCallback(() => {
    fetchShops(true); // Force refetch on manual retry
  }, [fetchShops]);

  return {
    shops,
    loading,
    error,
    retry,
  };
}

// Category to emoji mapping
export const categoryEmojis: Record<string, string> = {
  Clothing: "👕",
  Electronics: "📱",
  "Food & Beverage": "🍔",
  Food: "🍔",
  Beverage: "☕",
  Grocery: "🛒",
  Pharmacy: "💊",
  Beauty: "💄",
  "Home & Garden": "🏠",
  Sports: "⚽",
  Books: "📚",
  Toys: "🧸",
  Jewelry: "💍",
  Furniture: "🪑",
  Automotive: "🚗",
  Pet: "🐾",
  "Health & Wellness": "💪",
  Services: "🔧",
  Education: "🎓",
  Entertainment: "🎬",
  General: "🏪",
  Other: "🏪",
};

export function getCategoryEmoji(category: string): string {
  return categoryEmojis[category] || categoryEmojis.General;
}
