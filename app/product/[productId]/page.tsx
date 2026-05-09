"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useAuthGuard } from "@/components/auth-guard";
import Link from "next/link";
import {
  Star, MapPin, Phone, Truck, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, RefreshCw, Clock, Heart, X,
  CheckCircle, ArrowRight, Share2, Maximize2, Store,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface Product {
  id: string; product_id?: string; name: string; name_mm?: string;
  description?: string; image_urls: string[]; price: number; currency: string;
  delivery_available: boolean; created_at: string;
  shop: { id: string; name: string; name_mm?: string; rating: number; phone?: string; address?: string; delivery_available: boolean; logo_url?: string; latitude?: number; longitude?: number; };
  reviews: Review[]; reviews_count: number; average_rating: number;
}
interface Review {
  id: string; review_id: string; reviewer_name: string; rating: number;
  review_text: string; created_at: string; helpful_count?: number; unhelpful_count?: number;
}
type Language = "en" | "my";

const TRANSLATIONS = {
  en: { back: "Back", productNotFound: "Product not found", loading: "Loading product details...", tryAgain: "Try Again", reviews: "Reviews", noReviews: "No reviews yet. Be the first to review!", writeReview: "Write a Review", viewShop: "View Shop", rating: "Rating", writeAReview: "Write a Review", yourName: "Your name", ratingLabel: "Rating", reviewOptional: "Review (optional)", submitReview: "Submit Review", submitting: "Submitting...", enterName: "Please enter your name", selectRating: "Please select a rating", reviewError: "Failed to submit review. Please try again.", },
  my: { back: "နောက်သို့", productNotFound: "ပစ္စည်းမတွေ့ပါ", loading: "ပစ္စည်းအချက်အလက်များ ရယူနေသည်...", tryAgain: "ထပ်စမ်းကြည့်မယ်", reviews: "သုံးသပ်ချက်များ", noReviews: "သုံးသပ်ချက်များ မရှိသေးပါ။ ပထမဆုံးသုံးသပ်ရေးသားပါ!", writeReview: "သုံးသပ်ရေးသားမယ်", viewShop: "ဆိုင်ကြည့်မယ်", rating: "အဆင့်", writeAReview: "သုံးသပ်ရေးသားမယ်", yourName: "သင့်နာမည်", ratingLabel: "အဆင့်", reviewOptional: "သုံးသပ်ချက် (ချန်လှပ်နိုင်)", submitReview: "သုံးသပ်ချက်တင်မယ်", submitting: "တင်နေသည်...", enterName: "သင့်နာမည်ထည့်ပါ", selectRating: "အဆင့်ရွေးပါ", reviewError: "သုံးသပ်ချက်မတင်နိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။", },
};

const fadeInUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
const staggerContainer = { animate: { transition: { staggerChildren: 0.06 } } };
const staggerItem = { initial: { opacity: 0, y: 20, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } } };

// ============================================================
// MAIN PAGE
// ============================================================
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
  const [swipeDirection, setSwipeDirection] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, "helpful" | "unhelpful">>({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { checkAuth, AuthGuardModal } = useAuthGuard();
  const t = TRANSLATIONS[language];
  const INITIAL_REVIEWS_COUNT = 4;
  const reviewerName = user?.displayName || user?.email?.split("@")[0] || "Anonymous";

  const getVotesStorageKey = (uid?: string) => (uid ? `product_votes_${productId}_${uid}` : null);

  useEffect(() => {
    if (!user?.uid) { setUserVotes({}); return; }
    const key = getVotesStorageKey(user.uid);
    const saved = key ? localStorage.getItem(key) : null;
    setUserVotes(saved ? JSON.parse(saved) : {});
  }, [productId, user?.uid]);

  const saveUserVotes = (votes: Record<string, "helpful" | "unhelpful">) => {
    setUserVotes(votes);
    if (!user?.uid) return;
    const key = getVotesStorageKey(user.uid);
    if (key) localStorage.setItem(key, JSON.stringify(votes));
  };

  const handleVote = async (reviewId: string, vote: "helpful" | "unhelpful") => {
    if (!checkAuth(user, "vote on reviews")) return;
    const currentVote = userVotes[reviewId];
    if (currentVote === vote) {
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        if (res.ok) { const nv = { ...userVotes }; delete nv[reviewId]; saveUserVotes(nv); setProduct((p) => p ? { ...p, reviews: p.reviews.map((r) => (r.review_id === reviewId || r.id === reviewId) ? { ...r, helpful_count: vote === "helpful" ? Math.max(0, (r.helpful_count || 0) - 1) : r.helpful_count, unhelpful_count: vote === "unhelpful" ? Math.max(0, (r.unhelpful_count || 0) - 1) : r.unhelpful_count } : r) } : null); }
      } catch (e) { console.error(e); }
    } else if (currentVote && currentVote !== vote) {
      try {
        await fetch(`/api/reviews/${reviewId}/vote`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote: currentVote }) });
        await fetch(`/api/reviews/${reviewId}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        const nv = { ...userVotes, [reviewId]: vote }; saveUserVotes(nv);
        setProduct((p) => p ? { ...p, reviews: p.reviews.map((r) => { if (r.review_id !== reviewId && r.id !== reviewId) return r; const old = currentVote; return { ...r, helpful_count: old === "helpful" ? Math.max(0, (r.helpful_count || 0) - 1) : vote === "helpful" ? (r.helpful_count || 0) + 1 : r.helpful_count, unhelpful_count: old === "unhelpful" ? Math.max(0, (r.unhelpful_count || 0) - 1) : vote === "unhelpful" ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count }; }) } : null);
      } catch (e) { console.error(e); }
    } else {
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vote }) });
        if (res.ok) { const nv = { ...userVotes, [reviewId]: vote }; saveUserVotes(nv); setProduct((p) => p ? { ...p, reviews: p.reviews.map((r) => (r.review_id === reviewId || r.id === reviewId) ? { ...r, helpful_count: vote === "helpful" ? (r.helpful_count || 0) + 1 : r.helpful_count, unhelpful_count: vote === "unhelpful" ? (r.unhelpful_count || 0) + 1 : r.unhelpful_count } : r) } : null); }
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "my")) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const saved = JSON.parse(localStorage.getItem(`savedProducts_${user.uid}`) || "[]");
    setIsSaved(saved.includes(productId));
  }, [productId, user?.uid]);

  const toggleLanguage = () => { const nl = language === "en" ? "my" : "en"; setLanguage(nl); localStorage.setItem("preferred_language", nl); };

  const toggleSave = () => {
    if (!checkAuth(user, "save products")) return;
    const uid = user?.uid; if (!uid) return;
    const saved = JSON.parse(localStorage.getItem(`savedProducts_${uid}`) || "[]");
    if (isSaved) { localStorage.setItem(`savedProducts_${uid}`, JSON.stringify(saved.filter((id: string) => id !== productId))); setIsSaved(false); }
    else { saved.push(productId); localStorage.setItem(`savedProducts_${uid}`, JSON.stringify(saved)); setIsSaved(true); }
  };

  const getRelativeTime = (dateString: string, lang: Language): string => {
    const date = new Date(dateString); const now = new Date();
    const diffMs = now.getTime() - date.getTime(); const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60); const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24); const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30); const diffYears = Math.floor(diffDays / 365);
    if (lang === "my") { if (diffSecs < 60) return "လွန်ခဲ့သော စက္ကန့်အနည်းငယ်"; if (diffMins < 60) return `လွန်ခဲ့သော ${diffMins} မိနစ်`; if (diffHours < 24) return `လွန်ခဲ့သော ${diffHours} နာရီ`; if (diffDays < 7) return `လွန်ခဲ့သော ${diffDays} ရက်`; if (diffWeeks < 4) return `လွန်ခဲ့သော ${diffWeeks} ပတ်`; if (diffMonths < 12) return `လွန်ခဲ့သော ${diffMonths} လ`; return `လွန်ခဲ့သော ${diffYears} နှစ်`; }
    if (diffSecs < 60) return "Just now"; if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`; if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`; if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`; if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`; if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`; return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  };

  const formatReviewDate = (dateString?: string) => { if (!dateString) return "Just now"; const d = new Date(dateString); return isNaN(d.getTime()) ? "Just now" : d.toLocaleDateString(); };

  const fetchProduct = useCallback(async () => {
    if (!productId) return; setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) { if (res.status === 404) throw new Error("Product not found"); throw new Error("Failed to fetch product"); }
      const data = await res.json(); setProduct(data.data);
      if (data.data?.shop?.id) fetchRelated(data.data.shop.id, productId);
    } catch (err) { setError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setLoading(false); }
  }, [productId]);

  const fetchRelated = async (shopId: string, currentId: string) => {
    setLoadingRelated(true);
    try { const res = await fetch(`/api/shops/${shopId}/products`); if (res.ok) { const data = await res.json(); const f = (data.data?.products || []).filter((p: Product) => String(p.id || (p as any).product_id) !== String(currentId)).slice(0, 10); setRelatedProducts(f); } }
    catch { /* silent */ } finally { setLoadingRelated(false); }
  };

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleReview = async () => {
    setReviewError(null); if (reviewRating === 0) { setReviewError(t.selectRating); return; }
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewer_name: reviewerName, rating: reviewRating, review_text: reviewText }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || t.reviewError); }
      await fetchProduct(); setShowReviewModal(false); setReviewRating(5); setReviewText("");
    } catch (err) { setReviewError(err instanceof Error ? err.message : t.reviewError); }
    finally { setReviewLoading(false); }
  };

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextLightbox = () => { if (product?.image_urls) setLightboxIndex((p) => p === product.image_urls.length - 1 ? 0 : p + 1); };
  const prevLightbox = () => { if (product?.image_urls) setLightboxIndex((p) => p === 0 ? product.image_urls.length - 1 : p - 1); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && lightboxOpen) closeLightbox(); else if (e.key === "ArrowLeft" && lightboxOpen) prevLightbox(); else if (e.key === "ArrowRight" && lightboxOpen) nextLightbox(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, product?.image_urls]);

  // ===================== LOADING SKELETON =====================
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Header skeleton */}
        <div className="sticky top-0 z-40" style={{ backdropFilter: "blur(20px)", background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl shimmer" />
            <div className="h-5 rounded-lg shimmer" style={{ width: 200 }} />
            <div className="ml-auto w-16 h-9 rounded-full shimmer" />
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image skeleton */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-16 h-16 rounded-lg shimmer" />
                <div className="w-16 h-16 rounded-lg shimmer" />
                <div className="w-16 h-16 rounded-lg shimmer" />
              </div>
              <div className="flex-1 aspect-square rounded-2xl shimmer" />
            </div>
            {/* Info skeleton */}
            <div className="space-y-4">
              <div className="h-8 rounded-lg shimmer" style={{ width: "80%" }} />
              <div className="h-5 rounded-lg shimmer" style={{ width: 120 }} />
              <div className="h-20 rounded-xl shimmer" />
              <div className="h-12 rounded-xl shimmer" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 rounded-xl shimmer" />
                <div className="h-12 rounded-xl shimmer" />
              </div>
              <div className="h-24 rounded-xl shimmer" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ===================== ERROR =====================
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--error)" }} />
          <p className="mb-4" style={{ color: "var(--error)" }}>{error || t.productNotFound}</p>
          <button onClick={fetchProduct} className="btn-gradient flex items-center gap-2 mx-auto"><RefreshCw className="h-4 w-4" /> {t.tryAgain}</button>
          <button onClick={() => router.back()} className="block mt-4 text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>← {t.back}</button>
        </motion.div>
      </div>
    );
  }

  const displayName = language === "my" && product.name_mm ? product.name_mm : product.name;
  const shopName = language === "my" && product.shop.name_mm ? product.shop.name_mm : product.shop.name;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Glass Header */}
      <motion.header initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className="sticky top-0 z-40" style={{ backdropFilter: "blur(20px) saturate(1.2)", WebkitBackdropFilter: "blur(20px) saturate(1.2)", background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn-ghost w-9 h-9 flex items-center justify-center rounded-xl"><ChevronLeft className="h-5 w-5" style={{ color: "var(--fg)" }} /></button>
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md" style={{ color: "var(--fg)" }}>{displayName}</h1>
          </div>
          <button onClick={toggleLanguage} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--fg)" }}>{language === "en" ? "EN" : "MY"}</button>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left - Images */}
          <motion.div {...fadeInUp} className="flex gap-4">
            {/* Thumbnails */}
            {product.image_urls.length > 0 && (
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                {product.image_urls.map((url, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className="w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0"
                    style={{ borderColor: idx === currentImageIndex ? "var(--accent)" : "var(--border)" }}>
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" style={{ background: "var(--bg-elevated)" }} />
                  </button>
                ))}
              </div>
            )}
            {/* Main Image - Swipeable */}
            <SwipeableImage
              images={product.image_urls}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              alt={displayName}
              onClick={() => openLightbox(currentImageIndex)}
              timeAgo={getRelativeTime(product.created_at, language)}
              onLightbox={() => openLightbox(currentImageIndex)}
            />
          </motion.div>

          {/* Right - Info */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="space-y-5">
            {/* Title + Share */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{displayName}</h1>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="btn-ghost w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0">
                <Share2 className="h-5 w-5" style={{ color: "var(--fg-muted)" }} />
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold" style={{ color: "var(--fg)" }}>{product.average_rating.toFixed(1)}</span>
              <span style={{ color: "var(--fg-muted)" }}>({product.reviews_count} {t.rating})</span>
            </div>

            {/* Price Card */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="flex items-baseline gap-1">
                <span className="text-sm" style={{ color: "var(--fg-muted)" }}>{product.currency}</span>
                <span className="text-3xl font-bold" style={{ color: "var(--fg)" }}>{product.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
                <CheckCircle className="h-4 w-4" /> <span>In-store pickup</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
                <CheckCircle className="h-4 w-4" /> <span>Available now</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href={`/map?shop=${product.shop.id}`} className="btn-gradient w-full flex items-center justify-center gap-2 py-3.5">
                <MapPin className="h-5 w-5" /> Get Directions
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={toggleSave}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all border-2"
                  style={isSaved ? { borderColor: "var(--accent)", background: "rgba(99,102,241,0.08)", color: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--fg)" }}>
                  <Heart className={`h-5 w-5 ${isSaved ? "fill-[var(--accent)]" : ""}`} /> {isSaved ? "Saved" : "Save"}
                </button>
                <a href={product.shop.phone ? `tel:${product.shop.phone}` : "#"} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all border-2" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                  <Phone className="h-5 w-5" /> Call Shop
                </a>
              </div>
            </div>

            {/* Shop Card */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-3">
                {product.shop.logo_url ? (
                  <img src={product.shop.logo_url} alt={shopName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                    <Store className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: "var(--fg)" }}>{shopName}</p>
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{product.shop.address || "Yangon"}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span style={{ color: "var(--fg)" }}>{product.shop.rating.toFixed(1)}</span>
                    <span style={{ color: "var(--fg-muted)" }}>(Rating)</span>
                  </div>
                  <Link href={`/map?shop=${product.shop.id}`} className="text-sm font-medium hover:underline flex items-center gap-1 mt-1" style={{ color: "var(--accent)" }}>
                    <MapPin className="h-3.5 w-3.5" /> Get directions
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--fg)" }}>About this Item</h3>
          <p style={{ color: "var(--fg-muted)", whiteSpace: "pre-wrap" }}>{product.description || (language === "en" ? "No description available" : "အကြောင်းအရာမရရှိပါ")}</p>
        </motion.div>

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>{t.reviews} ({product.reviews_count})</h3>
            <button onClick={() => setShowReviewModal(true)} className="btn-gradient text-sm">{t.writeReview}</button>
          </div>
          {product.reviews.length === 0 ? (
            <div className="text-center py-8 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--fg-muted)" }}>{t.noReviews}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(showAllReviews ? product.reviews : product.reviews.slice(0, INITIAL_REVIEWS_COUNT)).map((review, i) => {
                  const userVote = userVotes[review.review_id || review.id];
                  return (
                    <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm" style={{ color: "var(--fg)" }}>{review.reviewer_name}</p>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm mb-2" style={{ color: "var(--fg-muted)" }}>{review.review_text}</p>
                      <p className="text-xs" style={{ color: "var(--fg-dim)" }}>{formatReviewDate(review.created_at)}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--fg-dim)" }}>{language === "en" ? "Helpful?" : "အကူအညီဖြစ်ပါသလား?"}</span>
                        <button onClick={() => handleVote(review.review_id || review.id, "helpful")} className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all" style={{ background: userVote === "helpful" ? "var(--accent)" : "var(--bg-hover)", color: userVote === "helpful" ? "white" : "var(--fg-muted)" }}>{language === "en" ? "Yes" : "ဟုတ်တယ်"}</button>
                        <button onClick={() => handleVote(review.review_id || review.id, "unhelpful")} className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all" style={{ background: userVote === "unhelpful" ? "var(--error)" : "var(--bg-hover)", color: userVote === "unhelpful" ? "white" : "var(--fg-muted)" }}>{language === "en" ? "No" : "မဟုတ်ဘူး"}</button>
                      </div>
                      {(review.helpful_count || 0) > 0 && <p className="text-xs mt-2" style={{ color: "var(--fg-dim)" }}>{review.helpful_count} {language === "en" ? "found this helpful" : "ဦး အကူအညီဖြစ်သည်ဟု ထင်မြင်သည်"}</p>}
                    </motion.div>
                  );
                })}
              </div>
              {product.reviews.length > INITIAL_REVIEWS_COUNT && (
                <div className="text-center mt-4">
                  <button onClick={() => setShowAllReviews(!showAllReviews)} className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>{showAllReviews ? "Show less" : `See all ${product.reviews.length} reviews`}</button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Related Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>More from this shop</h3>
            <Link href={`/shop/${product.shop.id}`} className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: "var(--accent)" }}>See all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {loadingRelated ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} /></div>
          ) : relatedProducts.length > 0 ? (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((rp, i) => (
                <motion.div key={`${rp.id || rp.product_id}-${i}`} variants={staggerItem}>
                  <Link href={`/product/${rp.id || rp.product_id}`} className="group block rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="aspect-square" style={{ background: "var(--bg)" }}>
                      {rp.image_urls?.[0] ? <img src={rp.image_urls[0]} alt={language === "en" ? rp.name : (rp.name_mm || rp.name)} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm line-clamp-1" style={{ color: "var(--fg)" }}>{language === "en" ? rp.name : (rp.name_mm || rp.name)}</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: "var(--accent)" }}>{rp.price.toLocaleString()} {rp.currency}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-8 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--fg-muted)" }}>No other products from this shop</p>
              <Link href={`/shop/${product.shop.id}`} className="inline-block mt-2 text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>View {shopName}</Link>
            </div>
          )}
        </motion.div>
      </main>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowReviewModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: "var(--fg)" }}>{t.writeAReview}</h3>
                <button onClick={() => setShowReviewModal(false)} className="btn-ghost w-9 h-9 flex items-center justify-center rounded-full"><X className="h-5 w-5" style={{ color: "var(--fg-muted)" }} /></button>
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
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} maxLength={500} className="input-field resize-none" placeholder="Share your experience..." />
                <p className="text-xs mt-1 text-right" style={{ color: "var(--fg-dim)" }}>{reviewText.length}/500</p>
              </div>
              {reviewError && <div className="alert alert-error mb-4 text-sm"><AlertCircle className="w-4 h-4" /> {reviewError}</div>}
              <button onClick={handleReview} disabled={reviewLoading} className="btn-gradient w-full">{reviewLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</span> : t.submitReview}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && product?.image_urls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.95)" }} onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 rounded-full transition-colors z-50" style={{ background: "rgba(255,255,255,0.1)" }}><X className="h-6 w-6 text-white" /></button>
            {product.image_urls.length > 1 && <button onClick={(e) => { e.stopPropagation(); prevLightbox(); }} className="absolute left-4 p-3 rounded-full transition-colors" style={{ background: "rgba(255,255,255,0.1)" }}><ChevronLeft className="h-8 w-8 text-white" /></button>}
            <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <motion.img key={lightboxIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} src={product.image_urls[lightboxIndex]} alt={displayName} className="max-w-full max-h-[85vh] object-contain" />
            </div>
            {product.image_urls.length > 1 && <button onClick={(e) => { e.stopPropagation(); nextLightbox(); }} className="absolute right-4 p-3 rounded-full transition-colors" style={{ background: "rgba(255,255,255,0.1)" }}><ChevronRight className="h-8 w-8 text-white" /></button>}
            {product.image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-xl" style={{ background: "rgba(0,0,0,0.5)" }}>
                {product.image_urls.map((url, idx) => (
                  <button key={idx} onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }} className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all" style={{ borderColor: idx === lightboxIndex ? "var(--accent)" : "transparent" }}>
                    <img src={url} alt="" className="w-full h-full object-contain" style={{ background: "#1a1a2e" }} />
                  </button>
                ))}
              </div>
            )}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm" style={{ background: "rgba(255,255,255,0.1)" }}>{lightboxIndex + 1} / {product.image_urls.length}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthGuardModal />
    </div>
  );
}

// ============================================================
// SWIPEABLE IMAGE COMPONENT
// ============================================================
function SwipeableImage({ images, currentIndex, onIndexChange, alt, onClick, timeAgo, onLightbox }: {
  images: string[]; currentIndex: number; onIndexChange: (i: number) => void;
  alt: string; onClick: () => void; timeAgo: string; onLightbox: () => void;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const SWIPE_THRESHOLD = 80;

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (images.length <= 1) return;

    // Swipe left (next image)
    if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      if (currentIndex < images.length - 1) {
        controls.start({ x: 0, transition: { duration: 0.2 } });
        onIndexChange(currentIndex + 1);
      } else {
        // Bounce back at end
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
      }
    }
    // Swipe right (prev image)
    else if (offset > SWIPE_THRESHOLD || velocity > 500) {
      if (currentIndex > 0) {
        controls.start({ x: 0, transition: { duration: 0.2 } });
        onIndexChange(currentIndex - 1);
      } else {
        // Bounce back at start
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
      }
    } else {
      // Snap back if not enough swipe
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  return (
    <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", touchAction: "pan-y" }}>
      {/* Images stack */}
      <div className="relative w-full h-full">
        {images.map((url, idx) => {
          const isActive = idx === currentIndex;
          const isPrev = idx === currentIndex - 1;
          const isNext = idx === currentIndex + 1;
          if (!isActive && !isPrev && !isNext) return null;

          return (
            <motion.div
              key={idx}
              className="absolute inset-0"
              initial={false}
              animate={{
                x: isActive ? 0 : isPrev ? "-100%" : isNext ? "100%" : 0,
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1 : 0.92,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ zIndex: isActive ? 2 : 1 }}
            >
              <motion.img
                src={url}
                alt={`${alt} ${idx + 1}`}
                className="w-full h-full object-contain p-4"
                style={{ cursor: "grab" }}
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                onClick={onClick}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Time badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}>
          <Clock className="h-3 w-3" /> {timeAgo}
        </span>
      </div>

      {/* Fullscreen */}
      <button onClick={onLightbox} className="absolute top-3 right-3 p-2 rounded-xl transition-all z-10" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <Maximize2 className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
      </button>

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, idx) => (
            <button key={idx} onClick={() => onIndexChange(idx)} className="w-2 h-2 rounded-full transition-all" style={{ background: idx === currentIndex ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>
      )}

      {/* Swipe hint on mobile */}
      {images.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 sm:hidden">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.4)", color: "white" }}>Swipe to browse</span>
        </div>
      )}
    </div>
  );
}
