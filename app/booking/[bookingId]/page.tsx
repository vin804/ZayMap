"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Star,
  ArrowLeft,
  Globe,
  Package,
  X,
  MessageSquare
} from "lucide-react";

interface Booking {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  pickup_time: string;
  payment_method: "pay" | "watch_ad";
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  booking_fee: number;
  currency: string;
  shop: {
    id: string;
    name: string;
    phone?: string;
    rating?: number;
    address?: string;
  };
  created_at: string;
  updated_at: string;
}

type Language = "en" | "my";

const TRANSLATIONS = {
  en: {
    back: "Back",
    bookingNotFound: "Booking not found",
    loading: "Loading booking status...",
    tryAgain: "Try Again",
    bookingDetails: "Booking Details",
    status: "Status",
    product: "Product",
    pickupTime: "Pickup Time",
    paymentMethod: "Payment Method",
    bookingFee: "Booking Fee",
    paid: "Paid",
    watchAd: "Watched Ad",
    shopInfo: "Shop Information",
    contact: "Contact",
    directions: "View Directions",
    cancelBooking: "Cancel Booking",
    viewSimilar: "View Similar Products",
    writeReview: "Write a Review",
    lastUpdated: "Last updated",
    autoRefresh: "Auto-refreshing every 5 seconds",
    // Status labels
    pending: "Pending",
    accepted: "Accepted",
    declined: "Declined",
    completed: "Completed",
    cancelled: "Cancelled",
    // Status descriptions
    pendingDesc: "Waiting for shop owner to confirm",
    acceptedDesc: "Shop has confirmed your booking!",
    declinedDesc: "Shop is unable to fulfill this booking",
    completedDesc: "Booking completed successfully",
    cancelledDesc: "Booking was cancelled",
    // Language
    english: "English",
    myanmar: "မြန်မာ",
  },
  my: {
    back: "နောက်သို့",
    bookingNotFound: "ဘွတ်ကောင့်မတွေ့ပါ",
    loading: "ဘွတ်ကောင့်အခြေအနေ ရယူနေသည်...",
    tryAgain: "ထပ်စမ်းကြည့်မယ်",
    bookingDetails: "ဘွတ်ကောင့်အသေးစိတ်",
    status: "အခြေအနေ",
    product: "ပစ္စည်း",
    pickupTime: "လာယူရမည့်အချိန်",
    paymentMethod: "ငွေပေးချေမှု",
    bookingFee: "ဘွတ်ကောင့်နှုန်း",
    paid: "ပေးဆောင်ပြီး",
    watchAd: "ကြော်ငြာကြည့်ခဲ့သည်",
    shopInfo: "ဆိုင်အချက်အလက်",
    contact: "ဆက်သွယ်ရန်",
    directions: "လမ်းညွှန်",
    cancelBooking: "ဘွတ်ကောင့်ပယ်ဖျက်မယ်",
    viewSimilar: "တူညီသောပစ္စည်းများ",
    writeReview: "သုံးသပ်ရေးသားမယ်",
    lastUpdated: "နောက်ဆုံးအပ်ဒိတ်",
    autoRefresh: "၅ စက္ကန့်တိုင်း အလိုအလျောက် အပ်ဒိတ်",
    // Status labels
    pending: "စောင့်ဆိုင်းနေ",
    accepted: "လက်ခံထား",
    declined: "ငြင်းပယ်ထား",
    completed: "ပြီးစီး",
    cancelled: "ပယ်ဖျက်ထား",
    // Status descriptions
    pendingDesc: "ဆိုင်ပိုင်ရှင်အတည်ပြုရန် စောင့်ဆိုင်းနေသည်",
    acceptedDesc: "ဆိုင်က သင့်ဘွတ်ကောင့်ကို လက်ခံလိုက်ပါပြီ!",
    declinedDesc: "ဆိုင်က ဤဘွတ်ကောင့်ကို လက်ခံ၍မရပါ",
    completedDesc: "ဘွတ်ကောင့်အောင်မြင်စွာပြီးစီး",
    cancelledDesc: "ဘွတ်ကောင့်ပယ်ဖျက်ထားသည်",
    // Language
    english: "English",
    myanmar: "မြန်မာ",
  },
};

const STATUS_CONFIG = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    description: { en: "Pending", my: "စောင့်ဆိုင်းနေ" },
  },
  accepted: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: { en: "Accepted", my: "လက်ခံထား" },
  },
  declined: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    description: { en: "Declined", my: "ငြင်းပယ်ထား" },
  },
  completed: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
    description: { en: "Completed", my: "ပြီးစီး" },
  },
  cancelled: {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: X,
    description: { en: "Cancelled", my: "ပယ်ဖျက်ထား" },
  },
};

export default function BookingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [language, setLanguage] = useState<Language>("en");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const t = TRANSLATIONS[language];

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "my" : "en";
    setLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
  };

  // Fetch booking status
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Booking not found");
        }
        throw new Error("Failed to fetch booking");
      }
      const data = await res.json();
      setBooking(data.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBooking();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchBooking]);

  // Cancel booking
  const handleCancel = async () => {
    // TODO: Implement cancel booking API
    alert("Cancel booking feature coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea]" />
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || t.bookingNotFound}</p>
          <button
            onClick={fetchBooking}
            className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {t.tryAgain}
          </button>
          <Link href="/search" className="block mt-4 text-[#667eea] hover:underline">
            ← {t.back}
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">{t.bookingDetails}</h1>
            </div>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? t.english : t.myanmar}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Card */}
        <div className={`rounded-2xl border-2 p-6 mb-6 ${status.color}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-white/50`}>
              <StatusIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80">{t.status}</p>
              <p className="text-2xl font-bold">
                {language === "en" ? status.description.en : status.description.my}
              </p>
            </div>
          </div>
          
          {/* Status Description */}
          <p className="mt-4 text-sm opacity-90">
            {language === "en"
              ? (booking.status === "pending" ? t.pendingDesc
                  : booking.status === "accepted" ? t.acceptedDesc
                  : booking.status === "declined" ? t.declinedDesc
                  : booking.status === "completed" ? t.completedDesc
                  : t.cancelledDesc)
              : (booking.status === "pending" ? t.pendingDesc
                  : booking.status === "accepted" ? t.acceptedDesc
                  : booking.status === "declined" ? t.declinedDesc
                  : booking.status === "completed" ? t.completedDesc
                  : t.cancelledDesc)
            }
          </p>
        </div>

        {/* Booking Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.bookingDetails}</h2>
          
          <div className="space-y-4">
            {/* Product */}
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t.product}</p>
                <p className="font-medium text-gray-900">{booking.product_name}</p>
              </div>
            </div>

            {/* Pickup Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t.pickupTime}</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.pickup_time).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 text-gray-400 mt-0.5 flex items-center justify-center text-sm">
                💳
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.paymentMethod}</p>
                <p className="font-medium text-gray-900">
                  {booking.payment_method === "pay" ? t.paid : t.watchAd}
                </p>
              </div>
            </div>

            {/* Booking Fee */}
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 text-gray-400 mt-0.5 flex items-center justify-center text-sm">
                💰
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.bookingFee}</p>
                <p className="font-medium text-gray-900">
                  {booking.booking_fee.toLocaleString()} {booking.currency}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.shopInfo}</h2>
          
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-[#667eea] rounded-full flex items-center justify-center text-white text-xl font-bold">
              {booking.shop.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{booking.shop.name}</p>
              {booking.shop.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{booking.shop.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {booking.shop.phone && (
            <a
              href={`tel:${booking.shop.phone}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-3"
            >
              <Phone className="h-5 w-5 text-[#667eea]" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t.contact}</p>
                <p className="font-medium text-gray-900">{booking.shop.phone}</p>
              </div>
            </a>
          )}

          {booking.shop.address && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="h-5 w-5 text-[#667eea] mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t.contact}</p>
                <p className="font-medium text-gray-900">{booking.shop.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {booking.status === "pending" && (
            <button
              onClick={handleCancel}
              className="w-full py-4 px-6 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
            >
              {t.cancelBooking}
            </button>
          )}

          {booking.status === "accepted" && (
            <Link
              href={`/shop/${booking.shop.id}`}
              className="block w-full py-4 px-6 bg-[#667eea] text-white rounded-xl font-semibold text-center hover:bg-[#5a67d8] transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5" />
                {t.directions}
              </span>
            </Link>
          )}

          {booking.status === "declined" && (
            <Link
              href="/search"
              className="block w-full py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-200 transition-colors"
            >
              {t.viewSimilar}
            </Link>
          )}

          {booking.status === "completed" && (
            <Link
              href={`/product/${booking.product_id}`}
              className="block w-full py-4 px-6 bg-green-50 text-green-600 rounded-xl font-semibold text-center hover:bg-green-100 transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t.writeReview}
              </span>
            </Link>
          )}
        </div>

        {/* Last Updated */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {t.lastUpdated}: {lastRefresh.toLocaleTimeString()} • {t.autoRefresh}
        </p>
      </main>
    </div>
  );
}
