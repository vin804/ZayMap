"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  ChevronLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Star,
  Store,
  Calendar,
  Package,
  X,
  Clock,
  CreditCard,
  PlayCircle,
  Check,
  ChevronRight,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw
} from "lucide-react";

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  logo_url?: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  category: string;
}

interface Product {
  product_id: string;
  shop_id: string;
  product_name: string;
  product_name_mm?: string;
  description?: string;
  image_urls: string[];
  price: number;
  booking_fee: number;
  currency: string;
  upload_timestamp: string;
  freshness_badge: "green" | "orange" | "red";
}

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕",
  electronics: "📱",
  food: "🍜",
  cosmetics: "💄",
  second_hand: "♻️",
  other: "🏪",
};

const freshnessLabels = {
  en: { green: "Fresh", orange: "Recent", red: "Old" },
  my: { green: "သစ်သစ်လှလှ", orange: "မကြာသေးခင်", red: "အဟောင်း" },
};

const freshnessColors = {
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const productId = params.productId as string;
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "my">("en");
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pay" | "watch_ad">("pay");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as "en" | "my";
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
  }, []);

  const fetchData = async () => {
    if (!shopId || !productId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch shop details
      const shopRes = await fetch(`/api/shops/${shopId}`);
      if (!shopRes.ok) {
        throw new Error("Shop not found");
      }
      const shopData = await shopRes.json();
      setShop(shopData.data);

      // Fetch all products from this shop
      const productRes = await fetch(`/api/shops/${shopId}/products`);
      if (!productRes.ok) {
        throw new Error("Failed to fetch products");
      }
      const productsData = await productRes.json();
      const allProducts = productsData.data?.products || [];
      
      const foundProduct = allProducts.find((p: Product) => p.product_id === productId);
      
      if (!foundProduct) {
        throw new Error("Product not found");
      }
      setProduct(foundProduct);
      
      // Get similar products (other products from same shop, excluding current)
      const others = allProducts
        .filter((p: Product) => p.product_id !== productId)
        .slice(0, 6);
      setSimilarProducts(others);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shopId, productId]);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "my" : "en";
    setLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
  };

  // Handle booking creation
  const handleBooking = async () => {
    if (!pickupTime) {
      setBookingError(language === "en" ? "Please select a pickup time" : "ကောက်ယူရန် အချိန် ရွေးချယ်ပါ");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          pickup_time: new Date(pickupTime).toISOString(),
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setBookingSuccess(true);
      
      // Redirect to booking confirmation after 2 seconds
      setTimeout(() => {
        router.push(`/booking/${data.data.id}`);
      }, 2000);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea]" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || "Product not found"}</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors mx-auto"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = language === "my" && product.product_name_mm 
    ? product.product_name_mm 
    : product.product_name;
  const shopName = language === "my" && shop.name_mm ? shop.name_mm : shop.name;
  const freshness = freshnessColors[product.freshness_badge];
  
  // Get product features for "About this item" section
  const productFeatures = product.description 
    ? product.description.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5)
    : [];

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
              <h1 className="text-lg font-semibold text-black line-clamp-1 max-w-[200px] sm:max-w-md">
                {displayName}
              </h1>
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
        {/* Main Product Section - Amazon Style 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Left Column - Image Gallery (2 cols) */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {product.image_urls?.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 lg:w-full lg:h-20 rounded-lg border-2 overflow-hidden transition-all ${
                    selectedImageIndex === index 
                      ? "border-[#667eea] ring-2 ring-[#667eea]/20" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${displayName} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {(!product.image_urls || product.image_urls.length === 0) && (
                <div className="w-16 h-16 lg:w-full lg:h-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Main Image (5 cols) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative group">
              {product.image_urls?.[selectedImageIndex] ? (
                <img
                  src={product.image_urls[selectedImageIndex]}
                  alt={displayName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-32 w-32 text-gray-300" />
                </div>
              )}
              
              {/* Freshness Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${freshness.bg} ${freshness.text} flex items-center gap-1.5 shadow-sm`}>
                  <span className={`w-2 h-2 rounded-full ${freshness.dot}`} />
                  {freshnessLabels[language][product.freshness_badge]}
                </span>
              </div>

              {/* Hover zoom hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                {language === "en" ? "Click image to view full size" : "ပုံအပြည့်ကြည့်ရန် နှိပ်ပါ"}
              </div>
            </div>
          </div>

          {/* Right Column - Product Info & Buy Box (5 cols) */}
          <div className="lg:col-span-5 order-3">
            <div className="space-y-4">
              {/* Title */}
              <h1 className="text-2xl font-semibold text-black leading-tight">
                {displayName}
              </h1>

              {/* Shop Info Badge */}
              <Link 
                href={`/shop/${shop.shop_id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-black hover:bg-gray-200 transition-colors"
              >
                <Store className="h-4 w-4" />
                {shopName}
                <ChevronRight className="h-4 w-4" />
              </Link>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#667eea] hover:underline cursor-pointer">
                  {shop.rating?.toFixed(1)} ({shop.review_count} {language === "en" ? "ratings" : "အဆင့်သတ်မှတ်ချက်များ"})
                </span>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Price Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm text-black">{product.currency}</span>
                  <span className="text-4xl font-bold text-black">
                    {product.price.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-black mb-3">
                  + {product.booking_fee.toLocaleString()} {product.currency} {language === "en" ? "booking fee" : "ဘွတ်ကင်အခကြေး"}
                </div>
                
                {/* Features */}
                <div className="flex items-center gap-4 text-sm text-black">
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>{language === "en" ? "In-store pickup" : "ဆိုင်ကောက်ယူ"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>{language === "en" ? "Secure booking" : "လုံခြုံမှု"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/auth");
                      return;
                    }
                    setShowBookingModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="h-5 w-5" />
                  {language === "en" ? "Book Now" : "ဘွတ်ကင်လုပ်ရန်"}
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 border-2 border-gray-300 rounded-xl font-medium text-black hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                    <Heart className="h-5 w-5" />
                    {language === "en" ? "Save" : "သိမ်းဆည်းရန်"}
                  </button>
                  <Link
                    href={`tel:${shop.phone}`}
                    className="py-3 border-2 border-gray-300 rounded-xl font-medium text-black hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    {language === "en" ? "Call Shop" : "ဆိုင်ခေါ်ရန်"}
                  </Link>
                </div>
              </div>

              {/* Shop Info Card */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0">
                    {shop.logo_url ? (
                      <img src={shop.logo_url} alt={shopName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Store className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">{shopName}</p>
                    <p className="text-sm text-black">{shop.address}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-black">
                      <MapPin className="h-3.5 w-3.5" />
                      <Link 
                        href={`/map?shop=${shop.shop_id}&lat=${shop.latitude}&lng=${shop.longitude}&name=${encodeURIComponent(shop.name)}`}
                        className="text-[#667eea] hover:underline"
                      >
                        {language === "en" ? "Get directions" : "လမ်းညွှန်ရန်"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About This Item Section */}
        {productFeatures.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-xl font-semibold text-black mb-4">
              {language === "en" ? "About this item" : "ဒီပစ္စည်းအကြောင်း"}
            </h2>
            <ul className="space-y-2">
              {productFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#667eea] mt-1.5">•</span>
                  <span className="text-black">{feature.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black">
                {language === "en" ? "More from this shop" : "ဆိုင်ထပ်ပစ္စည်းများ"}
              </h2>
              <Link 
                href={`/shop/${shop.shop_id}`}
                className="text-[#667eea] hover:underline text-sm font-medium flex items-center gap-1"
              >
                {language === "en" ? "See all" : "အားလုံးကြည့်"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            {/* Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {similarProducts.map((item) => (
                <Link
                  key={item.product_id}
                  href={`/shop/${shop.shop_id}/products/${item.product_id}`}
                  className="flex-shrink-0 w-48 group"
                >
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
                    {item.image_urls?.[0] ? (
                      <img
                        src={item.image_urls[0]}
                        alt={item.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-black line-clamp-2 group-hover:text-[#667eea] transition-colors">
                    {item.product_name}
                  </h3>
                  <p className="text-lg font-bold text-[#667eea] mt-1">
                    {item.price.toLocaleString()} {item.currency}
                  </p>
                  <p className="text-xs text-black">
                    + {item.booking_fee.toLocaleString()} {item.currency} {language === "en" ? "booking fee" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  {language === "en" ? "Booking Confirmed!" : "ဘွတ်ကင် အောင်မြင်ပါသည်!"}
                </h3>
                <p className="text-black">
                  {language === "en" ? "Redirecting to your booking..." : "ဘွတ်ကင်သို့ ပြန်ညွှန်နေသည်..."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-black">
                    {language === "en" ? "Book Product" : "ပစ္စည်းဘွတ်ကင်ရန်"}
                  </h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {bookingError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {bookingError}
                  </div>
                )}

                {/* Pickup Time */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {language === "en" ? "Pickup Time" : "ကောက်ယူရန် အချိန်"}
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#667eea] text-black"
                  />
                  <p className="text-xs text-black mt-1">
                    {language === "en" ? "Select when you want to pick up the product" : "ပစ္စည်းကောက်ယူလိုသည့် အချိန်ကို ရွေးပါ"}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-2">
                    {language === "en" ? "Payment Method" : "ငွေပေးချေခြင်း နည်းလမ်း"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("pay")}
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === "pay"
                          ? "border-[#667eea] bg-[#667eea]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="h-6 w-6 text-[#667eea]" />
                      <span className="text-sm font-medium text-black">
                        {language === "en" ? "Pay" : "ငွေပေး"}
                      </span>
                      <span className="text-xs text-black">
                        {product?.booking_fee.toLocaleString()} {product?.currency}
                      </span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("watch_ad")}
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === "watch_ad"
                          ? "border-[#667eea] bg-[#667eea]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <PlayCircle className="h-6 w-6 text-[#667eea]" />
                      <span className="text-sm font-medium text-black">
                        {language === "en" ? "Watch Ad" : "ကြော်ငြာကြည့်"}
                      </span>
                      <span className="text-xs text-black">
                        {language === "en" ? "Free" : "အခမဲ့"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <h4 className="font-medium text-black mb-2">
                    {language === "en" ? "Booking Summary" : "ဘွတ်ကင်အကျဉ်းချုပ်"}
                  </h4>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-black">{displayName}</span>
                    <span className="font-medium text-black">{product?.price.toLocaleString()} {product?.currency}</span>
                  </div>
                  {paymentMethod === "pay" && (
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-black">{language === "en" ? "Booking Fee" : "ဘွတ်ကင်အခကြေး"}</span>
                      <span className="font-medium text-black">{product?.booking_fee.toLocaleString()} {product?.currency}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                    <span className="font-medium text-black">{language === "en" ? "Total" : "စုစုပေါင်း"}</span>
                    <span className="font-bold text-[#667eea]">
                      {paymentMethod === "pay" 
                        ? `${((product?.price || 0) + (product?.booking_fee || 0)).toLocaleString()} ${product?.currency}`
                        : language === "en" ? "Free" : "အခမဲ့"
                      }
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-black hover:bg-gray-50 transition-colors"
                  >
                    {language === "en" ? "Cancel" : "မလုပ်တော့ပါ"}
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || !pickupTime}
                    className="flex-1 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === "en" ? "Processing..." : "လုပ်ဆောင်နေသည်..."}
                      </>
                    ) : (
                      language === "en" ? "Confirm Booking" : "ဘွတ်ကင်အတည်ပြုရန်"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
