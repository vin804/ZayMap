"use client";

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAuthGuard } from "@/components/auth-guard";
import { MapComponent } from "@/components/map/map-component";
import { ShopSidebar } from "@/components/map/shop-sidebar";
import { RadiusControl } from "@/components/map/radius-control";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResultsList } from "@/components/search/search-results-list";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useShopsNearby, Shop } from "@/hooks/use-shops-nearby";
import { useShopSearch, SearchShop } from "@/hooks/use-shop-search";
import { useRouting, RouteStep } from "@/hooks/use-routing";
import { LogOut, User, Menu, X, Store, Plus, Navigation, Loader2, Heart, Star, Crosshair, Layers, ChevronLeft, Sun, Moon, Bookmark } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";

// Main map page component wrapped with Suspense
export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}

function MapPageContent() {
  const { user, logout } = useAuth();
  const { checkAuth, AuthGuardModal } = useAuthGuard();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Initialize radius from URL params or default to 5
  const [radius, setRadiusState] = useState(() => {
    const urlRadius = searchParams.get("radius");
    return urlRadius ? parseInt(urlRadius, 10) : 5;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasShop, setHasShop] = useState(false);
  const [isCheckingShop, setIsCheckingShop] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [highlightedShopId, setHighlightedShopId] = useState<string | undefined>(undefined);
  const [initialCenter, setInitialCenter] = useState<{lat: number; lng: number} | undefined>(undefined);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [directionsShop, setDirectionsShop] = useState<Shop | null>(null);
  const [flyToUserLocation, setFlyToUserLocation] = useState(false);
  // Load mapType from localStorage on mount, default to 'street'
  const [mapType, setMapType] = useState<'street' | 'satellite'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zaymap_map_type');
      return saved === 'satellite' ? 'satellite' : 'street';
    }
    return 'street';
  });
  const hasAutoTriggeredRef = useRef(false);
  
  // Save mapType to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zaymap_map_type', mapType);
    }
  }, [mapType]);

  // Routing hook
  const { route, loading: routeLoading, getRoute, clearRoute } = useRouting();

  // Check if user has a shop and get shop ID
  useEffect(() => {
    const checkUserShop = async () => {
      if (!user?.uid) {
        setIsCheckingShop(false);
        return;
      }
      try {
        const response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setHasShop(true);
            setShopId(data.data.shop_id);
          }
        }
      } catch (error) {
        console.error("Error checking shop:", error);
      } finally {
        setIsCheckingShop(false);
      }
    };
    checkUserShop();
  }, [user?.uid]);


  // Check for URL params (from shop registration redirect or product card)
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const highlight = searchParams.get("highlight");
    const shop = searchParams.get("shop");
    
    if (lat && lng) {
      setInitialCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (highlight) {
      setHighlightedShopId(highlight);
    }
    if (shop) {
      setHighlightedShopId(shop);
    }
  }, [searchParams]);

  const {
    latitude: userLat,
    longitude: userLon,
    loading: locationLoading,
    error: locationError,
    retry: retryLocation,
  } = useGeolocation();

  // Use URL center if available, otherwise use user location
  const effectiveUserLat = initialCenter?.lat ?? userLat;
  const effectiveUserLon = initialCenter?.lng ?? userLon;

  // Nearby shops hook
  const { shops: nearbyShops, loading: shopsLoading, error: shopsError, retry: retryShops } =
    useShopsNearby({
      userLat: effectiveUserLat,
      userLon: effectiveUserLon,
      radiusKm: radius,
    });

  // Search hook for map search
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    clearResults,
  } = useShopSearch(userLat, userLon);

  // Handle search from SearchBar
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      search({
        query: query.trim(),
        categories: [],
        radiusKm: radius,
      });
    } else {
      clearResults();
    }
  }, [search, clearResults, radius]);

  // Use search results when searching, otherwise use nearby shops
  // Handle get directions - PUBLIC, no auth required
  const handleGetDirections = useCallback((shop: Shop) => {
    setDirectionsShop(shop);
    setShowDirectionsPanel(true);
    getRoute({
      userLat: userLat,
      userLon: userLon,
      shopLat: shop.latitude,
      shopLon: shop.longitude
    });
  }, [userLat, userLon, getRoute]);

  // Handle close directions
  const handleCloseDirections = useCallback(() => {
    setShowDirectionsPanel(false);
    setDirectionsShop(null);
    clearRoute();
    
    // Remove shop param from URL so it doesn't re-trigger on refresh
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("shop")) {
      params.delete("shop");
      const newUrl = params.toString() ? `/map?${params.toString()}` : "/map";
      router.push(newUrl, { scroll: false });
    }
    
    // Reset the auto-trigger ref so it can work again for other shops
    hasAutoTriggeredRef.current = false;
  }, [clearRoute, searchParams, router]);

  // Auto-trigger directions when shop param is present and shops are loaded
  useEffect(() => {
    const shopId = searchParams.get("shop");
    if (shopId && nearbyShops.length > 0 && userLat && userLon && !hasAutoTriggeredRef.current) {
      const targetShop = nearbyShops.find(s => s.shopId === shopId);
      if (targetShop) {
        hasAutoTriggeredRef.current = true;
        handleGetDirections(targetShop);
      }
    }
  }, [searchParams, nearbyShops, userLat, userLon, handleGetDirections]);

  const displayedShops = searchQuery.trim()
    ? searchResults
    : nearbyShops.map((shop) => ({
        shop_id: shop.shopId,
        name: shop.name,
        category: shop.category,
        latitude: shop.latitude,
        longitude: shop.longitude,
        distance_km: shop.distance ?? 0,
        rating: shop.rating ?? 0,
        review_count: 0,
        response_speed_score: 80,
        delivery_available: false,
      }));

  const isLoading = searchQuery.trim() ? searchLoading : shopsLoading;
  const error = searchQuery.trim() ? searchError : shopsError;

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--card-bg)] border-b border-gray-200/20 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5 text-[var(--text-dark)]" />
                ) : (
                  <Menu className="h-5 w-5 text-[var(--text-dark)]" />
                )}
              </button>
              <h1 className="text-xl font-semibold gradient-text">ZayMap</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-dark)] hover:bg-gray-500/10 hover:border-[var(--border-color)] transition-all"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-[#667eea]" />
                )}
              </button>

              {/* Saved Button - always visible, requires auth */}
              <button
                onClick={() => {
                  if (!checkAuth(user, "view saved products")) return;
                  router.push("/saved");
                }}
                className="flex items-center gap-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-dark)] px-4 py-2 text-sm font-medium hover:bg-gray-500/10 hover:border-[var(--border-color)] transition-all"
                title="Saved Products"
              >
                <Bookmark className="h-4 w-4 text-[#667eea]" />
                <span>Saved</span>
              </button>

              {/* Followed Shops Button - always visible, requires auth */}
              <button
                onClick={() => {
                  if (!checkAuth(user, "view followed shops")) return;
                  router.push("/followed-shops");
                }}
                className="flex items-center gap-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-dark)] px-4 py-2 text-sm font-medium hover:bg-gray-500/10 hover:border-[var(--border-color)] transition-all"
                title="Followed Shops"
              >
                <Star className="h-4 w-4 text-[#667eea]" />
                <span>Following</span>
              </button>

              {/* My Shop Button - always visible when has shop, requires auth */}
              {!isCheckingShop && hasShop && (
                <button
                  onClick={() => {
                    if (!checkAuth(user, "access my shop")) return;
                    router.push("/shop/dashboard");
                  }}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all bg-[#667eea] text-white shadow-md hover:bg-[#5a67d8]"
                  title="My Shop Dashboard"
                >
                  <Store className="h-4 w-4" />
                  <span>My Shop</span>
                </button>
              )}

              {/* Register Shop Button - always visible, requires auth */}
              {!isCheckingShop && !hasShop && (
                <button
                  onClick={() => {
                    if (!checkAuth(user, "register a shop")) return;
                    router.push("/onboarding/shop-registration");
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-[#667eea] text-[#667eea] px-4 py-2 text-sm font-medium transition-all hover:bg-[#667eea] hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Shop</span>
                </button>
              )}
              
              {/* Radius Control */}
              <div className="hidden sm:flex">
                <RadiusControl
                  radius={radius}
                  onChange={(newRadius) => {
                    setRadiusState(newRadius);
                    // Update URL with new radius
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("radius", newRadius.toString());
                    router.push(`/map?${params.toString()}`, { scroll: false });
                  }}
                />
              </div>
              {/* Profile & Auth Buttons */}
              {user ? (
                <>
                  <Link
                    href="/auth/profile"
                    className="hidden items-center gap-2 text-sm text-[var(--text-gray)] sm:flex hover:text-[#667eea] transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user?.displayName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg bg-[var(--card-bg)] border border-gray-200/20 text-red-500 px-3 py-2 text-sm font-medium hover:bg-red-500/10 transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Log out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="hidden items-center gap-2 text-sm text-[var(--text-gray)] sm:flex hover:text-[#667eea] transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>Log in</span>
                  </Link>
                  <Link
                    href="/auth"
                    className="flex items-center gap-2 rounded-lg bg-[#667eea] text-white px-4 py-2 text-sm font-medium hover:bg-[#5a67d8] transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Sidebar - Desktop always visible, Mobile toggle */}
          <aside
            className={`absolute left-0 top-0 z-10 h-full w-[280px] bg-[var(--card-bg)] shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <ShopSidebar
              shops={searchQuery.trim() ? [] : nearbyShops}
              loading={isLoading}
              error={error}
              radius={radius}
              onRetry={retryShops}
              onGetDirections={handleGetDirections}
            />
          </aside>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="absolute inset-0 z-0 bg-black/20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Map */}
          <main className="relative flex-1">
            {/* Search Bar - Quick locate on map */}
            <SearchBar
              onSearch={handleSearch}
              onFilterClick={() => router.push("/search")}
            />
            
            {/* Search Results List - Shows when searching */}
            {searchQuery.trim() && (
              <SearchResultsList
                results={searchResults}
                loading={searchLoading}
                onClose={() => {
                  setSearchQuery("");
                  clearResults();
                }}
                onResultClick={(shop) => {
                  // Center map on selected shop and show popup
                  // This is handled by highlightedShopId
                }}
              />
            )}
            
            <MapComponent
              userLat={effectiveUserLat}
              userLon={effectiveUserLon}
              actualUserLat={userLat}
              actualUserLon={userLon}
              userLocationLoading={locationLoading}
              userLocationError={locationError}
              shops={displayedShops}
              shopsLoading={isLoading}
              shopsError={error}
              onRetryLocation={retryLocation}
              onRetryShops={retryShops}
              highlightedShopId={searchResults.length === 1 ? searchResults[0].shop_id : highlightedShopId}
              initialCenter={initialCenter}
              radius={radius}
              route={route}
              flyToUserLocation={flyToUserLocation}
              onFlyComplete={() => setFlyToUserLocation(false)}
              mapType={mapType}
            />

          </main>

          {/* Map Type Switcher Button */}
          <button
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="absolute bottom-36 right-4 z-[9998] bg-[var(--card-bg)] border border-gray-200/20 rounded-xl shadow-lg p-3 hover:bg-gray-500/10 transition-colors"
            title={mapType === 'street' ? 'Switch to satellite view' : 'Switch to street view'}
          >
            <div className="w-8 h-8 bg-gray-500/10 rounded-full flex items-center justify-center">
              <Layers className="h-5 w-5 text-[var(--text-gray)]" />
            </div>
            <span className="text-xs text-[var(--text-gray)] mt-1 block">
              {mapType === 'street' ? 'Satellite' : 'Street'}
            </span>
          </button>

          {/* Locate Me Button */}
          <button
            onClick={() => {
              setHighlightedShopId(undefined);  // Clear shop highlight to prevent centering override
              setInitialCenter(undefined);      // Also clear initial center from URL params
              setFlyToUserLocation(true);       // Then fly to user's actual GPS location
            }}
            className="absolute bottom-20 right-4 z-[9998] bg-[var(--card-bg)] border border-gray-200/20 rounded-xl shadow-lg p-3 hover:bg-gray-500/10 transition-colors"
            title="Go to my location"
          >
            <div className="w-8 h-8 bg-[#667eea] rounded-full flex items-center justify-center">
              <Crosshair className="h-5 w-5 text-white" />
            </div>
          </button>

          {/* Directions Panel - Outside main to appear above map */}
          {showDirectionsPanel && route && (
            <div className="absolute right-4 top-20 z-[9999] w-80 bg-[var(--card-bg)] border border-gray-200/20 rounded-xl shadow-xl p-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/20">
                <h3 className="font-semibold text-[var(--text-dark)]">Directions</h3>
                <button 
                  onClick={handleCloseDirections}
                  className="p-1 hover:bg-gray-500/10 rounded-full"
                >
                  <X className="h-5 w-5 text-[var(--text-gray)]" />
                </button>
              </div>
              
              {/* Route Summary */}
              <div className="bg-[#667eea]/10 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#667eea]">
                    {directionsShop?.name}
                  </span>
                  <span className="text-[var(--text-gray)]">
                    {routeLoading ? "Calculating..." : `${(route.totalDistance / 1000).toFixed(1)} km • ${Math.round(route.totalDuration / 60)} min`}
                  </span>
                </div>
              </div>

              {/* Turn-by-turn Steps */}
              <div className="space-y-3">
                {route.steps?.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-500/10 rounded-full flex items-center justify-center text-xs font-medium text-[var(--text-gray)] shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text-dark)]">{step.instruction}</p>
                      <p className="text-xs text-[var(--text-gray)] mt-0.5">
                        {(step.distance / 1000).toFixed(2)} km • {Math.round(step.duration / 60)} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
      <AuthGuardModal />
    </div>
  );
}
