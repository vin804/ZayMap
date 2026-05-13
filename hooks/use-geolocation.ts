"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MANDALAY_COORDINATES } from "@/lib/leaflet-config";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Hardcoded users that should always show Mandalay center
const MANDALAY_USERS = [
  "MP0wr2BYdicxFCKqNzA2RKIyoAi2",
  "3sPa1kDv6JcC2nEHeuJQOeL7Xl53",
];

const MANDALAY_CENTER = {
  lat: 21.9747,
  lng: 96.0836,
};

export interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
  permission: "granted" | "denied" | "prompt" | null;
}

export function useGeolocation() {
  const [authReady, setAuthReady] = useState(false);
  const [isMandalayUser, setIsMandalayUser] = useState(false);

  // Wait for Firebase Auth to initialize before doing anything
  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, (user) => {
      setIsMandalayUser(MANDALAY_USERS.includes(user?.uid || ""));
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const [state, setState] = useState<GeolocationState>({
    latitude: (MANDALAY_COORDINATES as [number, number])[0],
    longitude: (MANDALAY_COORDINATES as [number, number])[1],
    accuracy: 0,
    loading: true,
    error: null,
    permission: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (!authReady) return; // Don't do anything until we know who the user is

    // Hardcoded Mandalay users: skip GPS entirely
    if (isMandalayUser) {
      setState({
        latitude: MANDALAY_CENTER.lat,
        longitude: MANDALAY_CENTER.lng,
        accuracy: 0,
        loading: false,
        error: null,
        permission: "granted",
      });
      return;
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = roundCoord(position.coords.latitude);
        const lng = roundCoord(position.coords.longitude);
        setState((prev) => {
          if (prev.latitude === lat && prev.longitude === lng) return prev;
          return {
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
            loading: false,
            error: null,
            permission: "granted",
          };
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
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, [authReady, isMandalayUser]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  const retry = useCallback(() => {
    startWatching();
  }, [startWatching]);

  const setLocation = useCallback((lat: number, lng: number) => {
    setState((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      accuracy: 0,
      loading: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    isDefaultLocation:
      (state.latitude === (MANDALAY_COORDINATES as [number, number])[0] &&
        state.longitude === (MANDALAY_COORDINATES as [number, number])[1]) ||
      (state.latitude === MANDALAY_CENTER.lat &&
        state.longitude === MANDALAY_CENTER.lng),
    retry,
    setLocation,
  };
}

function roundCoord(val: number): number {
  return Math.round(val * 10000) / 10000;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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