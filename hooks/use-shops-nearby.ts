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
  const lastRadiusRef = useRef<number>(radiusKm);
  const lastUserLatRef = useRef<number>(userLat);
  const lastUserLonRef = useRef<number>(userLon);

  // Use refs for the rapidly changing GPS coordinates to avoid recreating fetchShops
  const userLatRef = useRef(userLat);
  const userLonRef = useRef(userLon);
  const radiusKmRef = useRef(radiusKm);
  userLatRef.current = userLat;
  userLonRef.current = userLon;
  radiusKmRef.current = radiusKm;

  const fetchShops = useCallback(async (force = false) => {
    const currentLat = userLatRef.current;
    const currentLon = userLonRef.current;
    const currentRadius = radiusKmRef.current;

    // Validate user location
    if (!currentLat || !currentLon || isNaN(currentLat) || isNaN(currentLon)) {
      console.log("[useShopsNearby] Invalid user location:", currentLat, currentLon);
      setError("Unable to get your location. Please enable location services.");
      setLoading(false);
      return;
    }

    // Skip refetch if user hasn't moved significantly (less than 100m) unless forced
    if (!force && lastFetchLocation.current) {
      const distanceMoved = calculateDistance(
        currentLat,
        currentLon,
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
      console.log(`[useShopsNearby] Fetching shops for location (${currentLat}, ${currentLon}) with radius ${currentRadius}km`);
      
      // Use search API to get shops with calculated ratings
      const response = await fetch('/api/shops/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '',
          categories: [],
          radius_km: currentRadius,
          user_location: {
            latitude: currentLat,
            longitude: currentLon,
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

      // Client-side safety filter: only include shops within the requested radius
      const filteredShops = shopsData.filter((shop: Shop) => {
        if (shop.distance === undefined) return false; // exclude shops with no distance data
        return shop.distance <= currentRadius;
      });

      console.log(`[useShopsNearby] Found ${shopsData.length} shops from API, ${filteredShops.length} within ${currentRadius}km radius`);
      setShops(filteredShops);
      lastFetchLocation.current = { lat: currentLat, lon: currentLon };
    } catch (err) {
      console.error("Error fetching shops:", err);
      setError("Failed to load shops. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - we use refs for all mutable values

  // Store fetchShops in a ref so effects don't depend on the function reference
  const fetchShopsRef = useRef(fetchShops);
  fetchShopsRef.current = fetchShops;

  // Trigger initial fetch and radius changes - force refetch when radius changes
  useEffect(() => {
    const hasFetchedBefore = lastFetchLocation.current !== null;
    if (!hasFetchedBefore || lastRadiusRef.current !== radiusKm) {
      lastRadiusRef.current = radiusKm;
      fetchShopsRef.current(true);
    }
  }, [radiusKm]); // only depend on the actual changing value

  // Separate effect for location changes - only when moved significantly
  useEffect(() => {
    const distanceMoved = calculateDistance(
      userLat,
      userLon,
      lastUserLatRef.current,
      lastUserLonRef.current
    );
    lastUserLatRef.current = userLat;
    lastUserLonRef.current = userLon;

    // Only trigger fetch if moved more than 100m, or if we've never fetched yet
    const hasFetchedBefore = lastFetchLocation.current !== null;
    if (!hasFetchedBefore || distanceMoved >= 0.1) {
      // Debounce the fetch to avoid excessive queries
      const timeoutId = setTimeout(() => {
        fetchShopsRef.current(false);
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [userLat, userLon]); // only depend on the actual changing values

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
