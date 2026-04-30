"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { 
  Star, 
  MapPin, 
  Phone, 
  Truck, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  Clock,
  ShoppingBag,
  X,
  Calendar,
  CreditCard,
  PlayCircle,
  CheckCircle,
  MapPin as MapPinIcon,
  ArrowRight,
  Share2
} from "lucide-react";

// Types
interface Product {
  id: string;
  name: string;
  name_mm?: string;
  image_urls: string[];
  price: number;
  booking_fee: number;
  currency: string;
  delivery_available: boolean;
  freshness_status: "green" | "orange" | "red";
  created_at: string;
  shop: {
    id: string;
    name: string;
    name_mm?: string;
    rating: number;
    phone?: string;
    address?: string;
    delivery_available: boolean;
  };
  reviews: Review[];
  reviews_count: number;
  average_rating: number;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

type Language = "en" | "my";
type PaymentMethod = "pay" | "watch_ad";

// Translations
const TRANSLATIONS = {
  en: {
    back: "Back",
    productNotFound: "Product not found",
    loading: "Loading product details...",
    tryAgain: "Try Again",
    bookingFee: "Booking Fee",
    deliveryAvailable: "Delivery Available",
    deliveryNotAvailable: "Delivery Not Available",
    freshnessGreen: "Listed less than 24 hours ago",
    freshnessOrange: "Listed 1-3 days ago",
    freshnessRed: "Listed more than 3 days ago",
    reviews: "Reviews",
    noReviews: "No reviews yet. Be the first to review!",
    writeReview: "Write a Review",
    bookNow: "Book Now",
    viewShop: "View Shop",
    rating: "Rating",
    book: "Book",
    // Booking Modal
    confirmBooking: "Confirm Booking",
    pickupTime: "When do you want to pick up?",
    selectPickupTime: "Select pickup time",
    paymentMethod: "Payment Method",
    payNow: "Pay",
    watchAd: "Watch ad instead",
    watchAdDescription: "Watch a short ad and book for free",
    cancel: "Cancel",
    confirm: "Confirm Booking",
    bookingFeeLabel: "Booking fee",
    // Review Modal
    writeAReview: "Write a Review",
    yourName: "Your Name",
    ratingLabel: "Rating",
    reviewOptional: "Review (optional)",
    submitReview: "Submit Review",
    submitting: "Submitting...",
    // Errors
    enterName: "Please enter your name",
    selectRating: "Please select a rating",
    selectPickup: "Please select a pickup time",
    selectPayment: "Please select a payment method",
    futureTime: "Pickup time must be in the future",
    bookingError: "Failed to create booking. Please try again.",
    reviewError: "Failed to submit review. Please try again.",
  },
  my: {
    back: "နောက်သို့",
    productNotFound: "ပစ္စည်းမတွေ့ပါ",
    loading: "ပစ္စည်းအချက်အလက်များ ရယူနေသည်...",
    tryAgain: "ထပ်စမ်းကြည့်မယ်",
    bookingFee: "ဘွတ်ကောင့်နှုန်း",
    deliveryAvailable: "ပို့ဆောင်ရေး ရရှိသည်",
    deliveryNotAvailable: "ပို့ဆောင်ရေး မရရှိပါ",
    freshnessGreen: "၂၄ နာရီအတွင်း တင်ထားသည်",
    freshnessOrange: "၁-၃ ရက်အတွင်း တင်ထားသည်",
    freshnessRed: "၃ ရက်အထက် တင်ထားသည်",
    reviews: "သုံးသပ်ချက်များ",
    noReviews: "သုံးသပ်ချက်များ မရှိသေးပါ။ ပထမဆုံးသုံးသပ်ရေးသားပါ!",
    writeReview: "သုံးသပ်ရေးသားမယ်",
    bookNow: "ဘွတ်ကောင့်မယ်",
    viewShop: "ဆိုင်ကြည့်မယ်",
    rating: "အဆင့်",
    book: "ဘွတ်ကောင့်",
    // Booking Modal
    confirmBooking: "ဘွတ်ကောင့်အတည်ပြု",
    pickupTime: "ဘယ်အချိန်မှာ လာယူမလဲ?",
    selectPickupTime: "လာယူရမည့်အချိန်ရွေးပါ",
    paymentMethod: "ငွေပေးချေမှု",
    payNow: "ဆောင်မယ်",
    watchAd: "ကြော်ငြာကြည့်ပါ",
    watchAdDescription: "ကြော်ငြာတိုတိုကြည့်ပြီး အခမဲ့ဘွတ်ကောင့်",
    cancel: "ပယ်ဖျက်မယ်",
    confirm: "ဘွတ်ကောင့်အတည်ပြု",
    bookingFeeLabel: "ဘွတ်ကောင့်နှုန်း",
    // Review Modal
    writeAReview: "သုံးသပ်ရေးသားမယ်",
    yourName: "သင့်နာမည်",
    ratingLabel: "အဆင့်",
    reviewOptional: "သုံးသပ်ချက် (ချန်လှပ်နိုင်)",
    submitReview: "သုံးသပ်ချက်တင်မယ်",
    submitting: "တင်နေသည်...",
    // Errors
    enterName: "သင့်နာမည်ထည့်ပါ",
    selectRating: "အဆင့်ရွေးပါ",
    selectPickup: "လာယူရမည့်အချိန်ရွေးပါ",
    selectPayment: "ငွေပေးချေမှုရွေးပါ",
    futureTime: "အနာဂတ်အချိန်ရွေးပါ",
    bookingError: "ဘွတ်ကောင့်မရပါ။ ထပ်စမ်းကြည့်ပါ။",
    reviewError: "သုံးသပ်ချက်မတင်နိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
  },
};

// Freshness configuration
const FRESHNESS_CONFIG = {
  green: {
    bg: "bg-green-500",
    text: "text-green-700",
    label: { en: "Fresh", my: "သစ်သစ်လှလှ" },
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    label: { en: "Recent", my: "မကြာသေးခင်" },
  },
  red: {
    bg: "bg-red-500",
    text: "text-red-700",
    label: { en: "Old", my: "အဟောင်း" },
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params.productId as string;
  
  const [language, setLanguage] = useState<Language>("en");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Booking form state
  const [pickupTime, setPickupTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pay");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Review form state
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Product not found");
        }
        throw new Error("Failed to fetch product");
      }
      const data = await res.json();
      setProduct(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Handle booking submission
  const handleBooking = async () => {
    setBookingError(null);
    
    if (!pickupTime) {
      setBookingError(t.selectPickup);
      return;
    }

    const pickupDate = new Date(pickupTime);
    const now = new Date();
    if (pickupDate <= now) {
      setBookingError(t.futureTime);
      return;
    }

    setBookingLoading(true);

    if (!user?.uid) {
      setBookingError("Please log in to book");
      setBookingLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        },
        body: JSON.stringify({
          product_id: productId,
          pickup_time: pickupTime,
          payment_method: paymentMethod,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.bookingError);
      }

      const data = await res.json();
      
      // Redirect to booking status page
      router.push(`/booking/${data.data.id}`);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : t.bookingError);
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle review submission
  const handleReview = async () => {
    setReviewError(null);

    if (!reviewerName.trim()) {
      setReviewError(t.enterName);
      return;
    }

    if (reviewRating === 0) {
      setReviewError(t.selectRating);
      return;
    }

    setReviewLoading(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_name: reviewerName,
          rating: reviewRating,
          review_text: reviewText,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.reviewError);
      }

      // Refresh product to show new review
      await fetchProduct();
      setShowReviewModal(false);
      setReviewerName("");
      setReviewRating(0);
      setReviewText("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : t.reviewError);
    } finally {
      setReviewLoading(false);
    }
  };

  // Image navigation
  const nextImage = () => {
    if (product?.image_urls) {
      setCurrentImageIndex((prev) => 
        prev === product.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.image_urls) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.image_urls.length - 1 : prev - 1
      );
    }
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || t.productNotFound}</p>
          <button
            onClick={fetchProduct}
            className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {t.tryAgain}
          </button>
          <button 
            onClick={() => router.back()}
            className="block mt-4 text-[#667eea] hover:underline"
          >
            ← {t.back}
          </button>
        </div>
      </div>
    );
  }

  const displayName = language === "my" && product.name_mm ? product.name_mm : product.name;
  const shopName = language === "my" && product.shop.name_mm ? product.shop.name_mm : product.shop.name;
  const freshness = FRESHNESS_CONFIG[product.freshness_status];
  const isEligibleForAd = product.booking_fee === 500;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-black" />
              </button>
              <h1 className="text-lg font-semibold text-black line-clamp-1 max-w-[200px] sm:max-w-md">{displayName}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Share2 className="h-5 w-5 text-black" />
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-black hover:bg-gray-200 transition-colors"
              >
                {language === "en" ? "EN" : "MY"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Product Image Carousel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="relative aspect-video bg-gray-100">
            {product.image_urls && product.image_urls.length > 0 ? (
              <>
                <img
                  src={product.image_urls[currentImageIndex]}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-size='14' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                {product.image_urls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-black" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-black" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {product.image_urls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentImageIndex ? "bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black">
                <span className="text-6xl">📦</span>
              </div>
            )}
            
            {/* Freshness Badge */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-semibold ${freshness.bg} shadow-lg`}>
                <span className="w-2 h-2 rounded-full bg-white" />
                {freshness.label[language]}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-black mb-2">{displayName}</h2>
            
            {/* Price & Delivery */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-sm text-black">{product.currency}</span>
                  <span className="text-4xl font-bold text-black">
                    {product.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-black">
                <Truck className="h-4 w-4" />
                {product.delivery_available ? t.deliveryAvailable : t.deliveryNotAvailable}
              </div>
            </div>

            <div className="text-sm text-black mb-4">
              + {product.booking_fee.toLocaleString()} {product.currency} {t.bookingFee}
            </div>

            {/* Freshness Explanation */}
            <p className="text-sm text-black mb-4">
              {language === "en" 
                ? (product.freshness_status === "green" ? t.freshnessGreen 
                    : product.freshness_status === "orange" ? t.freshnessOrange 
                    : t.freshnessRed)
                : (product.freshness_status === "green" ? t.freshnessGreen
                    : product.freshness_status === "orange" ? t.freshnessOrange
                    : t.freshnessRed)
              }
            </p>

            {/* Shop Info Card */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold">{shopName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black">{shopName}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-black">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.shop.rating.toFixed(1)}</span>
                    <span className="text-[#667eea] hover:underline cursor-pointer">
                      ({t.rating})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-black">
                    <MapPin className="h-3.5 w-3.5" />
                    <Link href={`/shop/${product.shop.id}`} className="text-[#667eea] hover:underline">
                      Get directions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book Now Button */}
        <button
          onClick={() => setShowBookingModal(true)}
          className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-6"
        >
          {t.bookNow}
        </button>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">
              {t.reviews} ({product.reviews_count})
            </h3>
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-[#667eea] font-medium hover:underline"
            >
              {t.writeReview}
            </button>
          </div>

          {product.reviews.length === 0 ? (
            <div className="text-center py-8 text-black">
              <p>{t.noReviews}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-black">{review.reviewer_name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-black">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-black">{review.review_text}</p>
                  <p className="text-xs text-black mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">{t.confirmBooking}</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>

              {/* Product Summary */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {product.image_urls?.[0] ? (
                    <img
                      src={product.image_urls[0]}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black line-clamp-1">{displayName}</p>
                  <p className="text-[#667eea] font-semibold">
                    {product.price.toLocaleString()} {product.currency}
                  </p>
                  <p className="text-xs text-black">
                    + {product.booking_fee.toLocaleString()} {product.currency} {t.bookingFee.toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Pickup Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t.pickupTime}
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-3">
                  {t.paymentMethod}
                </label>
                
                {/* Pay Now Option - Always available */}
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors mb-3 ${
                  paymentMethod === "pay" 
                    ? "border-[#667eea] bg-[#667eea]/5" 
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="pay"
                    checked={paymentMethod === "pay"}
                    onChange={() => setPaymentMethod("pay")}
                    className="sr-only"
                  />
                  <CreditCard className="h-5 w-5 text-[#667eea]" />
                  <div className="flex-1">
                    <p className="font-medium text-black">{t.payNow}</p>
                    <p className="text-sm text-black">{product.booking_fee.toLocaleString()} {product.currency} {t.bookingFee.toLowerCase()}</p>
                  </div>
                  {paymentMethod === "pay" && <CheckCircle className="h-5 w-5 text-[#667eea]" />}
                </label>

                {/* Watch Ad Option - Only for 500 MMK */}
                {isEligibleForAd && (
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === "watch_ad" 
                      ? "border-[#667eea] bg-[#667eea]/5" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="watch_ad"
                      checked={paymentMethod === "watch_ad"}
                      onChange={() => setPaymentMethod("watch_ad")}
                      className="sr-only"
                    />
                    <PlayCircle className="h-5 w-5 text-[#667eea]" />
                    <div className="flex-1">
                      <p className="font-medium text-black">{t.watchAd}</p>
                      <p className="text-sm text-black">{t.watchAdDescription}</p>
                    </div>
                    {paymentMethod === "watch_ad" && <CheckCircle className="h-5 w-5 text-[#667eea]" />}
                  </label>
                )}
              </div>

              {/* Error Message */}
              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ...
                    </span>
                  ) : (
                    t.confirm
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">{t.writeAReview}</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>

              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  {t.yourName}
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                  placeholder="Your name"
                />
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  {t.ratingLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-2 transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  {t.reviewOptional}
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none text-black"
                  placeholder="Share your experience..."
                />
                <p className="text-xs text-black mt-1 text-right">
                  {reviewText.length}/500
                </p>
              </div>

              {/* Error Message */}
              {reviewError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {reviewError}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.submitting}
                  </span>
                ) : (
                  t.submitReview
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
