"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, History, ChevronLeft, Loader2 } from "lucide-react";
import { ShopCard } from "@/components/search/shop-card";
import { CategoryFilter } from "@/components/search/category-filter";
import { useShopSearch, useRecentSearches, SearchFilters } from "@/hooks/use-shop-search";
import { useProductSearch } from "@/hooks/use-product-search";
import { ProductCard } from "@/components/search/product-card";
import { Store, Package } from "lucide-react";

const RADIUS_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
  { value: 500, label: "500 km" },
  { value: 1000, label: "1000 km" },
  { value: 1800, label: "1800 km" },
];

const SEARCH_STATE_KEY = "zaymap_search_state";

export default function SearchPage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Search state
  const [activeTab, setActiveTab] = useState<"shops" | "products">("shops");
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Hooks
  const { results, loading, error, totalCount, search, clearResults } = useShopSearch(
    userLocation?.lat ?? null,
    userLocation?.lon ?? null
  );
  const {
    results: productResults,
    meta: productMeta,
    loading: productLoading,
    error: productError,
    search: searchProducts,
    clearResults: clearProductResults,
  } = useProductSearch();
  const { recentSearches, saveRecentSearch, removeRecentSearch } = useRecentSearches();

  // Get user location on mount
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError("Unable to get your location. Please enable location services.");
        // Fallback to Yangon
        setUserLocation({ lat: 16.8661, lon: 96.1951 });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Restore search state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.query) setQuery(state.query);
        if (state.activeTab) setActiveTab(state.activeTab);
        if (state.selectedCategories) setSelectedCategories(state.selectedCategories);
        if (state.radiusKm) setRadiusKm(state.radiusKm);
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsRestored(true);
  }, []);

  // Trigger search after state is restored and location is available
  useEffect(() => {
    if (!isRestored || !userLocation) return;
    
    // Small delay to ensure state is set
    const timer = setTimeout(() => {
      if (activeTab === "shops") {
        if (query.trim() || selectedCategories.length > 0) {
          performShopSearch();
        }
      } else {
        // For products tab
        if (query.trim().length >= 1) {
          performProductSearch();
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isRestored, userLocation]); // Only run once after restoration

  // Save search state to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined" || !isRestored) return;
    
    try {
      localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({
        query,
        activeTab,
        selectedCategories,
        radiusKm,
      }));
    } catch {
      // Ignore localStorage errors
    }
  }, [query, activeTab, selectedCategories, radiusKm, isRestored]);

  // Debounced search for shops
  const performShopSearch = useCallback(async () => {
    if (!userLocation) return;
    
    const filters: SearchFilters = {
      query: query.trim(),
      categories: selectedCategories,
      radiusKm,
    };
    
    await search(filters);
    setHasSearched(true);
    
    // Save to recent searches if we have results or a query
    if (query.trim() || selectedCategories.length > 0) {
      saveRecentSearch({
        query: query.trim(),
        categories: selectedCategories,
        radiusKm,
      });
    }
  }, [query, selectedCategories, radiusKm, userLocation, search, saveRecentSearch]);

  // Debounced search for products
  const performProductSearch = useCallback(async () => {
    if (!userLocation || !query.trim()) return;
    
    await searchProducts({
      query: query.trim(),
      latitude: userLocation.lat,
      longitude: userLocation.lon,
      radius_km: radiusKm,
    });
    setHasSearched(true);
  }, [query, userLocation, radiusKm, searchProducts]);

  // Auto-search when filters change (with debounce)
  useEffect(() => {
    if (!userLocation) return;
    
    const timer = setTimeout(() => {
      if (activeTab === "shops") {
        if (query.trim() || selectedCategories.length > 0) {
          performShopSearch();
        }
      } else {
        // For products, require at least 2 characters
        if (query.trim().length >= 2) {
          performProductSearch();
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, selectedCategories, radiusKm, userLocation, activeTab, performShopSearch, performProductSearch]);

  const handleClearSearch = () => {
    setQuery("");
    setSelectedCategories([]);
    setHasSearched(false);
    clearResults();
    clearProductResults();
  };

  const handleTabChange = (tab: "shops" | "products") => {
    setActiveTab(tab);
    setHasSearched(false);
    clearResults();
    clearProductResults();
  };

  const handleRecentSearchClick = (recent: { query: string; categories: string[]; radiusKm: number }) => {
    setQuery(recent.query);
    setSelectedCategories(recent.categories);
    setRadiusKm(recent.radiusKm);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Back button and title */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push("/map")}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {activeTab === "shops" ? "Search Shops" : "Search Products"}
            </h1>
          </div>

          {/* Search Input - Centered */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTab === "shops" ? "Search shops by name..." : "Search products..."}
                className="w-full pl-10 pr-10 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#667eea]/50 focus:bg-white transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>

            {/* Location indicator */}
            {locationError ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                <MapPin className="h-4 w-4" />
                <span>{locationError}</span>
              </div>
            ) : userLocation && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>Searching near your location</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4">
        {/* Tab Switcher - Centered */}
        <div className="mb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 max-w-2xl mx-auto">
            <button
              onClick={() => handleTabChange("shops")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "shops"
                  ? "bg-white text-[#667eea] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Store className="h-4 w-4" />
              Shops
            </button>
            <button
              onClick={() => handleTabChange("products")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "products"
                  ? "bg-white text-[#667eea] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Package className="h-4 w-4" />
              Products
            </button>
          </div>
        </div>

        {/* Radius Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 max-w-2xl">
            <h3 className="text-sm font-medium text-gray-700">Search Radius</h3>
            <span className="text-sm font-semibold text-[#667eea]">{radiusKm} km</span>
          </div>
          <div className="flex gap-2 max-w-7xl">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRadiusKm(option.value)}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                  ${radiusKm === option.value
                    ? "bg-[#667eea] text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#667eea]/50"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter - Only for Shops */}
        {activeTab === "shops" && (
          <div className="max-w-2xl mx-auto">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />
          </div>
        )}

        {/* Clear Filters */}
        {(query || selectedCategories.length > 0) && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleClearSearch}
              className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Recent Searches */}
      {!hasSearched && recentSearches.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((recent) => (
              <button
                key={recent.id}
                onClick={() => handleRecentSearchClick(recent)}
                className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#667eea]/50 transition-all"
              >
                <span className="truncate max-w-[150px]">
                  {recent.query || recent.categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}
                </span>
                <span className="text-xs text-gray-400">({recent.radiusKm} km)</span>
                <X
                  className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(recent.id);
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-4 py-4">
        {/* Loading State */}
        {activeTab === "shops" && loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
            <p className="mt-4 text-sm text-gray-500">Searching shops...</p>
          </div>
        )}
        {activeTab === "products" && productLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
            <p className="mt-4 text-sm text-gray-500">Searching products...</p>
          </div>
        )}

        {/* Error State */}
        {activeTab === "shops" && error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={performShopSearch}
              className="mt-4 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        {activeTab === "products" && productError && (
          <div className="text-center py-12">
            <p className="text-red-500">{productError}</p>
            <button
              onClick={performProductSearch}
              className="mt-4 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {activeTab === "shops" && !loading && !error && hasSearched && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {totalCount} {totalCount === 1 ? "shop" : "shops"} found
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No shops found matching your criteria.</p>
                <p className="mt-2 text-sm text-gray-400">Try expanding your radius or clearing filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((shop) => (
                  <ShopCard
                    key={shop.shop_id}
                    shop_id={shop.shop_id}
                    name={shop.name}
                    name_mm={shop.name_mm}
                    category={shop.category}
                    distance_km={shop.distance_km}
                    rating={shop.rating}
                    review_count={shop.review_count}
                    delivery_available={shop.delivery_available}
                    logo_url={shop.logo_url}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Product Results */}
        {activeTab === "products" && !productLoading && !productError && hasSearched && (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 text-left">
                {productMeta?.total_count ?? 0} {productMeta?.total_count === 1 ? "product" : "products"} found
              </h2>
            </div>

            {productResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-black">No products found matching your search.</p>
                <div className="mt-4 space-y-2 text-sm text-black">
                  <p>Try different keywords</p>
                  <button
                    onClick={() => setRadiusKm(radiusKm + 5)}
                    className="text-[#667eea] hover:underline"
                  >
                    Increase your search radius
                  </button>
                  <p>or</p>
                  <button
                    onClick={() => router.push("/map")}
                    className="text-[#667eea] hover:underline"
                  >
                    Browse shops instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full" style={{ textAlign: 'left' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {productResults.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product_id={product.product_id}
                    product_name={product.product_name}
                    product_name_mm={product.product_name_mm}
                    shop_id={product.shop_id}
                    shop_name={product.shop_name}
                    shop_name_mm={product.shop_name_mm}
                    image_url={product.image_url}
                    price={product.price}
                    booking_fee={product.booking_fee}
                    currency={product.currency}
                    freshness_status={product.freshness_status}
                    shop_rating={product.shop_rating}
                    distance_km={product.distance_km}
                  />
                ))}
                  </div>
                </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {activeTab === "shops"
                ? "Enter a shop name or select categories to start searching"
                : "Enter a product name to search (minimum 2 characters)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
