"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, History, ChevronLeft, Loader2, Heart, Store, Package, AlertCircle, Navigation } from "lucide-react";
import { ShopCard } from "@/components/search/shop-card";
import { CategoryFilter } from "@/components/search/category-filter";
import { useShopSearch, useRecentSearches, SearchFilters } from "@/hooks/use-shop-search";
import { useProductSearch } from "@/hooks/use-product-search";
import { ProductCard } from "@/components/search/product-card";

const RADIUS_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
];

const SEARCH_STATE_KEY = "zaymap_search_state";

/* ── Skeletons ── */
function ShopSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)]">
      <div className="h-24 animate-pulse bg-gray-300/10" />
      <div className="relative px-4 pb-4">
        <div className="relative -mt-6 mb-2 flex items-end gap-3">
          <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full border-2 border-[var(--card-bg)] bg-gray-300/10" />
          <div className="mb-1 flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-300/10" />
            <div className="h-3 w-20 animate-pulse rounded-lg bg-gray-300/10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 animate-pulse rounded bg-gray-300/10" />
          <div className="h-3 w-12 animate-pulse rounded bg-gray-300/10" />
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--card-bg)]">
      <div className="aspect-square animate-pulse bg-gray-300/10" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-gray-300/10" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-300/10" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-gray-300/10" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"shops" | "products">("shops");
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

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

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setLocationError(null);
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError("Unable to get your location. Please enable location services.");
        setUserLocation({ lat: 16.8661, lon: 96.1951 });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

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
    } catch { /* ignore */ }
    setIsRestored(true);
  }, []);

  useEffect(() => {
    if (!isRestored || !userLocation) return;
    const timer = setTimeout(() => {
      if (activeTab === "shops") {
        if (query.trim() || selectedCategories.length > 0) performShopSearch();
      } else {
        if (query.trim().length >= 1) performProductSearch();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isRestored, userLocation]);

  useEffect(() => {
    if (typeof window === "undefined" || !isRestored) return;
    try {
      localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({ query, activeTab, selectedCategories, radiusKm }));
    } catch { /* ignore */ }
  }, [query, activeTab, selectedCategories, radiusKm, isRestored]);

  const performShopSearch = useCallback(async () => {
    if (!userLocation) return;
    const filters: SearchFilters = { query: query.trim(), categories: selectedCategories, radiusKm };
    await search(filters);
    setHasSearched(true);
    if (query.trim() || selectedCategories.length > 0) {
      saveRecentSearch({ query: query.trim(), categories: selectedCategories, radiusKm });
    }
  }, [query, selectedCategories, radiusKm, userLocation, search, saveRecentSearch]);

  const performProductSearch = useCallback(async () => {
    if (!userLocation || !query.trim()) return;
    await searchProducts({ query: query.trim(), latitude: userLocation.lat, longitude: userLocation.lon, radius_km: radiusKm });
    setHasSearched(true);
  }, [query, userLocation, radiusKm, searchProducts]);

  useEffect(() => {
    if (!userLocation) return;
    const timer = setTimeout(() => {
      if (activeTab === "shops") {
        if (query.trim() || selectedCategories.length > 0) performShopSearch();
      } else {
        if (query.trim().length >= 2) performProductSearch();
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Glass Header */}
      <div className="sticky top-0 z-10 bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/map")} className="p-2 -ml-2 rounded-xl hover:bg-[var(--border-subtle)] transition-colors">
                <ChevronLeft className="h-5 w-5 text-[var(--text-gray)]" />
              </button>
              <h1 className="text-lg font-bold text-[var(--text-dark)]">
                {activeTab === "shops" ? "Search Shops" : "Search Products"}
              </h1>
            </div>
            <button onClick={() => router.push("/saved")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-[#667eea] bg-[#667eea]/10 hover:bg-[#667eea]/15 transition-all">
              <Heart className="h-4 w-4" />
              <span>Saved</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-gray)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTab === "shops" ? "Search shops by name..." : "Search products..."}
                className="w-full pl-11 pr-10 py-3 bg-[var(--card-bg)] border-2 border-[var(--border-subtle)] shadow-sm rounded-2xl text-[var(--text-dark)] placeholder-[var(--text-gray)] focus:outline-none focus:ring-2 focus:ring-[#667eea]/40 focus:border-[#667eea] transition-all"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[var(--border-subtle)] transition-colors">
                  <X className="h-4 w-4 text-[var(--text-gray)]" />
                </button>
              )}
            </div>
            {locationError ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-500">
                <MapPin className="h-4 w-4" />
                <span>{locationError}</span>
              </div>
            ) : userLocation && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-gray)]">
                <Navigation className="h-3.5 w-3.5" />
                <span>Searching near your location</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Tab Switcher */}
        <div className="mb-5">
          <div className="flex bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-1 shadow-sm">
            <button onClick={() => handleTabChange("shops")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === "shops" ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md" : "text-[var(--text-gray)] hover:text-[var(--text-dark)] hover:bg-[var(--border-subtle)]"}`}>
              <Store className="h-4 w-4" /> Shops
            </button>
            <button onClick={() => handleTabChange("products")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === "products" ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md" : "text-[var(--text-gray)] hover:text-[var(--text-dark)] hover:bg-[var(--border-subtle)]"}`}>
              <Package className="h-4 w-4" /> Products
            </button>
          </div>
        </div>

        {/* Radius */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--text-dark)]">Search Radius</h3>
            <span className="text-sm font-bold text-[#667eea]">{radiusKm} km</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {RADIUS_OPTIONS.map((option) => (
              <button key={option.value} onClick={() => setRadiusKm(option.value)}
                className={`flex-shrink-0 py-2 px-3.5 rounded-xl text-sm font-medium transition-all border ${radiusKm === option.value ? "bg-[#667eea] text-white border-[#667eea] shadow-md" : "bg-[var(--card-bg)] text-[var(--text-gray)] border-[var(--border-subtle)] hover:border-[var(--border-color)]"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        {activeTab === "shops" && (
          <CategoryFilter selectedCategories={selectedCategories} onChange={setSelectedCategories} />
        )}

        {(query || selectedCategories.length > 0) && (
          <button onClick={handleClearSearch} className="mt-4 text-sm font-medium text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors">
            Clear all filters
          </button>
        )}
      </div>

      {/* Recent Searches */}
      {!hasSearched && recentSearches.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-[var(--text-gray)]" />
            <h3 className="text-sm font-semibold text-[var(--text-dark)]">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((recent) => (
              <button key={recent.id} onClick={() => handleRecentSearchClick(recent)}
                className="group flex items-center gap-2 px-3 py-2 bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-gray)] hover:border-[#667eea]/50 transition-all">
                <span className="truncate max-w-[150px]">{recent.query || recent.categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}</span>
                <span className="text-xs opacity-60">({recent.radiusKm} km)</span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); removeRecentSearch(recent.id); }} />
              </button>
            ))}
          </div>
        </div>
      )}

                      {/* Results */}
      <div className="px-4 py-4 mx-auto max-w-7xl">
        {/* ── Loading Skeletons ── */}
        {activeTab === "shops" && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ opacity: 0, animation: `fadeIn 0.3s ease ${i * 80}ms forwards` }}>
                <ShopSkeleton />
              </div>
            ))}
          </div>
        )}
        {activeTab === "products" && productLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ opacity: 0, animation: `fadeIn 0.3s ease ${i * 60}ms forwards` }}>
                <ProductSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* ── Error States ── */}
        {activeTab === "shops" && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 mb-3">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <p className="text-sm font-bold text-[var(--text-dark)]">Search failed</p>
            <p className="text-xs text-[var(--text-gray)] mt-1 mb-4">{error}</p>
            <button onClick={performShopSearch} className="rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:scale-[1.03] transition-all">
              Try Again
            </button>
          </div>
        )}
        {activeTab === "products" && productError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 mb-3">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <p className="text-sm font-bold text-[var(--text-dark)]">Search failed</p>
            <p className="text-xs text-[var(--text-gray)] mt-1 mb-4">{productError}</p>
            <button onClick={performProductSearch} className="rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:scale-[1.03] transition-all">
              Try Again
            </button>
          </div>
        )}

        {/* ── Shop Results ── */}
        {activeTab === "shops" && !loading && !error && hasSearched && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[var(--text-dark)]">
                {totalCount} {totalCount === 1 ? "shop" : "shops"} found
              </h2>
            </div>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 mb-3">
                  <Search className="h-7 w-7 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-[var(--text-dark)]">No shops found</p>
                <p className="text-xs text-[var(--text-gray)] mt-1">Try expanding your radius or clearing filters.</p>
              </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                    image_urls={(shop as any).image_urls}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Product Results ── */}
        {activeTab === "products" && !productLoading && !productError && hasSearched && (
          <>
            <div className="mb-4">
              <h2 className="text-base font-bold text-[var(--text-dark)]">
                {productMeta?.total_count ?? 0} {productMeta?.total_count === 1 ? "product" : "products"} found
              </h2>
            </div>
            {productResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 mb-3">
                  <Package className="h-7 w-7 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-[var(--text-dark)]">No products found</p>
                <div className="mt-3 space-y-2 text-xs text-[var(--text-gray)]">
                  <p>Try different keywords</p>
                  <button onClick={() => setRadiusKm(radiusKm + 5)} className="text-[#667eea] font-medium hover:underline">Increase your search radius</button>
                  <p>or</p>
                  <button onClick={() => router.push("/map")} className="text-[#667eea] font-medium hover:underline">Browse shops instead</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {productResults.map((product) => (
                  <ProductCard key={product.product_id} {...product} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Empty State ── */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--border-subtle)] mb-4">
              <Search className="h-8 w-8 text-[var(--text-gray)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-dark)]">
              {activeTab === "shops" ? "Enter a shop name or select categories" : "Enter a product name to search"}
            </p>
            <p className="text-xs text-[var(--text-gray)] mt-1">
              {activeTab === "shops" ? "Results will appear automatically" : "Minimum 2 characters required"}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}