"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Clock,
  ChevronRight,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Hourglass,
  MapPin,
  DollarSign,
} from "lucide-react";

interface Booking {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  pickup_time: string;
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  booking_fee: number;
  payment_method: "pay" | "watch_ad";
  created_at: string;
}

interface Shop {
  shop_id: string;
  name: string;
  owner_id: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: Hourglass, action: "Accept/Decline" },
  accepted: { label: "Accepted", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: CheckCircle, action: "Mark Complete" },
  declined: { label: "Declined", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle, action: null },
  completed: { label: "Completed", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle, action: null },
  cancelled: { label: "Cancelled", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: XCircle, action: null },
};

export default function ShopBookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "active" | "completed">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        // Fetch shop
        const shopRes = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (!shopRes.ok) {
          setError("Shop not found");
          setLoading(false);
          return;
        }
        const shopData = await shopRes.json();
        const shopInfo = shopData.data;
        setShop(shopInfo);

        // Fetch bookings for this shop
        const bookingsRes = await fetch(`/api/shops/${shopInfo.shop_id}/bookings`);
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as Booking["status"] } : b))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return booking.status === "pending";
    if (activeFilter === "active") return ["accepted"].includes(booking.status);
    if (activeFilter === "completed") return ["completed", "declined", "cancelled"].includes(booking.status);
    return true;
  });

  // Sort by created_at desc (newest first)
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[#667eea] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/shop/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/shop/dashboard")}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Manage Bookings</h1>
              </div>
              <div className="text-sm text-gray-500">{bookings.length} total</div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { key: "all", label: "All", count: bookings.length },
              { key: "pending", label: "Pending", count: bookings.filter((b) => b.status === "pending").length },
              { key: "active", label: "Active", count: bookings.filter((b) => b.status === "accepted").length },
              { key: "completed", label: "Completed", count: bookings.filter((b) => ["completed", "declined", "cancelled"].includes(b.status)).length },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.key
                    ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {sortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeFilter === "all" ? "No bookings yet" : `No ${activeFilter} bookings`}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {activeFilter === "all"
                  ? "When customers book your products, they will appear here."
                  : `You don't have any ${activeFilter} bookings at the moment.`}
              </p>
              <button
                onClick={() => router.push("/shop/dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBookings.map((booking) => {
                const statusConfig = STATUS_CONFIG[booking.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{booking.product_name}</h3>
                          <p className="text-sm text-gray-500">
                            <User className="h-3 w-3 inline mr-1" />
                            {booking.user_name || "Anonymous"}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {new Date(booking.pickup_time).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{booking.booking_fee.toLocaleString()} MMK</span>
                        {booking.payment_method === "watch_ad" && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Ad</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {booking.status === "pending" && (
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "accepted")}
                          disabled={updating === booking.id}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {updating === booking.id ? "Updating..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "declined")}
                          disabled={updating === booking.id}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {booking.status === "accepted" && (
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "completed")}
                          disabled={updating === booking.id}
                          className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {updating === booking.id ? "Updating..." : "Mark as Completed"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
