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
  Heart,
  X,
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
  currency: string;
  delivery_available: boolean;
  created_at: string;
  shop: {
    id: string;
    name: string;
    name_mm?: string;
    rating: number;
    phone?: string;
    address?: string;
    delivery_available: boolean;
    logo_url?: string;
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

// Translations
const TRANSLATIONS = {
  en: {
    back: "Back",
    productNotFound: "Product not found",
    loading: "Loading product details...",
    tryAgain: "Try Again",
    reviews: "Reviews",
    noReviews: "No reviews yet. Be the first to review!",
    writeReview: "Write a Review",
    viewShop: "View Shop",
    rating: "Rating",
    // Review Modal
    writeAReview: "Write a Review",
    yourName: "Your name",
    ratingLabel: "Rating",
    reviewOptional: "Review (optional)",
    submitReview: "Submit Review",
    submitting: "Submitting...",
    // Errors
    enterName: "Please enter your name",
    selectRating: "Please select a rating",
    reviewError: "Failed to submit review. Please try again.",
  },
  my: {
    back: "နောက်သို့",
    productNotFound: "ပစ္စည်းမတွေ့ပါ",
    loading: "ပစ္စည်းအချက်အလက်များ ရယူနေသည်...",
    tryAgain: "ထပ်စမ်းကြည့်မယ်",
    reviews: "သုံးသပ်ချက်များ",
    noReviews: "သုံးသပ်ချက်များ မရှိသေးပါ။ ပထမဆုံးသုံးသပ်ရေးသားပါ!",
    writeReview: "သုံးသပ်ရေးသားမယ်",
    viewShop: "ဆိုင်ကြည့်မယ်",
    rating: "အဆင့်",
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
    reviewError: "သုံးသပ်ချက်မတင်နိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
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
  
  // Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Review form state
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Related products from same shop
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const t = TRANSLATIONS[language];

  // Helper function to get relative time (e.g., "5 days ago")
  const getRelativeTime = (dateString: string, lang: Language): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (lang === "my") {
      if (diffSecs < 60) return "လွန်ခဲ့သော စက္ကန့်အနည်းငယ်";
      if (diffMins < 60) return `လွန်ခဲ့သော ${diffMins} မိနစ်`;
      if (diffHours < 24) return `လွန်ခဲ့သော ${diffHours} နာရီ`;
      if (diffDays < 7) return `လွန်ခဲ့သော ${diffDays} ရက်`;
      if (diffWeeks < 4) return `လွန်ခဲ့သော ${diffWeeks} ပတ်`;
      if (diffMonths < 12) return `လွန်ခဲ့သော ${diffMonths} လ`;
      return `လွန်ခဲ့သော ${diffYears} နှစ်`;
    } else {
      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
      if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
      return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
    }
  };

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
      
      // Fetch related products from same shop
      if (data.data?.shop?.id) {
        fetchRelatedProducts(data.data.shop.id, productId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Fetch related products from same shop
  const fetchRelatedProducts = async (shopId: string, currentProductId: string) => {
    setLoadingRelated(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/products`);
      if (res.ok) {
        const data = await res.json();
        // Filter out current product and limit to 10
        const filtered = (data.data?.products || [])
          .filter((p: Product) => {
            const pId = p.id || (p as any).product_id;
            return String(pId) !== String(currentProductId);
          })
          .slice(0, 10);
        setRelatedProducts(filtered);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingRelated(false);
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
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Images with Mini Thumbnails */}
          <div className="flex gap-4">
            {/* Mini Thumbnail Gallery - Always show if images exist */}
            {product.image_urls && product.image_urls.length > 0 && (
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                {product.image_urls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      idx === currentImageIndex ? "border-[#667eea]" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image */}
            <div className="flex-1 relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
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
                  
                  {/* Time Ago Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/90 text-gray-700 flex items-center gap-1.5 shadow-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {getRelativeTime(product.created_at, language)}
                    </span>
                  </div>

                  {/* Image indicators */}
                  {product.image_urls.length > 1 && (
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
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-4">
            {/* Title Row with Actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-black">{displayName}</h1>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Share2 className="h-5 w-5 text-black" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-black font-medium">{product.shop.rating.toFixed(1)}</span>
              <span className="text-gray-500">({product.reviews_count} {t.rating})</span>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-500">{product.currency}</span>
                <span className="text-3xl font-bold text-black">{product.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>In-store pickup</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Available now</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href={`/shop/${product.shop.id}`}
                className="w-full bg-[#667eea] text-white py-3 rounded-xl font-semibold hover:bg-[#5a67d8] transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="h-5 w-5" />
                Get Directions
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-black hover:bg-gray-50 transition-colors">
                  <Heart className="h-5 w-5" />
                  Save
                </button>
                <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-black hover:bg-gray-50 transition-colors">
                  <Phone className="h-5 w-5" />
                  Call Shop
                </button>
              </div>
            </div>

            {/* Shop Info Card */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                {product.shop.logo_url ? (
                  <img 
                    src={product.shop.logo_url} 
                    alt={shopName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">{shopName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-black">{shopName}</p>
                  <p className="text-sm text-gray-500">{product.shop.address || "Kpa Front"}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-black">{product.shop.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({t.rating})</span>
                  </div>
                  <Link href={`/shop/${product.shop.id}`} className="text-[#667eea] text-sm hover:underline flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Get directions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About this Item */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-3">About this Item</h3>
          <p className="text-gray-600">
            {language === "en" ? "Posted " : "တင်ထားသည်မှာ "}{getRelativeTime(product.created_at, language)}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
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
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500">{t.noReviews}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-black">{review.reviewer_name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-black">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.review_text}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* More from this shop */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">More from this shop</h3>
            <Link href={`/shop/${product.shop.id}`} className="text-[#667eea] text-sm hover:underline flex items-center gap-1">
              See all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loadingRelated ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#667eea]" />
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((relatedProduct, index) => (
                <Link 
                  key={`${relatedProduct.id}-${index}`} 
                  href={`/product/${relatedProduct.id}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {relatedProduct.image_urls?.[0] ? (
                      <img
                        src={relatedProduct.image_urls[0]}
                        alt={language === "en" ? relatedProduct.name : (relatedProduct.name_mm || relatedProduct.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-black text-sm line-clamp-1">
                      {language === "en" ? relatedProduct.name : (relatedProduct.name_mm || relatedProduct.name)}
                    </p>
                    <p className="text-[#667eea] font-semibold text-sm">
                      {relatedProduct.price.toLocaleString()} {relatedProduct.currency}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No other products from this shop</p>
              <Link href={`/shop/${product.shop.id}`} className="inline-block mt-2 text-[#667eea] hover:underline">
                View {shopName}
              </Link>
            </div>
          )}
        </div>
      </main>

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
