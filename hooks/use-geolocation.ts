"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { YANGON_COORDINATES } from "@/lib/leaflet-config";

export interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
  permission: "granted" | "denied" | "prompt" | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: (YANGON_COORDINATES as [number, number])[0],
    longitude: (YANGON_COORDINATES as [number, number])[1],
    accuracy: 0,
    loading: true,
    error: null,
    permission: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Clear any existing watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Watch position for real-time updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permission: "granted",
        });
      },
      (err) => {
        let errorMessage = "Unable to retrieve your location.";
        let permissionState: "granted" | "denied" | "prompt" | null = "denied";

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Enable location access to see shops near you.";
            permissionState = "denied";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            permissionState = "denied";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out. Using default location.";
            permissionState = "denied";
            break;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          permission: permissionState,
        }));
      },
      {
        enableHighAccuracy: false, // Less frequent updates for better performance
        timeout: 10000,
        maximumAge: 30000, // 30 seconds cache - update only when significant movement
      }
    );
  }, []);

  useEffect(() => {
    startWatching();

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  const retry = useCallback(() => {
    startWatching();
  }, [startWatching]);

  return {
    ...state,
    isYangonDefault:
      state.latitude === (YANGON_COORDINATES as [number, number])[0] &&
      state.longitude === (YANGON_COORDINATES as [number, number])[1],
    retry,
  };
}

// Haversine formula to calculate distance between two coordinates in kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
