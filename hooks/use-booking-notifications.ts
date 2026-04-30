"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

interface Booking {
  id: string;
  product_name: string;
  user_name?: string;
  status: string;
  created_at: string;
}

interface BookingNotification {
  id: string;
  product_name: string;
  user_name: string;
  timestamp: string;
}

export function useBookingNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const processedBookingsRef = useRef<Set<string>>(new Set());

  // Fetch shop ID for the current user
  useEffect(() => {
    if (!user?.uid) return;

    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setShopId(data.data?.shop_id || null);
        }
      } catch (err) {
        console.error("Failed to fetch shop:", err);
      }
    };

    fetchShop();
  }, [user?.uid]);

  // Poll for new bookings
  const checkNewBookings = useCallback(async () => {
    if (!shopId) return;

    try {
      const res = await fetch(`/api/shops/${shopId}/bookings`);
      if (!res.ok) return;

      const data = await res.json();
      const bookings: Booking[] = data.data || [];

      // Find pending bookings that are new (created after last check and not processed)
      const newBookings = bookings.filter((booking) => {
        if (booking.status !== "pending") return false;
        if (processedBookingsRef.current.has(booking.id)) return false;
        
        const bookingTime = new Date(booking.created_at).getTime();
        const lastCheckedTime = new Date(lastCheckedRef.current).getTime();
        
        return bookingTime > lastCheckedTime;
      });

      if (newBookings.length > 0) {
        const newNotifications = newBookings.map((booking) => ({
          id: booking.id,
          product_name: booking.product_name,
          user_name: booking.user_name || "A customer",
          timestamp: booking.created_at,
        }));

        setNotifications((prev) => [...prev, ...newNotifications]);
        
        // Mark these bookings as processed
        newBookings.forEach((b) => processedBookingsRef.current.add(b.id));
      }

      lastCheckedRef.current = new Date().toISOString();
    } catch (err) {
      console.error("Failed to check bookings:", err);
    }
  }, [shopId]);

  // Poll every 5 seconds when user has a shop
  useEffect(() => {
    if (!shopId) return;

    // Initial check
    checkNewBookings();

    const interval = setInterval(checkNewBookings, 5000);
    return () => clearInterval(interval);
  }, [shopId, checkNewBookings]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    removeNotification,
    clearAll,
    hasShop: !!shopId,
  };
}
