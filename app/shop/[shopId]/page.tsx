"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Star, 
  MapPin, 
  Phone, 
  Truck, 
  Clock, 
  ChevronLeft, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  Heart,
  Share2,
  Shield,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Package,
  X,
  Video,
  ExternalLink
} from "lucide-react";

// Freshness labels
const freshnessLabels = {
  en: { green: "New", orange: "Recent", red: "" },
  my: { green: "အသစ်", orange: "မကြာသေးခင်", red: "" },
};

interface Category {
  id: string;
  name?: string;
  name_mm?: string;
  icon?: string;
  order_index: number;
}

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  description?: string;
  description_mm?: string;
  category: string;
  phone: string;
  address: string;
  logo_url?: string;
  image_urls?: string[];
  latitude: number;
  longitude: number;
  delivery_available: boolean;
  avg_responsiveness_rating: number;
  avg_delivery_quality_rating: number;
  avg_product_review_rating: number;
  responsiveness_review_count: number;
  delivery_quality_review_count: number;
  product_review_count: number;
  response_time_hours: number;
  rating: number;
  review_count: number;
  owner_id?: string;
  facebook?: string;
  tiktok?: string;
  categories?: Category[];
}

interface Product {
  product_id: string;
  shop_id: string;
  product_name: string;
  product_name_mm?: string;
  description?: string;
  image_urls: string[];
  price: number;
  currency: string;
  upload_timestamp: string;
  freshness_badge: "green" | "orange" | "red";
  average_rating?: number;
  review_count?: number;
  category?: string;
  category_id?: string;
}

interface Review {
  review_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  review_type: string;
  created_at: string;
  helpful_count?: number;
  unhelpful_count?: number;
}

type Language = "en" | "my";

const TRANSLATIONS = {
  en: {
    back: "Back",
    products: "Products",
    reviews: "Reviews",
    view: "View",
    deliveryAvailable: "Delivery Available",
    deliveryNotAvailable: "Delivery Not Available",
    phone: "Phone",
    address: "Address",
    respondsIn: "Responds in",
    hours: "hours",
    rating: "Rating",
    responsiveness: "Responsiveness",
    deliveryQuality: "Delivery Quality",
    productReviews: "Product Reviews",
    viewAllReviews: "View All Reviews",
    noProducts: "No products available",
    noReviews: "No reviews yet",
    errorLoading: "Failed to load shop details",
    tryAgain: "Try Again",
    fresh: "Fresh",
    recent: "Recent",
    old: "Old",
    aboutShop: "About This Shop",
    aboutItem: "About This Item",
    specifications: "Specifications",
    shippingInfo: "Shipping Info",
    customerReviews: "Customer Reviews",
    topReviews: "Top Reviews",
    allStars: "All Stars",
    outOf: "out of 5",
    verifiedPurchase: "Verified Purchase",
    helpful: "Helpful",
    customersAlsoViewed: "Customers who viewed this item also viewed",
    seeAll: "See all",
    followShop: "Follow Shop",
    contactShop: "Contact Shop",
    inStock: "In Stock",
    pickup: "In-store Pickup",
    moreFromShop: "More from this shop",
    soldBy: "Sold by",
    writeAReview: "Write a Review",
    ratingLabel: "Rating",
    reviewOptional: "Review (Optional)",
    submitReview: "Submit Review",
    submitting: "Submitting...",
    all: "All",
    featuredProducts: "Featured Products",
    viewAll: "View All",
    categories: "Categories",
  },
  my: {
    back: "နောက်သို့",
    products: "ပစ္စည်းများ",
    reviews: "သုံးသပ်ချက်များ",
    view: "ကြည့်မယ်",
    deliveryAvailable: "ပို့ဆောင်ရေး ရရှိသည်",
    deliveryNotAvailable: "ပို့ဆောင်ရေး မရရှိပါ",
    phone: "ဖုန်း",
    address: "လိပ်စာ",
    respondsIn: "ပြန်ကြားချိန်",
    hours: "နာရီ",
    rating: "အဆင့်",
    responsiveness: "တုန့်ပြန်မှု",
    deliveryQuality: "ပို့ဆောင်ရေး အရည်အသွေး",
    productReviews: "ပစ္စည်းသုံးသပ်ချက်များ",
    viewAllReviews: "သုံးသပ်ချက်အားလုံး ကြည့်မယ်",
    noProducts: "ပစ္စည်းများ မရှိပါ",
    noReviews: "သုံးသပ်ချက်များ မရှိသေးပါ",
    errorLoading: "ဆိုင်အချက်အလက်များ ရယူ၍မရပါ",
    tryAgain: "ထပ်စမ်းကြည့်မယ်",
    fresh: "သစ်သစ်လှလှ",
    recent: "မကြာသေးခင်",
    old: "အဟောင်း",
    aboutShop: "ဆိုင်အကြောင်း",
    aboutItem: "ဒီပစ္စည်းအကြောင်း",
    specifications: "အသေးစိတ်",
    shippingInfo: "ပို့ဆောင်ရေး အချက်အလက်",
    customerReviews: "ဖောက်သည်သုံးသပ်ချက်များ",
    topReviews: "ထိပ်တန်းသုံးသပ်ချက်များ",
    allStars: "အားလုံး",
    outOf: "မှ ၅ ထဲ",
    verifiedPurchase: "အတည်ပြုထားသည့် ဝယ်ယူမှု",
    helpful: "ကူညီသည်",
    customersAlsoViewed: "ဒီပစ္စည်းကြည့်သူတွေ ထပ်ကြည့်ခဲ့ကြသည်",
    seeAll: "အားလုံးကြည့်",
    followShop: "ဆိုက်ကို Follow လုပ်ရန်",
    contactShop: "ဆိုင်ကို ဆက်သွယ်ရန်",
    inStock: "ရှိသည်",
    pickup: "ဆိုင်ကောက်ယူ",
    moreFromShop: "ဆိုင်ထပ်ပစ္စည်းများ",
    soldBy: "ရောင်းသူ",
    writeAReview: "သုံးသပ်ရေးသားရန်",
    ratingLabel: "အဆင့်သတ်မှတ်",
    reviewOptional: "သုံးသပ်ချက် (မဖြစ်မနေ မဟုတ်)",
    submitReview: "ပို့စ်တင်",
    submitting: "ပို့စ်တင်နေသည်...",
    all: "အားလုံး",
    featuredProducts: "အထူးပစ္စည်းများ",
    viewAll: "အားလုံးကြည့်",
    categories: "အမျိုးအစားများ",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕",
  electronics: "📱",
  food: "🍜",
  cosmetics: "💄",
  second_hand: "♻️",
  other: "🏪",
};

// Helper function to calculate rating distribution
const calculateRatingDistribution = (reviews: Review[]) => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    const rating = Math.floor(review.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });
  const total = reviews.length;
  return {
    ...distribution,
    percentages: {
      5: total > 0 ? Math.round((distribution[5] / total) * 100) : 0,
      4: total > 0 ? Math.round((distribution[4] / total) * 100) : 0,
      3: total > 0 ? Math.round((distribution[3] / total) * 100) : 0,
      2: total > 0 ? Math.round((distribution[2] / total) * 100) : 0,
      1: total > 0 ? Math.round((distribution[1] / total) * 100) : 0,
    }
  };
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: {
    clothes: "Clothes",
    electronics: "Electronics",
    food: "Food",
    cosmetics: "Cosmetics",
    second_hand: "Second-hand",
    other: "Other",
  },
  my: {
    clothes: "အဝတ်အစား",
    electronics: "အီလက်ထရွန်",
    food: "အစားအစာ",
    cosmetics: "အလှကုန်",
    second_hand: "အသုံးပြုထားသော",
    other: "အခြား",
  },
};

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  
  const [language, setLanguage] = useState<Language>("en");
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  
  const { user } = useAuth();
  const reviewerName = user?.displayName || user?.email?.split('@')[0] || "Anonymous";
  const [activeTab, setActiveTab] = useState<"about" | "specs" | "shipping">("about");
  const [sortBy, setSortBy] = useState<"featured" | "price_low" | "price_high" | "freshness">("featured");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const PRODUCTS_PER_PAGE = 12;
  const FEATURED_COUNT = 3;

  const t = TRANSLATIONS[language];

  // Load user votes from localStorage
  useEffect(() => {
    const savedVotes = localStorage.getItem(`shop_votes_${shopId}`);
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, [shopId]);

  // Save user votes to localStorage
  const saveUserVotes = (votes: Record<string, 'helpful' | 'unhelpful'>) => {
    setUserVotes(votes);
    localStorage.setItem(`shop_votes_${shopId}`, JSON.stringify(votes));
  };

  // Handle review helpful/unhelpful voting with toggle/switch logic - Optimized with useCallback
  const handleVote = useCallback(async (reviewId: string, vote: 'helpful' | 'unhelpful') => {
    const currentVote = userVotes[reviewId];
    
    // Optimistic update - update UI immediately
    const newVotes = { ...userVotes };
    if (currentVote === vote) {
      delete newVotes[reviewId];
    } else {
      newVotes[reviewId] = vote;
    }
    setUserVotes(newVotes);
    
    // If already voted the same way, remove vote (toggle off)
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
          
          setReviews((prev: Review[]) => prev.map((r: Review) => {
            if (r.review_id === reviewId) {
              return {
                ...r,
                helpful_count: vote === 'helpful' ? Math.max(0, (r.helpful_count || 0) - 1) : r.helpful_count,
                unhelpful_count: vote === 'unhelpful' ? Math.max(0, (r.unhelpful_count || 0) - 1) : r.unhelpful_count,
              };
            }
            return r;
          }));
        }
      } catch (err) {
        console.error('Failed to remove vote:', err);
      }
    } else if (currentVote && currentVote !== vote) {
      // Switching vote - remove old vote and add new vote
      try {
        // Remove old vote
        const removeRes = await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote: currentVote }),
        });
        
        // Add new vote
        const addRes = await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote }),
        });
        
        if (removeRes.ok && addRes.ok) {
          const newVotes = { ...userVotes, [reviewId]: vote };
          saveUserVotes(newVotes);
          
          setReviews((prev: Review[]) => prev.map((r: Review) => {
            if (r.review_id === reviewId) {
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
          }));
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
          
          setReviews((prev: Review[]) => prev.map((r: Review) => {
            if (r.review_id === reviewId) {
              return {
                ...r,
                helpful_count: vote === 'helpful' ? (r.helpful_count || 0) + 1 : r.helpful_count,
                unhelpful_count: vote === 'unhelpful' ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count,
              };
            }
            return r;
          }));
        }
      } catch (err) {
        console.error('Failed to vote:', err);
      }
    }
  }, [userVotes, shopId]);

  // Load language preference and followed status from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
    
    // Check if shop is followed (user-specific)
    if (user?.uid) {
      const followedShops = JSON.parse(localStorage.getItem(`followedShops_${user.uid}`) || "[]");
      setIsFollowing(followedShops.includes(shopId));
    }
  }, [shopId, user?.uid]);

  // Save language preference
  const toggleLanguage = () => {
    const newLang = language === "en" ? "my" : "en";
    setLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
  };

  // Fetch shop data
  const fetchShopData = async () => {
    if (!shopId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch shop details
      const shopRes = await fetch(`/api/shops/${shopId}`);
      if (!shopRes.ok) {
        if (shopRes.status === 404) {
          throw new Error("Shop not found");
        }
        throw new Error("Failed to fetch shop details");
      }
      const data = await shopRes.json();
      console.log("Shop loaded:", { categories: data.data.categories, shopId });
      setShop(data.data);
      setIsFollowing(data.data.isFollowing || false);

      // Fetch products
      const productsRes = await fetch(`/api/shops/${shopId}/products?sort=freshness&limit=50`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        console.log("Products loaded:", productsData.data.products.map((p: Product) => ({ id: p.product_id, category_id: p.category_id, name: p.product_name })));
        setProducts(productsData.data.products);
      }

      // Fetch reviews
      const reviewsRes = await fetch(`/api/shops/${shopId}/reviews?limit=5`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.data.reviews);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea]" />
          <p className="mt-4 text-[var(--text-gray)]">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || t.errorLoading}</p>
          <button
            onClick={fetchShopData}
            className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {t.tryAgain}
          </button>
          <Link 
            href="/map" 
            className="block mt-4 text-[#667eea] hover:underline"
          >
            ← {t.back}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = language === "my" && shop.name_mm ? shop.name_mm : shop.name;
  
  // Calculate rating distribution
  const ratingDistribution = calculateRatingDistribution(reviews);

  return (
    <div className="min-h-screen bg-[var(--background)]">
          {/* Header */}
          <header className="bg-[var(--card-bg)] border-b border-gray-200/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-500/10 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-[var(--text-dark)]" />
                  </button>
                  <h1 className="text-lg font-semibold text-[var(--text-dark)] line-clamp-1 max-w-[200px] sm:max-w-md">
                    {displayName}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert("Shop link copied to clipboard!");
                  }}
                  className="p-2 rounded-full hover:bg-gray-500/10 transition-colors"
                  title="Share shop"
                >
                  <Share2 className="h-5 w-5 text-[var(--text-dark)]" />
                </button>
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

          {/* Hero Banner */}
          <div className="relative w-full h-48 sm:h-64 bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 overflow-visible pb-12 sm:pb-16">
            <div className="absolute inset-0 overflow-hidden">
              {shop.image_urls && shop.image_urls.length > 0 ? (
                <img 
                  src={shop.image_urls[0]} 
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
            </div>
            
            {/* Shop Logo Overlay */}
            <div className="absolute -bottom-6 sm:-bottom-8 left-4 sm:left-8 z-10">
              <div className="relative">
                {shop.logo_url ? (
                  <img 
                    src={shop.logo_url} 
                    alt={shop.name}
                    className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-[var(--card-bg)] shadow-2xl bg-[var(--card-bg)]"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-3xl sm:text-5xl border-4 border-[var(--card-bg)] shadow-2xl">
                    {CATEGORY_ICONS[shop.category] || "🏪"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        {/* Shop Header Section */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
          {/* Spacer for logo */}
          <div className="flex-shrink-0 w-24 sm:w-32" />
          
          {/* Shop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--text-dark)] mb-1">
                  {CATEGORY_LABELS[language][shop.category] || shop.category}
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-dark)] mb-1">{displayName}</h2>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-dark)]">{shop.rating.toFixed(1)}</span>
                  <span className="text-sm text-[#667eea] hover:underline cursor-pointer">
                    ({shop.review_count} {t.reviews.toLowerCase()})
                  </span>
                </div>
                
                {/* Response Time & Delivery */}
                <div className="flex items-center gap-4 text-sm text-[var(--text-dark)]">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{t.respondsIn} &lt;{shop.response_time_hours} {t.hours}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    <span>{shop.delivery_available ? t.deliveryAvailable : t.pickup}</span>
                  </div>
                  
                  {/* Social Media Icons */}
                  {(shop.facebook || shop.tiktok) && (
                    <div className="flex items-center gap-2 ml-2">
                      {shop.facebook && (
                        <a 
                          href={shop.facebook.startsWith('http') ? shop.facebook : `https://${shop.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:bg-[#166fe5] transition-colors"
                          title="Facebook"
                        >
                          {/* Facebook "f" logo */}
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      )}
                      {shop.tiktok && (
                        <a 
                          href={shop.tiktok.startsWith('http') ? shop.tiktok : `https://tiktok.com/@${shop.tiktok.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
                          title="TikTok"
                        >
                          {/* TikTok musical note logo */}
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!user?.uid) return;
                    const followedShops = JSON.parse(localStorage.getItem(`followedShops_${user.uid}`) || "[]");
                    if (isFollowing) {
                      const updated = followedShops.filter((id: string) => id !== shopId);
                      localStorage.setItem(`followedShops_${user.uid}`, JSON.stringify(updated));
                      setIsFollowing(false);
                    } else {
                      followedShops.push(shopId);
                      localStorage.setItem(`followedShops_${user.uid}`, JSON.stringify(followedShops));
                      setIsFollowing(true);
                    }
                  }}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isFollowing 
                      ? "border-[#667eea] bg-[#667eea]/10 text-[#667eea]" 
                      : "border-gray-200/50 text-[var(--text-dark)] hover:border-gray-200"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFollowing ? "fill-[#667eea]" : ""}`} />
                  <span className="hidden sm:inline">{isFollowing ? (language === "en" ? "Following" : "ဖောလိုလုပ်ထားသည်") : t.followShop}</span>
                </button>
                <a 
                  href={`tel:${shop.phone}`}
                  className="px-4 py-2 bg-[#667eea] text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.contactShop}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        {((shop.categories && shop.categories.length > 0) || new Set(products.map(p => p.category_id || shop.category)).size > 1) && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {/* All tab */}
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#667eea] text-white"
                    : "bg-[var(--card-bg)] text-[var(--text-gray)] border border-gray-200/20 hover:border-[#667eea]/50"
                }`}
              >
                {language === "my" ? "အားလုံး" : "All"}
              </button>
              
              {/* Custom categories from shop */}
              {shop.categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-[#667eea] text-white"
                      : "bg-[var(--card-bg)] text-[var(--text-gray)] border border-gray-200/20 hover:border-[#667eea]/50"
                  }`}
                >
                  <span>{cat.icon || "📦"}</span>
                  <span>{language === "my" && cat.name_mm ? cat.name_mm : (cat.name || cat.name_mm)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Products Section */}
        {products.length > 0 && selectedCategory === "all" && sortBy === "featured" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-dark)]">{t.featuredProducts}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.slice(0, FEATURED_COUNT).map((product) => (
                <FeaturedProductCard
                  key={product.product_id}
                  product={product}
                  shop={shop}
                  language={language}
                  t={t}
                  onClick={() => router.push(`/product/${product.product_id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products Grid - Amazon Style */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-dark)]">
              {selectedCategory === "all" 
                ? `${products.length} ${language === "en" ? "products" : "ပစ္စည်းများ"}`
                : `${products.filter(p => p.category_id === selectedCategory).length} ${language === "en" ? "products" : "ပစ္စည်းများ"}`
              }
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--text-dark)]">
              <span>{language === "en" ? "Sort by:" : "စီစဉ်မည်:"}</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 bg-[var(--card-bg)] text-[var(--text-dark)]"
              >
                <option value="featured">{language === "en" ? "Featured" : "အထူး"}</option>
                <option value="price_low">{language === "en" ? "Price: Low to High" : "စျေးနှုန်း - နိမ့်မှ မြင့်"}</option>
                <option value="price_high">{language === "en" ? "Price: High to Low" : "စျေးနှုန်း - မြင့်မှ နိမ့်"}</option>
                <option value="freshness">{language === "en" ? "Freshness" : "သစ်သစ်မှု"}</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {(() => {
            // Filter products by category
            let filteredProducts = selectedCategory === "all" 
              ? [...products] 
              : products.filter(p => p.category_id === selectedCategory);
            
            // Sort products based on selected sort option
            const sortedProducts = filteredProducts.sort((a, b) => {
              switch (sortBy) {
                case "price_low":
                  return a.price - b.price;
                case "price_high":
                  return b.price - a.price;
                case "freshness":
                  const freshnessPriority = { green: 3, orange: 2, red: 1 };
                  return freshnessPriority[b.freshness_badge] - freshnessPriority[a.freshness_badge];
                case "featured":
                default:
                  return 0; // Keep original order
              }
            });
            
            const displayProducts = showAllProducts ? sortedProducts : sortedProducts.slice(0, PRODUCTS_PER_PAGE);
            
            return sortedProducts.length === 0 ? (
              <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-gray-200/20">
                <Package className="h-16 w-16 text-[var(--text-dark)] mx-auto mb-4" />
                <p className="text-[var(--text-dark)] text-lg">{t.noProducts}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {displayProducts.map((product) => (
                    <AmazonProductCard
                      key={product.product_id}
                      product={product}
                      shop={shop}
                      language={language}
                      t={t}
                      onClick={() => router.push(`/product/${product.product_id}`)}
                    />
                  ))}
                </div>
                
                {sortedProducts.length > PRODUCTS_PER_PAGE && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowAllProducts(!showAllProducts)}
                      className="px-6 py-3 border-2 border-gray-200/50 rounded-xl font-medium text-[var(--text-dark)] hover:border-gray-200 transition-colors"
                    >
                      {showAllProducts 
                        ? (language === "en" ? "Show Less" : "ပြန်သိပ်မည်") 
                        : (language === "en" ? `See All (${sortedProducts.length} products)` : `အားလုံးကြည့်မည် (${sortedProducts.length} ပစ္စည်း)`)}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Shop Info Tabs */}
        <div className="border-t border-gray-200/20 pt-6 mb-8">
          {/* Tab Headers */}
          <div className="flex gap-6 border-b border-gray-200/20 mb-6">
            {[
              { key: "about", label: language === "en" ? "About This Shop" : "ဆိုင်အကြောင်း" },
              { key: "specs", label: t.specifications },
              { key: "shipping", label: t.shippingInfo },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key 
                    ? "text-[#667eea]" 
                    : "text-[var(--text-gray)] hover:text-[var(--text-dark)]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#667eea]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[100px]">
            {activeTab === "about" && (
              <ShopDescriptionEditor shop={shop} language={language} />
            )}
            
            {activeTab === "specs" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-200/10">
                  <span className="text-[var(--text-gray)]">{language === "en" ? "Category" : "အမျိုးအစား"}</span>
                  <span className="font-medium text-[var(--text-dark)]">{CATEGORY_LABELS[language][shop.category] || shop.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200/10">
                  <span className="text-[var(--text-gray)]">{language === "en" ? "Response Time" : "ပြန်ကြားချိန်"}</span>
                  <span className="font-medium text-[var(--text-dark)]">&lt;{shop.response_time_hours} {t.hours}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200/10">
                  <span className="text-[var(--text-gray)]">{language === "en" ? "Delivery" : "ပို့ဆောင်ရေး"}</span>
                  <span className="font-medium text-[var(--text-dark)]">{shop.delivery_available ? t.deliveryAvailable : t.deliveryNotAvailable}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200/10">
                  <span className="text-[var(--text-gray)]">{language === "en" ? "Phone" : "ဖုန်း"}</span>
                  <span className="font-medium text-[var(--text-dark)]">{shop.phone}</span>
                </div>
              </div>
            )}
            
            {activeTab === "shipping" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Truck className="h-5 w-5 text-[#667eea] mt-0.5" />
                  <div>
                    <p className="font-medium text-[var(--text-dark)]">{shop.delivery_available ? t.deliveryAvailable : t.pickup}</p>
                    <p className="text-sm text-[var(--text-gray)]">{shop.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-[#667eea] mt-0.5" />
                  <div>
                    <p className="font-medium text-[var(--text-dark)]">{language === "en" ? "Shop Location" : "ဆိုင်တည်နေရာ"}</p>
                    <Link 
                      href={`/map?shop=${shop.shop_id}&lat=${shop.latitude}&lng=${shop.longitude}&name=${encodeURIComponent(shop.name)}`}
                      className="text-sm text-[#667eea] hover:underline"
                    >
                      {language === "en" ? "View on map" : "မြေပုံပေါ်ကြည့်ရန်"}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="border-t border-gray-200/20 pt-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-dark)]">{t.customerReviews}</h2>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-[#667eea] text-white rounded-lg font-medium hover:opacity-90 transition-all"
            >
              {language === "en" ? "Write a Review" : "သုံးသပ်ရေးသားမယ်"}
            </button>
          </div>
          
          {reviews.length > 0 ? (
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Summary */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-4xl font-bold text-black">{shop.rating.toFixed(1)}</span>
                  <div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-black">{shop.review_count} {t.reviews.toLowerCase()}</p>
                  </div>
                </div>
                
                {/* Rating Bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-black w-8">{rating} {language === "en" ? "star" : "ကြယ်"}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${ratingDistribution.percentages[rating as keyof typeof ratingDistribution.percentages]}%` }}
                        />
                      </div>
                      <span className="text-sm text-black w-10 text-right">
                        {ratingDistribution.percentages[rating as keyof typeof ratingDistribution.percentages]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Cards */}
              <div className="lg:col-span-2 space-y-4">
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                  <AmazonReviewCard key={review.review_id} review={review} language={language} onVote={handleVote} userVotes={userVotes} />
                ))}
                
                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full py-3 border border-gray-200/20 rounded-lg font-medium text-[var(--text-dark)] hover:bg-gray-500/10 transition-colors"
                  >
                    {showAllReviews ? "Show Less" : t.viewAllReviews}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-[var(--card-bg)] rounded-xl">
              <p className="text-[var(--text-dark)]">
                {language === "en" ? "No reviews yet. Be the first to review!" : "သုံးသပ်ချက်များ မရှိသေးပါ။ ပထမဆုံးသုံးသပ်ရေးသားပါ!"}
              </p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-md border border-gray-200/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--text-dark)]">
                    {t.writeAReview}
                  </h3>
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
                    placeholder={language === "en" ? "Share your experience..." : "သင့်အတွေ့အကြုံ မျှဝင်ပါ..."}
                  />
                  <p className="text-xs text-[var(--text-gray)] mt-1 text-right">
                    {reviewText.length}/500
                  </p>
                </div>

                {/* Error */}
                {reviewError && (
                  <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                    {reviewError}
                  </div>
                )}

                <button
                  onClick={handleReview}
                  disabled={reviewLoading}
                  className="w-full py-3 px-4 bg-[#667eea] text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
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
      </main>
    </div>
  );
}

// Featured Product Card Component - Larger card for featured section
const FeaturedProductCard = React.memo(function FeaturedProductCard({
  product,
  shop,
  language,
  t,
  onClick,
}: {
  product: Product;
  shop: Shop;
  language: Language;
  t: typeof TRANSLATIONS["en"];
  onClick: () => void;
}) {
  const displayName = language === "my" && product.product_name_mm 
    ? product.product_name_mm 
    : product.product_name;
  
  const FRESHNESS_STYLES = {
    green: { bg: "bg-green-500/20", text: "text-green-500" },
    orange: { bg: "bg-orange-500/20", text: "text-orange-500" },
    red: { bg: "bg-red-500/20", text: "text-red-500" },
  };
  
  const freshness = FRESHNESS_STYLES[product.freshness_badge] || FRESHNESS_STYLES.red;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-[var(--card-bg)] rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 border-[var(--border-subtle)] hover:border-[#667eea] overflow-hidden"
    >
      {/* Product Image - Larger for featured */}
      <div className="relative aspect-[4/3] bg-[var(--background)] overflow-hidden">
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
            <span className="text-6xl">📦</span>
          </div>
        )}
        
        {/* Freshness Badge */}
        {product.freshness_badge !== "red" && (
          <span className={`absolute top-3 left-3 px-2 py-1 ${freshness.bg} ${freshness.text} text-xs font-semibold rounded-full`}>
            {freshnessLabels[language][product.freshness_badge]}
          </span>
        )}
        
        {/* Hover Overlay with View Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
          <span className="px-4 py-2 bg-white/90 text-[var(--text-dark)] rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
            {t.view}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-dark)] line-clamp-2 mb-2 group-hover:text-[#667eea] transition-colors">
          {displayName}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#667eea]">
            {product.price.toLocaleString()} {product.currency}
          </span>
          
          {product.average_rating && product.average_rating > 0 && (
            <div className="flex items-center gap-1 text-sm text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span>{product.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
});

// Amazon Product Card Component - for grid view - Optimized with React.memo
const AmazonProductCard = React.memo(function AmazonProductCard({
  product,
  shop,
  language,
  t,
  onClick,
}: {
  product: Product;
  shop: Shop;
  language: Language;
  t: typeof TRANSLATIONS["en"];
  onClick: () => void;
}) {
  const freshnessColors = {
    green: { bg: "bg-green-500/20", text: "text-green-500" },
    orange: { bg: "bg-orange-500/20", text: "text-orange-500" },
    red: { bg: "bg-red-500/20", text: "text-red-500" },
  };

  const freshness = freshnessColors[product.freshness_badge];
  const displayName = language === "my" && product.product_name_mm 
    ? product.product_name_mm 
    : product.product_name;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-[var(--card-bg)] rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-200/20 hover:border-gray-200/40 overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square bg-[var(--background)] relative overflow-hidden">
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={displayName}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-500/30" />
          </div>
        )}
        
        {/* New Badge - only show for green/orange (new items) */}
        {product.freshness_badge !== "red" && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${freshness.bg} ${freshness.text}`}>
              {freshnessLabels[language][product.freshness_badge]}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-[var(--text-dark)] line-clamp-2 mb-1 group-hover:text-[#667eea] transition-colors min-h-[2.5rem]">
          {displayName}
        </h3>

        {/* Rating - hide stars if no reviews, show encouraging text */}
        <div className="flex items-center gap-1 mb-2 min-h-[1rem]">
          {(product.review_count || 0) > 0 ? (
            <>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${star <= Math.round(product.average_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--text-gray)]">({product.review_count})</span>
            </>
          ) : (
            <span className="text-xs text-[#667eea]">Be first to review!</span>
          )}
        </div>

        {/* Price */}
        <div>
          <span className="text-lg font-bold text-[var(--text-dark)]">
            {product.price.toLocaleString()} {product.currency}
          </span>
        </div>

        {/* Delivery/Pickup badge */}
        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-gray)]">
          <Truck className="h-3 w-3" />
          <span>{shop.delivery_available ? t.deliveryAvailable : t.pickup}</span>
        </div>
      </div>
    </button>
  );
});

// Amazon Review Card Component - Optimized with React.memo
const AmazonReviewCard = React.memo(function AmazonReviewCard({
  review,
  language,
  onVote,
  userVotes,
}: {
  review: Review;
  language: Language;
  onVote?: (reviewId: string, vote: 'helpful' | 'unhelpful') => void;
  userVotes?: Record<string, 'helpful' | 'unhelpful'>;
}) {
  const userVote = userVotes?.[review.review_id || review.id];
  
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-200/20">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-[var(--text-dark)]">{review.reviewer_name}</p>
          <p className="text-xs text-[var(--text-gray)]">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-500/10 px-2 py-1 rounded">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-[var(--text-dark)]">{review.rating}</span>
        </div>
      </div>
      
      <p className="text-sm text-[var(--text-gray)] mb-3">{review.review_text}</p>
      
      {/* Was this helpful? */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200/20">
        <span className="text-sm text-[var(--text-gray)]">
          {language === "en" ? "Was this helpful?" : "အကူအညီဖြစ်ပါသလား?"}
        </span>
        <button 
          onClick={() => onVote?.(review.review_id || review.id, 'helpful')}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            userVote === 'helpful' 
              ? 'bg-[#667eea] text-white' 
              : 'bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20'
          }`}
        >
          {language === "en" ? "Yes" : "ဟုတ်တယ်"}
        </button>
        <button 
          onClick={() => onVote?.(review.review_id || review.id, 'unhelpful')}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            userVote === 'unhelpful' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20'
          }`}
        >
          {language === "en" ? "No" : "မဟုတ်ဘူး"}
        </button>
      </div>
      
      {/* X people found this helpful - only show when Yes voted and count > 0 */}
      {userVote === 'helpful' && (review.helpful_count || 0) > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {review.helpful_count} {language === "en" ? "people found this helpful" : "ဦး သည် အကူအညီဖြစ်သည်ဟု ထင်မြင်သည်"}
        </p>
      )}
    </div>
  );
});

// Shop Description Editor Component
function ShopDescriptionEditor({ shop, language }: { shop: Shop; language: Language }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(shop.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check if current user is the shop owner
  useEffect(() => {
    const checkOwnership = async () => {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (user && shop.owner_id === user.uid) {
        setIsOwner(true);
      }
    };
    checkOwnership();
  }, [shop.owner_id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
      const db = getFirestore();
      await updateDoc(doc(db, "shops", shop.shop_id), {
        description: description,
        updated_at: new Date().toISOString(),
      });
      shop.description = description;
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving description:", error);
      alert("Failed to save description. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={language === "en" ? "Enter shop description..." : "ဆိုင်အကြောင်းဖော်ပြပါ..."}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--background)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none text-[var(--text-dark)]"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#667eea] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setDescription(shop.description || "");
              setIsEditing(false);
            }}
            className="px-4 py-2 border border-gray-200/20 text-[var(--text-dark)] rounded-lg hover:bg-gray-500/10 transition-colors"
          >
            {language === "en" ? "Cancel" : "ပယ်ဖျက်ပါ"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shop.description ? (
        <p className="text-[var(--text-gray)] whitespace-pre-wrap">{shop.description}</p>
      ) : (
        <p className="text-[var(--text-gray)] italic">
          {language === "en" ? "No description available" : "ဖော်ပြချက်မရှိပါ"}
        </p>
      )}
      {isOwner && (
        <button
          onClick={() => setIsEditing(true)}
          className="text-[#667eea] text-sm font-medium hover:underline"
        >
          {language === "en" ? "Edit Description" : "ဖော်ပြချက်ပြင်ပါ"}
        </button>
      )}
    </div>
  );
}
