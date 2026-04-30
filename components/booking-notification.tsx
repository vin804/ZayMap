"use client";

import { useEffect, useState } from "react";
import { useBookingNotifications } from "@/hooks/use-booking-notifications";
import { Package, X, CheckCircle, XCircle, Clock } from "lucide-react";

interface NotificationPopupProps {
  id: string;
  product_name: string;
  user_name: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onClose: () => void;
}

function NotificationPopup({
  id,
  product_name,
  user_name,
  onAccept,
  onDecline,
  onClose,
}: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-close after 10 seconds if no action taken
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isVisible) {
        handleClose();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleAccept = () => {
    onAccept(id);
    handleClose();
  };

  const handleDecline = () => {
    onDecline(id);
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-white" />
          <span className="font-semibold text-white text-sm">New Booking!</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-800 text-sm mb-1">
          <span className="font-semibold">{user_name}</span> booked
        </p>
        <p className="text-gray-900 font-medium mb-3 line-clamp-2">{product_name}</p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Decline
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-[#667eea] animate-[shrink_10s_linear_forwards]" />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export function BookingNotificationContainer() {
  const { notifications, removeNotification, hasShop } = useBookingNotifications();

  const handleAccept = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (res.ok) {
        // Refresh the page if on shop bookings page
        if (window.location.pathname.includes("/shop/bookings")) {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Failed to accept booking:", err);
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });

      if (res.ok) {
        if (window.location.pathname.includes("/shop/bookings")) {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Failed to decline booking:", err);
    }
  };

  if (!hasShop || notifications.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-3 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{ marginTop: index > 0 ? "0.75rem" : "0" }}
        >
          <NotificationPopup
            id={notification.id}
            product_name={notification.product_name}
            user_name={notification.user_name}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
