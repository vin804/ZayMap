"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    if (!db) {
      setError("Database not initialized");
      setLoading(false);
      return;
    }

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
      
      // Fetch all shops (for MVP, client-side filtering)
      const shopsRef = collection(db, "shops");
      const q = query(shopsRef, limit(500)); // Limit for performance
      const snapshot = await getDocs(q);
      
      console.log(`[useShopsNearby] Fetched ${snapshot.size} shops from Firestore`);

      const shopsData: Shop[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Handle both GeoPoint location field and separate lat/lng fields
        const latitude = data.location?.latitude ?? data.latitude ?? 0;
        const longitude = data.location?.longitude ?? data.longitude ?? 0;
        
        if (latitude === 0 || longitude === 0) {
          console.warn(`[useShopsNearby] Shop ${doc.id} has invalid coordinates`);
          return;
        }
        
        const shop: Shop = {
          shopId: doc.id,
          name: data.name || "Unnamed Shop",
          category: data.category || "General",
          latitude,
          longitude,
          address: data.address || "",
          phone: data.phone,
          rating: data.rating,
          logoUrl: data.logo_url || data.logoUrl,
          createdAt: data.createdAt?.toDate?.(),
        };

        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          userLat,
          userLon,
          shop.latitude,
          shop.longitude
        );

        // Only include shops within radius
        if (distance <= radiusKm) {
          shopsData.push({ ...shop, distance });
          console.log(`[useShopsNearby] Shop ${doc.id} included: ${distance.toFixed(2)}km away`);
        } else {
          console.log(`[useShopsNearby] Shop ${doc.id} excluded: ${distance.toFixed(2)}km > ${radiusKm}km`);
        }
      });

      // Sort by distance (closest first)
      shopsData.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

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
