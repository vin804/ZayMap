"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useAuthGuard } from "@/components/auth-guard";
import {
  Star, MapPin, Phone, Truck, Clock, ChevronLeft, Loader2,
  AlertCircle, RefreshCw, Globe, Heart, Share2, Shield,
  ChevronRight, ThumbsUp, ThumbsDown, Package, X, Video,
  ExternalLink, Store, ChevronDown,
} from "lucide-react";

// ============================================================
// TYPES & CONSTANTS (unchanged)
// ============================================================
const freshnessLabels = {
  en: { green: "New", orange: "Recent", red: "" },
  my: { green: "အသစ်", orange: "မကြာသေးခင်", red: "" },
};

interface Category { id: string; name?: string; name_mm?: string; icon?: string; order_index: number; }
interface Shop {
  shop_id: string; name: string; name_mm?: string; description?: string; description_mm?: string;
  category: string; phone: string; address: string; logo_url?: string; image_urls?: string[];
  latitude: number; longitude: number; delivery_available: boolean;
  avg_responsiveness_rating: number; avg_delivery_quality_rating: number; avg_product_review_rating: number;
  responsiveness_review_count: number; delivery_quality_review_count: number; product_review_count: number;
  response_time_hours: number; rating: number; review_count: number; owner_id?: string;
  facebook?: string; tiktok?: string; categories?: Category[]; isFollowing?: boolean;
}
interface Product {
  product_id: string; shop_id: string; product_name: string; product_name_mm?: string;
  description?: string; image_urls: string[]; price: number; currency: string;
  upload_timestamp: string; freshness_badge: "green" | "orange" | "red";
  average_rating?: number; review_count?: number; category?: string; category_id?: string;
}
interface Review {
  review_id: string; reviewer_name: string; rating: number; comment: string;
  review_type: string; created_at: string; helpful_count?: number; unhelpful_count?: number;
}
type Language = "en" | "my";

const TRANSLATIONS = {
  en: {
    back: "Back", products: "Products", reviews: "Reviews", view: "View",
    deliveryAvailable: "Delivery Available", deliveryNotAvailable: "Delivery Not Available",
    phone: "Phone", address: "Address", respondsIn: "Responds in", hours: "hours",
    rating: "Rating", responsiveness: "Responsiveness", deliveryQuality: "Delivery Quality",
    productReviews: "Product Reviews", viewAllReviews: "View All Reviews",
    noProducts: "No products available", noReviews: "No reviews yet",
    errorLoading: "Failed to load shop details", tryAgain: "Try Again",
    fresh: "Fresh", recent: "Recent", old: "Old", aboutShop: "About This Shop",
    aboutItem: "About This Item", specifications: "Specifications", shippingInfo: "Shipping Info",
    customerReviews: "Customer Reviews", topReviews: "Top Reviews", allStars: "All Stars",
    outOf: "out of 5", verifiedPurchase: "Verified Purchase", helpful: "Helpful",
    customersAlsoViewed: "Customers who viewed this item also viewed", seeAll: "See all",
    followShop: "Follow Shop", contactShop: "Contact Shop", inStock: "In Stock",
    pickup: "In-store Pickup", moreFromShop: "More from this shop", soldBy: "Sold by",
    writeAReview: "Write a Review", ratingLabel: "Rating", reviewOptional: "Review (Optional)",
    submitReview: "Submit Review", submitting: "Submitting...", selectRating: "Please select a rating",
    reviewError: "Failed to submit review. Please try again.", all: "All",
    featuredProducts: "Featured Products", viewAll: "View All", categories: "Categories",
  },
  my: {
    back: "နောက်သို့", products: "ပစ္စည်းများ", reviews: "သုံးသပ်ချက်များ", view: "ကြည့်မယ်",
    deliveryAvailable: "ပို့ဆောင်ရေး ရရှိသည်", deliveryNotAvailable: "ပို့ဆောင်ရေး မရရှိပါ",
    phone: "ဖုန်း", address: "လိပ်စာ", respondsIn: "ပြန်ကြားချိန်", hours: "နာရီ",
    rating: "အဆင့်", responsiveness: "တုန့်ပြန်မှု", deliveryQuality: "ပို့ဆောင်ရေး အရည်အသွေး",
    productReviews: "ပစ္စည်းသုံးသပ်ချက်များ", viewAllReviews: "သုံးသပ်ချက်အားလုံး ကြည့်မယ်",
    noProducts: "ပစ္စည်းများ မရှိပါ", noReviews: "သုံးသပ်ချက်များ မရှိသေးပါ",
    errorLoading: "ဆိုင်အချက်အလက်များ ရယူ၍မရပါ", tryAgain: "ထပ်စမ်းကြည့်မယ်",
    fresh: "သစ်သစ်လှလှ", recent: "မကြာသေးခင်", old: "အဟောင်း", aboutShop: "ဆိုင်အကြောင်း",
    aboutItem: "ဒီပစ္စည်းအကြောင်း", specifications: "အသေးစိတ်", shippingInfo: "ပို့ဆောင်ရေး အချက်အလက်",
    customerReviews: "ဖောက်သည်သုံးသပ်ချက်များ", topReviews: "ထိပ်တန်းသုံးသပ်ချက်များ",
    allStars: "အားလုံး", outOf: "မှ ၅ ထဲ", verifiedPurchase: "အတည်ပြုထားသည့် ဝယ်ယူမှု",
    helpful: "ကူညီသည်", customersAlsoViewed: "ဒီပစ္စည်းကြည့်သူတွေ ထပ်ကြည့်ခဲ့ကြသည်",
    seeAll: "အားလုံးကြည့်", followShop: "ဆိုက်ကို Follow လုပ်ရန်", contactShop: "ဆိုင်ကို ဆက်သွယ်ရန်",
    inStock: "ရှိသည်", pickup: "ဆိုင်ကောက်ယူ", moreFromShop: "ဆိုင်ထပ်ပစ္စည်းများ", soldBy: "ရောင်းသူ",
    writeAReview: "သုံးသပ်ရေးသားရန်", ratingLabel: "အဆင့်သတ်မှတ်",
    reviewOptional: "သုံးသပ်ချက် (မဖြစ်မနေ မဟုတ်)", submitReview: "ပို့စ်တင်",
    submitting: "ပို့စ်တင်နေသည်...", selectRating: "အဆင့်ရွေးပါ",
    reviewError: "သုံးသပ်ချက်တင်မှု မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။", all: "အားလုံး",
    featuredProducts: "အထူးပစ္စည်းများ", viewAll: "အားလုံးကြည့်", categories: "အမျိုးအစားများ",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕", electronics: "📱", food: "🍜", cosmetics: "💄",
  second_hand: "♻️", other: "🏪", jewelry: "💍", fashion: "👗",
  beauty: "💅", home: "🏠", sports: "⚽", books: "📚",
  toys: "🧸", automotive: "🚗",
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: { clothes: "Clothes", electronics: "Electronics", food: "Food", cosmetics: "Cosmetics", second_hand: "Second-hand", other: "Other", jewelry: "Jewelry", fashion: "Fashion", beauty: "Beauty & Health", home: "Home & Garden", sports: "Sports", books: "Books", toys: "Toys", automotive: "Automotive" },
  my: { clothes: "အဝတ်အစား", electronics: "အီလက်ထရွန်", food: "အစားအစာ", cosmetics: "အလှကုန်", second_hand: "အသုံးပြုထားသော", other: "အခြား", jewelry: "ရွှေရတနာ", fashion: "ဖက်ရှင်", beauty: "အလှအပ", home: "အိမ်အသုံးအဆောင်", sports: "အားကစား", books: "စာအုပ်", toys: "ဆော့ကစားစရာ", automotive: "ကားပစ္စည်း" },
};

const FRESHNESS_STYLES = {
  green: { label: "New", bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
  orange: { label: "Recent", bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  red: { label: "", bg: "", text: "", border: "" },
};

function calculateRatingDistribution(reviews: Review[]) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((review) => {
    const rating = Math.floor(review.rating);
    if (rating >= 1 && rating <= 5) distribution[rating as keyof typeof distribution]++;
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
    },
  };
}

// ============================================================
// ANIMATION VARIANTS
// ============================================================
const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};
const cardHover = {
  y: -6,
  boxShadow: "0 20px 40px -12px rgba(102,126,234,0.12), 0 8px 16px -6px rgba(0,0,0,0.06)",
  transition: { duration: 0.3 },
};

// ============================================================
// MAIN PAGE
// ============================================================
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
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { user } = useAuth();
  const reviewerName = user?.displayName || user?.email?.split("@")[0] || "Anonymous";
  const [activeTab, setActiveTab] = useState<"about" | "specs" | "shipping">("about");
  const [sortBy, setSortBy] = useState<"featured" | "price_low" | "price_high" | "freshness">("featured");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, "helpful" | "unhelpful">>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const PRODUCTS_PER_PAGE = 12;
  const FEATURED_COUNT = 3;
  const { checkAuth, AuthGuardModal } = useAuthGuard();
  const t = TRANSLATIONS[language];

  const getVotesStorageKey = (uid?: string) => (uid ? `shop_votes_${shopId}_${uid}` : null);

  // Load user votes
  useEffect(() => {
    if (!user?.uid) { setUserVotes({}); return; }
    const storageKey = getVotesStorageKey(user.uid);
    const savedVotes = storageKey ? localStorage.getItem(storageKey) : null;
    if (savedVotes) setUserVotes(JSON.parse(savedVotes));
    else setUserVotes({});
  }, [shopId, user?.uid]);

  const saveUserVotes = (votes: Record<string, "helpful" | "unhelpful">) => {
    setUserVotes(votes);
    if (!user?.uid) return;
    const storageKey = getVotesStorageKey(user.uid);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(votes));
  };

  // Handle review vote
  const handleVote = async (reviewId: string, vote: "helpful" | "unhelpful") => {
    if (!checkAuth(user, "vote on reviews")) return;
    const currentVote = userVotes[reviewId];
    if (currentVote === vote) {
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, {
          method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }),
        });
        if (res.ok) {
          const newVotes = { ...userVotes }; delete newVotes[reviewId]; saveUserVotes(newVotes);
          setReviews((prev) => prev.map((r) => r.review_id === reviewId ? { ...r, helpful_count: vote === "helpful" ? Math.max(0, (r.helpful_count || 0) - 1) : r.helpful_count, unhelpful_count: vote === "unhelpful" ? Math.max(0, (r.unhelpful_count || 0) - 1) : r.unhelpful_count } : r));
        }
      } catch (err) { console.error("Failed to remove vote:", err); }
    } else if (currentVote && currentVote !== vote) {
      try {
        await fetch(`/api/reviews/${reviewId}/vote`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote: currentVote }) });
        await fetch(`/api/reviews/${reviewId}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        const newVotes = { ...userVotes, [reviewId]: vote }; saveUserVotes(newVotes);
        setReviews((prev) => prev.map((r) => {
          if (r.review_id !== reviewId) return r;
          const old = currentVote;
          return { ...r, helpful_count: old === "helpful" ? Math.max(0, (r.helpful_count || 0) - 1) : vote === "helpful" ? (r.helpful_count || 0) + 1 : r.helpful_count, unhelpful_count: old === "unhelpful" ? Math.max(0, (r.unhelpful_count || 0) - 1) : vote === "unhelpful" ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count };
        }));
      } catch (err) { console.error("Failed to switch vote:", err); }
    } else {
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        if (res.ok) {
          const newVotes = { ...userVotes, [reviewId]: vote }; saveUserVotes(newVotes);
          setReviews((prev) => prev.map((r) => r.review_id === reviewId ? { ...r, helpful_count: vote === "helpful" ? (r.helpful_count || 0) + 1 : r.helpful_count, unhelpful_count: vote === "unhelpful" ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count } : r));
        }
      } catch (err) { console.error("Failed to vote:", err); }
    }
  };

  // Load language & follow status
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "my")) setLanguage(savedLang);
    if (user?.uid) {
      const followedShops = JSON.parse(localStorage.getItem(`followedShops_${user.uid}`) || "[]");
      setIsFollowing(followedShops.includes(shopId));
    }
  }, [shopId, user?.uid]);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "my" : "en";
    setLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
  };

  const handleReview = async () => {
    setReviewError(null);
    if (reviewRating === 0) { setReviewError(t.selectRating); return; }
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_name: reviewerName, rating: reviewRating, comment: reviewText, review_type: "product_review" }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || t.reviewError); }
      setReviewText(""); setReviewRating(5); setShowReviewModal(false);
      const reviewsRes = await fetch(`/api/shops/${shopId}/reviews?limit=5`);
      if (reviewsRes.ok) { const reviewsData = await reviewsRes.json(); setReviews(reviewsData.data.reviews); }
    } catch (err) { setReviewError(err instanceof Error ? err.message : t.reviewError); }
    finally { setReviewLoading(false); }
  };

  const fetchShopData = async () => {
    if (!shopId) return;
    setLoading(true); setError(null);
    try {
      const shopRes = await fetch(`/api/shops/${shopId}`);
      if (!shopRes.ok) { if (shopRes.status === 404) throw new Error("Shop not found"); throw new Error("Failed to fetch shop details"); }
      const data = await shopRes.json();
      setShop(data.data); setIsFollowing(data.data.isFollowing || false);
      const productsRes = await fetch(`/api/shops/${shopId}/products?sort=freshness&limit=50`);
      if (productsRes.ok) { const productsData = await productsRes.json(); setProducts(productsData.data.products); }
      const reviewsRes = await fetch(`/api/shops/${shopId}/reviews?limit=5`);
      if (reviewsRes.ok) { const reviewsData = await reviewsRes.json(); setReviews(reviewsData.data.reviews); }
    } catch (err) { setError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchShopData(); }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Header skeleton */}
        <div className="sticky top-0 z-40" style={{ backdropFilter: "blur(20px)", background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl shimmer" />
            <div className="h-5 rounded-lg shimmer" style={{ width: 180 }} />
            <div className="ml-auto flex gap-2">
              <div className="w-9 h-9 rounded-xl shimmer" />
              <div className="w-16 h-9 rounded-full shimmer" />
            </div>
          </div>
        </div>

        {/* Banner skeleton */}
        <div className="relative w-full h-48 sm:h-64">
          <div className="absolute inset-0 shimmer" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg), transparent 60%)" }} />
          {/* Logo skeleton */}
          <div className="absolute -bottom-8 sm:-bottom-10 left-4 sm:left-8 z-10">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl shimmer border-4" style={{ borderColor: "var(--bg-elevated)" }} />
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 pt-12 pb-6">
          {/* Shop info skeleton */}
          <div className="flex items-start gap-4 mb-8 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex-shrink-0 w-24 sm:w-32" />
            <div className="flex-1 space-y-3">
              <div className="h-4 rounded-lg shimmer" style={{ width: 100 }} />
              <div className="h-7 rounded-lg shimmer" style={{ width: 250 }} />
              <div className="flex gap-2">
                <div className="h-4 rounded-lg shimmer" style={{ width: 120 }} />
                <div className="h-4 rounded-lg shimmer" style={{ width: 80 }} />
              </div>
              <div className="flex gap-3">
                <div className="h-4 rounded-lg shimmer" style={{ width: 140 }} />
                <div className="h-4 rounded-lg shimmer" style={{ width: 100 }} />
              </div>
            </div>
          </div>

          {/* Products grid skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 rounded-lg shimmer" style={{ width: 120 }} />
            <div className="h-8 rounded-lg shimmer" style={{ width: 140 }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="aspect-square shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-4 rounded-lg shimmer" />
                  <div className="h-3 rounded-lg shimmer" style={{ width: "60%" }} />
                  <div className="h-5 rounded-lg shimmer" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--error)" }} />
          <p className="mb-4" style={{ color: "var(--error)" }}>{error || t.errorLoading}</p>
          <button onClick={fetchShopData} className="btn-gradient flex items-center gap-2 mx-auto">
            <RefreshCw className="h-4 w-4" /> {t.tryAgain}
          </button>
          <Link href="/map" className="block mt-4 text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>← {t.back}</Link>
        </motion.div>
      </div>
    );
  }

  const displayName = language === "my" && shop.name_mm ? shop.name_mm : shop.name;
  const ratingDistribution = calculateRatingDistribution(reviews);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Glass Header */}
      <motion.header initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className="sticky top-0 z-50" style={{ backdropFilter: "blur(20px) saturate(1.2)", WebkitBackdropFilter: "blur(20px) saturate(1.2)", background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn-ghost w-9 h-9 flex items-center justify-center rounded-xl">
              <ChevronLeft className="h-5 w-5" style={{ color: "var(--fg)" }} />
            </button>
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md" style={{ color: "var(--fg)" }}>{displayName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              className="btn-ghost w-9 h-9 flex items-center justify-center rounded-xl" title="Share shop">
              <Share2 className="h-5 w-5" style={{ color: "var(--fg-muted)" }} />
            </button>
            <button onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--fg)" }}>
              {language === "en" ? "EN" : "MY"}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        className="relative w-full h-48 sm:h-64">
        {/* Image container with overflow hidden */}
        <div className="absolute inset-0 overflow-hidden">
          {shop.image_urls && shop.image_urls.length > 0 ? (
            <img src={shop.image_urls[0]} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(118,75,162,0.1))" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg), transparent 60%)" }} />
        </div>
        {/* Logo - positioned outside the overflow-hidden container */}
        <div className="absolute -bottom-8 sm:-bottom-10 left-4 sm:left-8 z-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }}>
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 shadow-2xl"
                style={{ borderColor: "var(--bg-elevated)", background: "var(--bg-elevated)" }} />
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border-4 shadow-2xl"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", borderColor: "var(--bg-elevated)" }}>
                {CATEGORY_ICONS[shop.category] || "🏪"}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      <main className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        {/* Shop Info */}
        <motion.div {...fadeInUp} className="flex flex-col sm:flex-row items-start gap-4 mb-8 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex-shrink-0 w-24 sm:w-32" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                  style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}>
                  {CATEGORY_ICONS[shop.category]} {CATEGORY_LABELS[language][shop.category] || shop.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "var(--fg)" }}>{displayName}</h2>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{shop.rating.toFixed(1)}</span>
                  <span className="text-sm" style={{ color: "var(--accent)" }}>({shop.review_count} {t.reviews.toLowerCase()})</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.respondsIn} &lt;{shop.response_time_hours} {t.hours}</span>
                  <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {shop.delivery_available ? t.deliveryAvailable : t.pickup}</span>
                  {(shop.facebook || shop.tiktok) && (
                    <div className="flex items-center gap-2">
                      {shop.facebook && (
                        <a href={shop.facebook.startsWith("http") ? shop.facebook : `https://${shop.facebook}`} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                      )}
                      {shop.tiktok && (
                        <a href={shop.tiktok.startsWith("http") ? shop.tiktok : `https://tiktok.com/@${shop.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={() => {
                  if (!checkAuth(user, "follow this shop")) return;
                  const uid = user?.uid; if (!uid) return;
                  const followedShops = JSON.parse(localStorage.getItem(`followedShops_${uid}`) || "[]");
                  if (isFollowing) { localStorage.setItem(`followedShops_${uid}`, JSON.stringify(followedShops.filter((id: string) => id !== shopId))); setIsFollowing(false); }
                  else { followedShops.push(shopId); localStorage.setItem(`followedShops_${uid}`, JSON.stringify(followedShops)); setIsFollowing(true); }
                }} className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isFollowing ? "border-2" : "border-2"}`}
                  style={isFollowing ? { borderColor: "var(--accent)", background: "rgba(99,102,241,0.08)", color: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--fg)" }}>
                  <Heart className={`h-4 w-4 ${isFollowing ? "fill-[var(--accent)]" : ""}`} />
                  <span className="hidden sm:inline">{isFollowing ? (language === "en" ? "Following" : "ဖောလိုလုပ်ထားသည်") : t.followShop}</span>
                </button>
                <a href={`tel:${shop.phone}`} className="btn-gradient w-full sm:w-auto text-sm flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.contactShop}</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <AnimatePresence>
          {((shop.categories && shop.categories.length > 0) || new Set(products.map((p) => p.category_id || shop.category)).size > 1) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setSelectedCategory("all")}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                  style={{ background: selectedCategory === "all" ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "var(--bg-hover)", color: selectedCategory === "all" ? "white" : "var(--fg-muted)", border: selectedCategory === "all" ? "none" : "1px solid var(--border)" }}>
                  {language === "my" ? "အားလုံး" : "All"}
                </button>
                {shop.categories?.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
                    style={{ background: selectedCategory === cat.id ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "var(--bg-hover)", color: selectedCategory === cat.id ? "white" : "var(--fg-muted)", border: selectedCategory === cat.id ? "none" : "1px solid var(--border)" }}>
                    <span>{cat.icon || "📦"}</span>
                    <span>{language === "my" && cat.name_mm ? cat.name_mm : cat.name || cat.name_mm}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Products */}
        {products.length > 0 && selectedCategory === "all" && sortBy === "featured" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--fg)" }}>{t.featuredProducts}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.slice(0, FEATURED_COUNT).map((product, i) => (
                <motion.div key={product.product_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <FeaturedProductCard product={product} shop={shop} language={language} t={t} onClick={() => router.push(`/product/${product.product_id}`)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold" style={{ color: "var(--fg)" }}>
              {selectedCategory === "all" ? `${products.length} ${language === "en" ? "products" : "ပစ္စည်းများ"}` : `${products.filter((p) => p.category_id === selectedCategory).length} ${language === "en" ? "products" : "ပစ္စည်းများ"}`}
            </h2>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
              <span>{language === "en" ? "Sort by:" : "စီစဉ်မည်:"}</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1.5 px-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                <option value="featured">{language === "en" ? "Featured" : "အထူး"}</option>
                <option value="price_low">{language === "en" ? "Price: Low to High" : "စျေးနှုန်း - နိမ့်မှ မြင့်"}</option>
                <option value="price_high">{language === "en" ? "Price: High to Low" : "စျေးနှုန်း - မြင့်မှ နိမ့်"}</option>
                <option value="freshness">{language === "en" ? "Freshness" : "သစ်သစ်မှု"}</option>
              </select>
            </div>
          </div>

          {(() => {
            let filtered = selectedCategory === "all" ? [...products] : products.filter((p) => p.category_id === selectedCategory);
            const sorted = filtered.sort((a, b) => {
              switch (sortBy) {
                case "price_low": return a.price - b.price;
                case "price_high": return b.price - a.price;
                case "freshness": return { green: 3, orange: 2, red: 1 }[b.freshness_badge] - { green: 3, orange: 2, red: 1 }[a.freshness_badge];
                default: return 0;
              }
            });
            const display = showAllProducts ? sorted : sorted.slice(0, PRODUCTS_PER_PAGE);
            return sorted.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <Package className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--fg-dim)" }} />
                <p style={{ color: "var(--fg)" }}>{t.noProducts}</p>
              </div>
            ) : (
              <>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {display.map((product) => (
                    <motion.div key={product.product_id} variants={staggerItem}>
                      <AmazonProductCard product={product} shop={shop} language={language} t={t} onClick={() => router.push(`/product/${product.product_id}`)} />
                    </motion.div>
                  ))}
                </motion.div>
                {sorted.length > PRODUCTS_PER_PAGE && (
                  <div className="text-center mt-6">
                    <button onClick={() => setShowAllProducts(!showAllProducts)}
                      className="px-6 py-3 rounded-xl font-medium text-sm transition-all"
                      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                      {showAllProducts ? (language === "en" ? "Show Less" : "ပြန်သိပ်မည်") : `${language === "en" ? "See All" : "အားလုံးကြည့်"} (${sorted.length})`}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>

        {/* Shop Info Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="pt-6 mb-8" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex gap-6 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            {[
              { key: "about", label: language === "en" ? "About This Shop" : "ဆိုင်အကြောင်း" },
              { key: "specs", label: t.specifications },
              { key: "shipping", label: t.shippingInfo },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className="pb-3 text-sm font-medium transition-colors relative"
                style={{ color: activeTab === tab.key ? "var(--accent)" : "var(--fg-muted)" }}>
                {tab.label}
                {activeTab === tab.key && <motion.div layoutId="shop-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "about" && <ShopDescriptionEditor shop={shop} language={language} />}
              {activeTab === "specs" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: language === "en" ? "Category" : "အမျိုးအစား", value: CATEGORY_LABELS[language][shop.category] || shop.category },
                    { label: language === "en" ? "Response Time" : "ပြန်ကြားချိန်", value: `<${shop.response_time_hours} ${t.hours}` },
                    { label: language === "en" ? "Delivery" : "ပို့ဆောင်ရေး", value: shop.delivery_available ? t.deliveryAvailable : t.deliveryNotAvailable },
                    { label: language === "en" ? "Phone" : "ဖုန်း", value: shop.phone },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-3 px-4 rounded-xl" style={{ background: "var(--bg-hover)" }}>
                      <span style={{ color: "var(--fg-muted)" }}>{item.label}</span>
                      <span className="font-medium" style={{ color: "var(--fg)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--bg-hover)" }}>
                    <Truck className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    <div>
                      <p className="font-medium" style={{ color: "var(--fg)" }}>{shop.delivery_available ? t.deliveryAvailable : t.pickup}</p>
                      <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{shop.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--bg-hover)" }}>
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    <div>
                      <p className="font-medium" style={{ color: "var(--fg)" }}>{language === "en" ? "Shop Location" : "ဆိုင်တည်နေရာ"}</p>
                      <Link href={`/map?shop=${shop.shop_id}&lat=${shop.latitude}&lng=${shop.longitude}&name=${encodeURIComponent(shop.name)}`}
                        className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                        {language === "en" ? "View on map" : "မြေပုံပေါ်ကြည့်ရန်"}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="pt-8 mb-8" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-semibold" style={{ color: "var(--fg)" }}>{t.customerReviews}</h2>
            <button onClick={() => setShowReviewModal(true)} className="btn-gradient text-sm">{language === "en" ? "Write a Review" : "သုံးသပ်ရေးသားမယ်"}</button>
          </div>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Summary */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-5xl font-bold" style={{ color: "var(--fg)" }}>{shop.rating.toFixed(1)}</span>
                  <div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{shop.review_count} {t.reviews.toLowerCase()}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const pct = ratingDistribution.percentages[rating as keyof typeof ratingDistribution.percentages];
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-6" style={{ color: "var(--fg)" }}>{rating}</span>
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 * (6 - rating) }}
                            className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #facc15, #eab308)" }} />
                        </div>
                        <span className="text-sm w-10 text-right" style={{ color: "var(--fg-muted)" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Review Cards */}
              <div className="lg:col-span-2 space-y-4">
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review, i) => (
                  <motion.div key={review.review_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <AmazonReviewCard review={review} language={language} onVote={handleVote} userVotes={userVotes} />
                  </motion.div>
                ))}
                {reviews.length > 3 && (
                  <button onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                    {showAllReviews ? "Show Less" : t.viewAllReviews}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--fg-muted)" }}>{language === "en" ? "No reviews yet. Be the first to review!" : "သုံးသပ်ချက်များ မရှိသေးပါ။ ပထမဆုံးသုံးသပ်ရေးသားပါ!"}</p>
            </div>
          )}
        </motion.div>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowReviewModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md rounded-2xl p-6"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" style={{ color: "var(--fg)" }}>{t.writeAReview}</h3>
                  <button onClick={() => setShowReviewModal(false)} className="btn-ghost w-9 h-9 flex items-center justify-center rounded-full">
                    <X className="h-5 w-5" style={{ color: "var(--fg-muted)" }} />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>{t.ratingLabel}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} className="p-1 transition-transform hover:scale-110">
                        <Star className={`h-8 w-8 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>{t.reviewOptional}</label>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} maxLength={500}
                    className="input-field resize-none"
                    placeholder={language === "en" ? "Share your experience..." : "သင့်အတွေ့အကြုံ မျှဝင်ပါ..."} />
                  <p className="text-xs mt-1 text-right" style={{ color: "var(--fg-dim)" }}>{reviewText.length}/500</p>
                </div>
                {reviewError && <div className="alert alert-error mb-4 text-sm"><AlertCircle className="w-4 h-4" /> {reviewError}</div>}
                <button onClick={handleReview} disabled={reviewLoading} className="btn-gradient w-full">
                  {reviewLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</span> : t.submitReview}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AuthGuardModal />
      </main>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS (same logic, redesigned UI)
// ============================================================

const FeaturedProductCard = React.memo(function FeaturedProductCard({ product, shop, language, t, onClick }: { product: Product; shop: Shop; language: Language; t: typeof TRANSLATIONS["en"]; onClick: () => void; }) {
  const displayName = language === "my" && product.product_name_mm ? product.product_name_mm : product.product_name;
  const freshness = FRESHNESS_STYLES[product.freshness_badge] || FRESHNESS_STYLES.red;
  return (
    <motion.button whileHover={cardHover} onClick={onClick} className="group text-left w-full rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--bg)" }}>
        {product.image_urls?.[0] ? (
          <img src={product.image_urls[0]} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(118,75,162,0.05))" }}>
            <span className="text-5xl">📦</span>
          </div>
        )}
        {product.freshness_badge !== "red" && (
          <span className="absolute top-3 left-3 badge" style={{ background: freshness.bg, color: freshness.text, border: `1px solid ${freshness.border}` }}>
            {freshnessLabels[language][product.freshness_badge]}
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <span className="px-4 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
            style={{ background: "rgba(255,255,255,0.9)", color: "#1f2937" }}>{t.view}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ color: "var(--fg)" }}>{displayName}</h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{product.price.toLocaleString()} {product.currency}</span>
          {product.average_rating && product.average_rating > 0 && (
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="h-4 w-4 fill-current" /> <span>{product.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
});

const AmazonProductCard = React.memo(function AmazonProductCard({ product, shop, language, t, onClick }: { product: Product; shop: Shop; language: Language; t: typeof TRANSLATIONS["en"]; onClick: () => void; }) {
  const freshness = FRESHNESS_STYLES[product.freshness_badge];
  const displayName = language === "my" && product.product_name_mm ? product.product_name_mm : product.product_name;
  return (
    <motion.button whileHover={cardHover} onClick={onClick} className="group text-left w-full rounded-xl overflow-hidden"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="aspect-square relative overflow-hidden" style={{ background: "var(--bg)" }}>
        {product.image_urls?.[0] ? (
          <img src={product.image_urls[0]} alt={displayName} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12" style={{ color: "var(--fg-dim)" }} />
          </div>
        )}
        {product.freshness_badge !== "red" && (
          <div className="absolute top-2 left-2">
            <span className="badge" style={{ background: freshness.bg, color: freshness.text, border: `1px solid ${freshness.border}` }}>
              {freshnessLabels[language][product.freshness_badge]}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 mb-1 min-h-[2.5rem] group-hover:text-[var(--accent)] transition-colors" style={{ color: "var(--fg)" }}>{displayName}</h3>
        <div className="flex items-center gap-1 mb-2 min-h-[1rem]">
          {(product.review_count || 0) > 0 ? (
            <>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-3 w-3 ${star <= Math.round(product.average_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`} />
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>({product.review_count})</span>
            </>
          ) : (
            <span className="text-xs" style={{ color: "var(--accent)" }}>Be first to review!</span>
          )}
        </div>
        <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>{product.price.toLocaleString()} {product.currency}</p>
        <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "var(--fg-muted)" }}>
          <Truck className="h-3 w-3" /> <span>{shop.delivery_available ? t.deliveryAvailable : t.pickup}</span>
        </div>
      </div>
    </motion.button>
  );
});

const AmazonReviewCard = React.memo(function AmazonReviewCard({ review, language, onVote, userVotes }: { review: Review; language: Language; onVote?: (reviewId: string, vote: "helpful" | "unhelpful") => void; userVotes?: Record<string, "helpful" | "unhelpful">; }) {
  const userVote = userVotes?.[review.review_id];
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--fg)" }}>{review.reviewer_name}</p>
          <p className="text-xs" style={{ color: "var(--fg-dim)" }}>{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "var(--bg-hover)" }}>
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{review.rating}</span>
        </div>
      </div>
      <p className="text-sm mb-3" style={{ color: "var(--fg-muted)" }}>{review.comment}</p>
      <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--fg-dim)" }}>{language === "en" ? "Helpful?" : "အကူအညီဖြစ်ပါသလား?"}</span>
        <button onClick={() => onVote?.(review.review_id, "helpful")}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{ background: userVote === "helpful" ? "var(--accent)" : "var(--bg-hover)", color: userVote === "helpful" ? "white" : "var(--fg-muted)" }}>
          {language === "en" ? "Yes" : "ဟုတ်တယ်"}
        </button>
        <button onClick={() => onVote?.(review.review_id, "unhelpful")}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{ background: userVote === "unhelpful" ? "var(--error)" : "var(--bg-hover)", color: userVote === "unhelpful" ? "white" : "var(--fg-muted)" }}>
          {language === "en" ? "No" : "မဟုတ်ဘူး"}
        </button>
      </div>
      {(review.helpful_count || 0) > 0 && (
        <p className="text-xs mt-2" style={{ color: "var(--fg-dim)" }}>{review.helpful_count} {language === "en" ? "found this helpful" : "ဦး အကူအညီဖြစ်သည်ဟု ထင်မြင်သည်"}</p>
      )}
    </div>
  );
});

function ShopDescriptionEditor({ shop, language }: { shop: Shop; language: Language }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(shop.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (user && shop.owner_id === user.uid) setIsOwner(true);
    };
    checkOwnership();
  }, [shop.owner_id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
      const db = getFirestore();
      await updateDoc(doc(db, "shops", shop.shop_id), { description, updated_at: new Date().toISOString() });
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
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder={language === "en" ? "Enter shop description..." : "ဆိုင်အကြောင်းဖော်ပြပါ..."}
          rows={4} className="input-field resize-none" />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={isSaving} className="btn-gradient">{isSaving ? "Saving..." : "Save"}</button>
          <button onClick={() => { setDescription(shop.description || ""); setIsEditing(false); }} className="btn-outline">{language === "en" ? "Cancel" : "ပယ်ဖျက်ပါ"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shop.description ? (
        <p style={{ color: "var(--fg-muted)", whiteSpace: "pre-wrap" }}>{shop.description}</p>
      ) : (
        <p className="italic" style={{ color: "var(--fg-dim)" }}>{language === "en" ? "No description available" : "ဖော်ပြချက်မရှိပါ"}</p>
      )}
      {isOwner && (
        <button onClick={() => setIsEditing(true)} className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
          {language === "en" ? "Edit Description" : "ဖော်ပြချက်ပြင်ပါ"}
        </button>
      )}
    </div>
  );
}
