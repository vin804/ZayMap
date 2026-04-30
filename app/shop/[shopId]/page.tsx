"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Package
} from "lucide-react";

// Freshness labels
const freshnessLabels = {
  en: { green: "Fresh", orange: "Recent", red: "Old" },
  my: { green: "သစ်သစ်လှလှ", orange: "မကြာသေးခင်", red: "အဟောင်း" },
};

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  description?: string;
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

interface Review {
  review_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  review_type: string;
  created_at: string;
}

type Language = "en" | "my";

const TRANSLATIONS = {
  en: {
    back: "Back",
    products: "Products",
    reviews: "Reviews",
    bookNow: "Book Now",
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
    secureBooking: "Secure Booking",
    pickup: "In-store Pickup",
    moreFromShop: "More from this shop",
    soldBy: "Sold by",
  },
  my: {
    back: "နောက်သို့",
    products: "ပစ္စည်းများ",
    reviews: "သုံးသပ်ချက်များ",
    bookNow: "ဘွတ်ကောင့်",
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
    secureBooking: "လုံခြုံမှု",
    pickup: "ဆိုင်ကောက်ယူ",
    moreFromShop: "ဆိုင်ထပ်ပစ္စည်းများ",
    soldBy: "ရောင်းသူ",
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
  const [activeTab, setActiveTab] = useState<"about" | "specs" | "shipping">("about");

  const t = TRANSLATIONS[language];

  // Load language preference from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
  }, []);

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
      const shopData = await shopRes.json();
      setShop(shopData.data);

      // Fetch products
      const productsRes = await fetch(`/api/shops/${shopId}/products?sort=freshness&limit=50`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea]" />
          <p className="mt-4 text-gray-500">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-white">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
        {/* Shop Header Section */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
          {/* Shop Logo */}
          <div className="flex-shrink-0">
            {shop.logo_url ? (
              <img 
                src={shop.logo_url} 
                alt={shop.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-3xl sm:text-4xl">
                {CATEGORY_ICONS[shop.category] || "🏪"}
              </div>
            )}
          </div>
          
          {/* Shop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm text-black mb-1">
                  {CATEGORY_LABELS[language][shop.category] || shop.category}
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-black mb-1">{displayName}</h2>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-black">{shop.rating.toFixed(1)}</span>
                  <span className="text-sm text-[#667eea] hover:underline cursor-pointer">
                    ({shop.review_count} {t.reviews.toLowerCase()})
                  </span>
                </div>
                
                {/* Response Time & Delivery */}
                <div className="flex items-center gap-4 text-sm text-black">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{t.respondsIn} &lt;{shop.response_time_hours} {t.hours}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    <span>{shop.delivery_available ? t.deliveryAvailable : t.pickup}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-black hover:border-gray-400 transition-colors flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.followShop}</span>
                </button>
                <a 
                  href={`tel:${shop.phone}`}
                  className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.contactShop}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid - Amazon Style */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-black">
              {products.length} {language === "en" ? "products" : "ပစ္စည်းများ"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-black">
              <span>{language === "en" ? "Sort by:" : "စီစဉ်မည်:"}</span>
              <select className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-black">
                <option>{language === "en" ? "Featured" : "အထူး"}</option>
                <option>{language === "en" ? "Price: Low to High" : "စျေးနှုန်း - နိမ့်မှ မြင့်"}</option>
                <option>{language === "en" ? "Price: High to Low" : "စျေးနှုန်း - မြင့်မှ နိမ့်"}</option>
                <option>{language === "en" ? "Freshness" : "သစ်သစ်မှု"}</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <Package className="h-16 w-16 text-black mx-auto mb-4" />
              <p className="text-black text-lg">{t.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <AmazonProductCard
                  key={product.product_id}
                  product={product}
                  shop={shop}
                  language={language}
                  t={t}
                  onClick={() => router.push(`/shop/${shop.shop_id}/products/${product.product_id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Shop Info Tabs */}
        <div className="border-t border-gray-200 pt-6 mb-8">
          {/* Tab Headers */}
          <div className="flex gap-6 border-b border-gray-200 mb-6">
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
                    : "text-black hover:text-black"
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
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-black">{language === "en" ? "Category" : "အမျိုးအစား"}</span>
                  <span className="font-medium text-black">{CATEGORY_LABELS[language][shop.category] || shop.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-black">{language === "en" ? "Response Time" : "ပြန်ကြားချိန်"}</span>
                  <span className="font-medium text-black">&lt;{shop.response_time_hours} {t.hours}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-black">{language === "en" ? "Delivery" : "ပို့ဆောင်ရေး"}</span>
                  <span className="font-medium text-black">{shop.delivery_available ? t.deliveryAvailable : t.deliveryNotAvailable}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-black">{language === "en" ? "Phone" : "ဖုန်း"}</span>
                  <span className="font-medium text-black">{shop.phone}</span>
                </div>
              </div>
            )}
            
            {activeTab === "shipping" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Truck className="h-5 w-5 text-[#667eea] mt-0.5" />
                  <div>
                    <p className="font-medium text-black">{shop.delivery_available ? t.deliveryAvailable : t.pickup}</p>
                    <p className="text-sm text-black">{shop.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-[#667eea] mt-0.5" />
                  <div>
                    <p className="font-medium text-black">{language === "en" ? "Shop Location" : "ဆိုင်တည်နေရာ"}</p>
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
        {reviews.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-xl font-semibold text-black mb-6">{t.customerReviews}</h2>
            
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
                  <AmazonReviewCard key={review.review_id} review={review} language={language} />
                ))}
                
                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full py-3 border border-gray-300 rounded-lg font-medium text-black hover:bg-gray-50 transition-colors"
                  >
                    {showAllReviews ? "Show Less" : t.viewAllReviews}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Amazon Product Card Component - for grid view
function AmazonProductCard({
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
    green: { bg: "bg-green-100", text: "text-green-700" },
    orange: { bg: "bg-orange-100", text: "text-orange-700" },
    red: { bg: "bg-red-100", text: "text-red-700" },
  };

  const freshness = freshnessColors[product.freshness_badge];
  const displayName = language === "my" && product.product_name_mm 
    ? product.product_name_mm 
    : product.product_name;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-white rounded-lg hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-300" />
          </div>
        )}
        
        {/* Freshness Badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-medium px-2 py-1 rounded ${freshness.bg} ${freshness.text}`}>
            {freshnessLabels[language][product.freshness_badge]}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-black line-clamp-2 mb-1 group-hover:text-[#667eea] transition-colors min-h-[2.5rem]">
          {displayName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${star <= Math.round(shop.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-xs text-black">({shop.review_count})</span>
        </div>

        {/* Price */}
        <div className="flex flex-col">
          <span className="text-lg font-bold text-black">
            {product.price.toLocaleString()} {product.currency}
          </span>
          <span className="text-xs text-black">
            + {product.booking_fee.toLocaleString()} {product.currency} fee
          </span>
        </div>

        {/* Delivery/Pickup badge */}
        <div className="mt-2 flex items-center gap-1 text-xs text-black">
          <Truck className="h-3 w-3" />
          <span>{shop.delivery_available ? t.deliveryAvailable : t.pickup}</span>
        </div>
      </div>
    </button>
  );
}

// Shop Description Editor Component
function ShopDescriptionEditor({ shop, language }: { shop: Shop; language: Language }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(shop.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check if current user is the shop owner
  useEffect(() => {
    const checkOwner = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          // Check if user is owner - adjust based on your auth structure
          setIsOwner(data.user?.id === shop.owner_id || data.user?.role === 'admin');
        }
      } catch {
        setIsOwner(false);
      }
    };
    checkOwner();
  }, [shop.owner_id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/shops/${shop.shop_id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description,
          name: shop.name,
          phone: shop.phone,
          address: shop.address,
          category: shop.category,
          delivery_available: shop.delivery_available
        }),
      });
      if (res.ok) {
        shop.description = description;
        setIsEditing(false);
      } else {
        const error = await res.json();
        console.error('Failed to save description:', error);
        alert(language === "en" ? "Failed to save. Please try again." : "သိမ်းဆည်းမရပါ။ ထပ်စမ်းကြည့်ပါ။");
      }
    } catch (err) {
      console.error('Failed to save description:', err);
      alert(language === "en" ? "Failed to save. Please try again." : "သိမ်းဆည်းမရပါ။ ထပ်စမ်းကြည့်ပါ။");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && isOwner) {
    return (
      <div className="space-y-3">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={language === "en" ? "Enter shop description..." : "ဆိုင်အကြောင်းရေးပါ..."}
          className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-y"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors disabled:opacity-50"
          >
            {isSaving ? (language === "en" ? "Saving..." : "သိမ်းဆည်းနေသည်...") : (language === "en" ? "Save" : "သိမ်းဆည်းပါ")}
          </button>
          <button
            onClick={() => {
              setDescription(shop.description || "");
              setIsEditing(false);
            }}
            className="px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
          >
            {language === "en" ? "Cancel" : "ပယ်ဖျက်ပါ"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {shop.description ? (
        <p className="text-black leading-relaxed">{shop.description}</p>
      ) : (
        <p className="text-black">
          {language === "en" ? "Welcome to our shop! Browse our products above." : "ကျွန်ုပ်တို့ဆိုင်မှ ကြိုဆိုပါတယ်! ပစ္စည်းများကို အပေါ်တွင် ကြည့်ရှုပါ။"}
        </p>
      )}
      {isOwner && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-3 text-sm text-[#667eea] hover:underline flex items-center gap-1"
        >
          <Globe className="h-4 w-4" />
          {language === "en" ? "Edit description" : "အကြောင်းပြင်ဆင်ပါ"}
        </button>
      )}
    </div>
  );
}

// Amazon-style Review Card Component
function AmazonReviewCard({ 
  review, 
  language 
}: { 
  review: Review; 
  language: Language;
}) {
  const reviewTypeLabels = {
    en: {
      responsiveness: "Responsiveness",
      delivery_quality: "Delivery",
      product_review: "Product",
    },
    my: {
      responsiveness: "တုန့်ပြန်မှု",
      delivery_quality: "ပို့ဆောင်ရေး",
      product_review: "ပစ္စည်း",
    },
  };

  const t = {
    verifiedPurchase: language === "en" ? "Verified Purchase" : "အတည်ပြုထားသည့် ဝယ်ယူမှု",
    helpful: language === "en" ? "Helpful" : "ကူညီသည်",
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      {/* Reviewer Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-semibold">
            {review.reviewer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-black">{review.reviewer_name}</p>
            <span className="text-xs text-black">
              {reviewTypeLabels[language][review.review_type as keyof typeof reviewTypeLabels["en"]]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-black">{review.rating}</span>
        </div>
      </div>

      {/* Verified Badge */}
      <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
        <Shield className="h-3.5 w-3.5" />
        <span>{t.verifiedPurchase}</span>
      </div>

      {/* Review Text */}
      <p className="text-sm text-black leading-relaxed mb-3">{review.comment}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-black">
          {new Date(review.created_at).toLocaleDateString()}
        </p>
        <button className="flex items-center gap-1.5 text-sm text-black hover:text-black transition-colors">
          <ThumbsUp className="h-4 w-4" />
          <span>{t.helpful}</span>
        </button>
      </div>
    </div>
  );
}
