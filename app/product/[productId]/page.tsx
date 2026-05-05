"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAuthGuard } from "@/components/auth-guard";
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
  Share2,
  Maximize2,
} from "lucide-react";

// Types
interface Product {
  id: string;
  product_id?: string;
  name: string;
  name_mm?: string;
  description?: string;
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
    latitude?: number;
    longitude?: number;
  };
  reviews: Review[];
  reviews_count: number;
  average_rating: number;
}

interface Review {
  id: string;
  review_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  helpful_count?: number;
  unhelpful_count?: number;
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Show all reviews state
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const INITIAL_REVIEWS_COUNT = 4;

  // Load user votes from localStorage
  useEffect(() => {
    const savedVotes = localStorage.getItem(`product_votes_${productId}`);
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, [productId]);

  // Save user votes to localStorage
  const saveUserVotes = (votes: Record<string, 'helpful' | 'unhelpful'>) => {
    setUserVotes(votes);
    localStorage.setItem(`product_votes_${productId}`, JSON.stringify(votes));
  };

  // Handle review helpful/unhelpful voting
  const handleVote = async (reviewId: string, vote: 'helpful' | 'unhelpful') => {
    const currentVote = userVotes[reviewId];
    
    if (currentVote === vote) {
      // Remove vote
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote }),
        });
        
        if (res.ok) {
          const newVotes = { ...userVotes };
          delete newVotes[reviewId];
          saveUserVotes(newVotes);
          
          if (product) {
            setProduct(prev => prev ? {
              ...prev,
              reviews: prev.reviews.map(r => {
                if (r.review_id === reviewId || r.id === reviewId) {
                  return {
                    ...r,
                    helpful_count: vote === 'helpful' ? Math.max(0, (r.helpful_count || 0) - 1) : r.helpful_count,
                    unhelpful_count: vote === 'unhelpful' ? Math.max(0, (r.unhelpful_count || 0) - 1) : r.unhelpful_count,
                  };
                }
                return r;
              })
            } : null);
          }
        }
      } catch (err) {
        console.error('Failed to remove vote:', err);
      }
    } else if (currentVote && currentVote !== vote) {
      // Switch vote
      try {
        await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote: currentVote }),
        });
        
        await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote }),
        });
        
        const newVotes = { ...userVotes, [reviewId]: vote };
        saveUserVotes(newVotes);
        
        if (product) {
          setProduct(prev => prev ? {
            ...prev,
            reviews: prev.reviews.map(r => {
              if (r.review_id === reviewId || r.id === reviewId) {
                const oldVote = currentVote;
                return {
                  ...r,
                  helpful_count: oldVote === 'helpful' 
                    ? Math.max(0, (r.helpful_count || 0) - 1)
                    : (vote === 'helpful' ? (r.helpful_count || 0) + 1 : r.helpful_count),
                  unhelpful_count: oldVote === 'unhelpful'
                    ? Math.max(0, (r.unhelpful_count || 0) - 1)
                    : (vote === 'unhelpful' ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count),
                };
              }
              return r;
            })
          } : null);
        }
      } catch (err) {
        console.error('Failed to switch vote:', err);
      }
    } else {
      // New vote
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote }),
        });
        
        if (res.ok) {
          const newVotes = { ...userVotes, [reviewId]: vote };
          saveUserVotes(newVotes);
          
          if (product) {
            setProduct(prev => prev ? {
              ...prev,
              reviews: prev.reviews.map(r => {
                if (r.review_id === reviewId || r.id === reviewId) {
                  return {
                    ...r,
                    helpful_count: vote === 'helpful' ? (r.helpful_count || 0) + 1 : r.helpful_count,
                    unhelpful_count: vote === 'unhelpful' ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count,
                  };
                }
                return r;
              })
            } : null);
          }
        }
      } catch (err) {
        console.error('Failed to vote:', err);
      }
    }
  };
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const reviewerName = user?.displayName || user?.email?.split('@')[0] || "Anonymous";

  // Related products from same shop
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Saved state
  const [isSaved, setIsSaved] = useState(false);

  const t = TRANSLATIONS[language];

  // Check if product is saved
  useEffect(() => {
    if (!user?.uid) return;
    const savedProducts = JSON.parse(localStorage.getItem(`savedProducts_${user.uid}`) || "[]");
    setIsSaved(savedProducts.includes(productId));
  }, [productId, user?.uid]);

  // Auth guard for protected features
  const { checkAuth, AuthGuardModal } = useAuthGuard();

  // Toggle save product
  const toggleSave = () => {
    if (!checkAuth(user, "save products")) return;
    const savedProducts = JSON.parse(localStorage.getItem(`savedProducts_${user.uid}`) || "[]");
    if (isSaved) {
      const updated = savedProducts.filter((id: string) => id !== productId);
      localStorage.setItem(`savedProducts_${user.uid}`, JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedProducts.push(productId);
      localStorage.setItem(`savedProducts_${user.uid}`, JSON.stringify(savedProducts));
      setIsSaved(true);
    }
  };

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

  // Helper function to safely format review dates
  const formatReviewDate = (dateString: string | undefined): string => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Just now";
    return date.toLocaleDateString();
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

  // Lightbox functions
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    if (product?.image_urls) {
      setLightboxIndex((prev) => 
        prev === product.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevLightboxImage = () => {
    if (product?.image_urls) {
      setLightboxIndex((prev) => 
        prev === 0 ? product.image_urls.length - 1 : prev - 1
      );
    }
  };

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpen) {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && lightboxOpen) {
        prevLightboxImage();
      } else if (e.key === 'ArrowRight' && lightboxOpen) {
        nextLightboxImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, product?.image_urls]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea]" />
          <p className="mt-4 text-[var(--text-gray)]">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card-bg)] border-b border-gray-200/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-full hover:bg-gray-500/10 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[var(--text-dark)]" />
              </button>
              <h1 className="text-lg font-semibold text-[var(--text-dark)] line-clamp-1 max-w-[200px] sm:max-w-md">{displayName}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 bg-gray-500/10 rounded-full text-sm font-medium text-[var(--text-dark)] hover:bg-gray-500/20 transition-colors"
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
                      idx === currentImageIndex ? "border-[#667eea]" : "border-gray-200/20"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain bg-[var(--card-bg)]"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image */}
            <div className="flex-1 relative aspect-square bg-[var(--card-bg)] rounded-2xl overflow-hidden">
              {product.image_urls && product.image_urls.length > 0 ? (
                <>
                  <img
                    src={product.image_urls[currentImageIndex]}
                    alt={displayName}
                    className="w-full h-full object-contain bg-[var(--background)] cursor-zoom-in"
                    onClick={() => openLightbox(currentImageIndex)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  
                  {/* Time Ago Badge - Moved to left to avoid overlap */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--card-bg)]/90 text-[var(--text-gray)] flex items-center gap-1.5 shadow-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {getRelativeTime(product.created_at, language)}
                    </span>
                  </div>
                  
                  {/* Fullscreen button */}
                  <button
                    onClick={() => openLightbox(currentImageIndex)}
                    className="absolute top-3 right-3 p-2 bg-[var(--card-bg)]/90 hover:bg-[var(--card-bg)] rounded-lg shadow-md transition-all z-10"
                    title="View fullscreen"
                  >
                    <Maximize2 className="h-5 w-5 text-[var(--text-gray)]" />
                  </button>

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
                <div className="w-full h-full flex items-center justify-center text-[var(--text-dark)]">
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
                <h1 className="text-2xl font-bold text-[var(--text-dark)]">{displayName}</h1>
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert("Product link copied to clipboard!");
                  }}
                  className="p-2 rounded-full hover:bg-gray-500/10 transition-colors"
                  title="Share product"
                >
                  <Share2 className="h-5 w-5 text-[var(--text-dark)]" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-[var(--text-dark)] font-medium">{product.average_rating.toFixed(1)}</span>
              <span className="text-[var(--text-gray)]">({product.reviews_count} {t.rating})</span>
            </div>

            {/* Price Section */}
            <div className="bg-[var(--card-bg)] rounded-xl p-4 space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-[var(--text-gray)]">{product.currency}</span>
                <span className="text-3xl font-bold text-[var(--text-dark)]">{product.price.toLocaleString()}</span>
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
                href={`/map?shop=${product.shop.id}`}
                className="w-full bg-[#667eea] text-white py-3 rounded-xl font-semibold hover:bg-[#5a67d8] transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="h-5 w-5" />
                Get Directions
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleSave}
                  className={`flex items-center justify-center gap-2 py-3 border rounded-xl transition-colors ${
                    isSaved 
                      ? "border-[#667eea] bg-[#667eea]/10 text-[#667eea]" 
                      : "border-gray-200/20 text-[var(--text-dark)] hover:bg-gray-500/10"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isSaved ? "fill-[#667eea]" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </button>
                <a
                  href={product.shop.phone ? `tel:${product.shop.phone}` : "#"}
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200/20 rounded-xl text-[var(--text-dark)] hover:bg-gray-500/10 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call Shop
                </a>
              </div>
            </div>

            {/* Shop Info Card */}
            <div className="border border-gray-200/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                {product.shop.logo_url ? (
                  <img 
                    src={product.shop.logo_url} 
                    alt={shopName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-white fill-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-dark)]">{shopName}</p>
                  <p className="text-sm text-[var(--text-gray)]">{product.shop.address || "Kpa Front"}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-[var(--text-dark)]">{product.shop.rating.toFixed(1)}</span>
                    <span className="text-[var(--text-gray)]">({t.rating})</span>
                  </div>
                  <Link 
                    href={`/map?shop=${product.shop.id}`}
                    className="text-[#667eea] text-sm hover:underline flex items-center gap-1 mt-1"
                  >
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
          <h3 className="text-lg font-semibold text-[var(--text-dark)] mb-3">About this Item</h3>
          <p className="text-[var(--text-gray)] whitespace-pre-wrap">
            {product.description || (language === "en" ? "No description available" : "အကြောင်းအရာမရရှိပါ")}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-dark)]">
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
            <div className="text-center py-8 bg-[var(--card-bg)] rounded-xl">
              <p className="text-[var(--text-gray)]">{t.noReviews}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(showAllReviews ? product.reviews : product.reviews.slice(0, INITIAL_REVIEWS_COUNT)).map((review) => {
                  const userVote = userVotes[review.review_id || review.id];
                  return (
                    <div key={review.id} className="bg-[var(--card-bg)] rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-[var(--text-dark)]">{review.reviewer_name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-[var(--text-dark)]">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--text-gray)]">{review.review_text}</p>
                      <p className="text-xs text-[var(--text-gray)] mt-2">
                        {formatReviewDate(review.created_at)}
                      </p>
                      
                      {/* Was this review helpful? */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/20">
                        <span className="text-sm text-[var(--text-gray)]">{language === "en" ? "Was this helpful?" : "အကူအညီဖြစ်ပါသလား?"}</span>
                        <button 
                          onClick={() => handleVote(review.review_id || review.id, 'helpful')}
                          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                            userVote === 'helpful' 
                              ? 'bg-[#667eea] text-white' 
                              : 'bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20'
                          }`}
                        >
                          {language === "en" ? "Yes" : "ဟုတ်တယ်"}
                        </button>
                        <button 
                          onClick={() => handleVote(review.review_id || review.id, 'unhelpful')}
                          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                            userVote === 'unhelpful' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20'
                          }`}
                        >
                          {language === "en" ? "No" : "မဟုတ်ဘူး"}
                        </button>
                      </div>
                      
                      {/* X people found this helpful */}
                      {userVote === 'helpful' && (review.helpful_count || 0) > 0 && (
                        <p className="text-xs text-[var(--text-gray)] mt-2">
                          {review.helpful_count} {language === "en" ? "people found this helpful" : "ဦး သည် အကူအညီဖြစ်သည်ဟု ထင်မြင်သည်"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* See All Reviews Button */}
              {product.reviews.length > INITIAL_REVIEWS_COUNT && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-[#667eea] font-medium hover:underline"
                  >
                    {showAllReviews ? "Show less" : `See all ${product.reviews.length} reviews`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* More from this shop */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-dark)]">More from this shop</h3>
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
                  key={`${relatedProduct.id || relatedProduct.product_id}-${index}`} 
                  href={`/product/${relatedProduct.id || relatedProduct.product_id}`}
                  className="group bg-[var(--card-bg)] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-[var(--background)] relative overflow-hidden">
                    {relatedProduct.image_urls?.[0] ? (
                      <img
                        src={relatedProduct.image_urls[0]}
                        alt={language === "en" ? relatedProduct.name : (relatedProduct.name_mm || relatedProduct.name)}
                        className="max-w-full max-h-[85vh] object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-[var(--text-dark)] text-sm line-clamp-1">
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
            <div className="text-center py-8 bg-[var(--card-bg)] rounded-xl">
              <p className="text-[var(--text-gray)]">No other products from this shop</p>
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
          <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-md border border-gray-200/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--text-dark)]">{t.writeAReview}</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-gray-500/10"
                >
                  <X className="h-5 w-5 text-[var(--text-dark)]" />
                </button>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
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
                            : "text-gray-500/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                  {t.reviewOptional}
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--background)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none text-[var(--text-dark)]"
                  placeholder="Share your experience..."
                />
                <p className="text-xs text-[var(--text-gray)] mt-1 text-right">
                  {reviewText.length}/500
                </p>
              </div>

              {/* Error Message */}
              {reviewError && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
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

      {/* Image Lightbox Modal */}
      {lightboxOpen && product?.image_urls && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Previous button */}
          {product.image_urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevLightboxImage(); }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Main image */}
          <div 
            className="max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.image_urls[lightboxIndex]}
              alt={displayName}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>

          {/* Next button */}
          {product.image_urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextLightboxImage(); }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Thumbnail strip */}
          {product.image_urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
              {product.image_urls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                  className={`w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex ? 'border-[#667eea]' : 'border-transparent'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain bg-gray-800"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Image counter */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-white/10 rounded-full text-white text-sm">
            {lightboxIndex + 1} / {product.image_urls.length}
          </div>
        </div>
      )}

      {/* Auth Guard Modal */}
      <AuthGuardModal />
    </div>
  );
}
