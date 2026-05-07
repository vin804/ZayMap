"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
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
import { LogOut, User, Menu, X, Store, Plus, Navigation, Loader2, Heart, Star, Crosshair, Layers, ChevronLeft, ChevronUp, ChevronDown, Sun, Moon, Bookmark } from "lucide-react";
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
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [directionsMinimized, setDirectionsMinimized] = useState(false);
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
    setDirectionsMinimized(false);
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
  const currentShopId = searchParams.get("shop");
  useEffect(() => {
    if (currentShopId && nearbyShops.length > 0 && userLat && userLon && !hasAutoTriggeredRef.current) {
      const targetShop = nearbyShops.find(s => s.shopId === currentShopId);
      if (targetShop) {
        hasAutoTriggeredRef.current = true;
        handleGetDirections(targetShop);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShopId, nearbyShops.length, userLat, userLon]);

  // Memoize displayedShops to prevent map re-renders
  const displayedShops = useMemo(() => {
    if (searchQuery.trim()) return searchResults;
    return nearbyShops.map((shop) => ({
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
        logo_url: shop.logoUrl,
      }));
  }, [searchQuery, searchResults, nearbyShops]);

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
          <div className="flex items-center justify-between">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2">
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

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Desktop: all buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-dark)] hover:bg-gray-500/10 hover:border-[var(--border-color)] transition-all"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-[#667eea]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!checkAuth(user, "view saved products")) return;
                    router.push("/saved");
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-dark)] px-3 py-2 text-sm font-medium hover:bg-gray-500/10 hover:border-[var(--border-color)] transition-all"
                  title="Saved Products"
                >
                  <Bookmark className="h-4 w-4 text-[#667eea]" />
                  <span>Saved</span>
                </button>
                <button
                  onClick={() => {
                    if (!checkAuth(user, "view followed shops")) return;
                    router.push("/followed-shops");
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-dark)] px-3 py-2 text-sm font-medium hover:bg-gray-500/10 hover:border-[var(--border-color)] transition-all"
                  title="Followed Shops"
                >
                  <Star className="h-4 w-4 text-[#667eea]" />
                  <span>Following</span>
                </button>
                {!isCheckingShop && hasShop && (
                  <button
                    onClick={() => {
                      if (!checkAuth(user, "access my shop")) return;
                      router.push("/shop/dashboard");
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all bg-[#667eea] text-white shadow-md hover:bg-[#5a67d8]"
                    title="My Shop Dashboard"
                  >
                    <Store className="h-4 w-4" />
                    <span>My Shop</span>
                  </button>
                )}
                {!isCheckingShop && !hasShop && (
                  <button
                    onClick={() => {
                      if (!checkAuth(user, "register a shop")) return;
                      router.push("/onboarding/shop-registration");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border-2 border-[#667eea] text-[#667eea] px-3 py-2 text-sm font-medium transition-all hover:bg-[#667eea] hover:text-white"
                    title="Register Shop"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Register</span>
                  </button>
                )}
                <RadiusControl
                  radius={radius}
                  onChange={(newRadius) => {
                    setRadiusState(newRadius);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("radius", newRadius.toString());
                    router.push(`/map?${params.toString()}`, { scroll: false });
                  }}
                />
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-1.5 text-sm text-[var(--text-gray)] hover:text-[#667eea] transition-colors cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      <span className="max-w-[80px] truncate">{user?.displayName}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--card-bg)] border border-gray-200/20 text-red-500 px-3 py-2 text-sm font-medium hover:bg-red-500/10 transition-all"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth"
                      className="flex items-center gap-1.5 text-sm text-[var(--text-gray)] hover:text-[#667eea] transition-colors cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      <span>Log in</span>
                    </Link>
                    <Link
                      href="/auth"
                      className="flex items-center gap-1.5 rounded-lg bg-[#667eea] text-white px-3 py-2 text-sm font-medium hover:bg-[#5a67d8] transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span>Sign up</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile: Radius only (compact) */}
              <div className="flex lg:hidden items-center">
                <RadiusControl
                  radius={radius}
                  compact
                  onChange={(newRadius) => {
                    setRadiusState(newRadius);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("radius", newRadius.toString());
                    router.push(`/map?${params.toString()}`, { scroll: false });
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Desktop Sidebar - always visible with shop list */}
          <aside className="hidden lg:block w-[280px] h-full bg-[var(--card-bg)] shadow-lg overflow-y-auto flex-shrink-0">
            <ShopSidebar
              shops={searchQuery.trim() ? [] : nearbyShops}
              loading={isLoading}
              error={error}
              radius={radius}
              onRetry={retryShops}
              onGetDirections={handleGetDirections}
            />
          </aside>

          {/* Mobile Nav Drawer - slides from left with nav buttons */}
          <aside
            className={`lg:hidden fixed inset-y-0 left-0 z-[10000] w-[280px] bg-[var(--card-bg)] shadow-xl transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="p-4 space-y-2 overflow-y-auto h-full">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/20 mb-2">
                <h2 className="font-semibold text-[var(--text-dark)]">Menu</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-500/10 rounded-full">
                  <X className="h-5 w-5 text-[var(--text-gray)]" />
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => { toggleTheme(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-[#667eea]" />
                )}
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              </button>

              {/* Saved */}
              <button
                onClick={() => { setSidebarOpen(false); if (!checkAuth(user, "view saved products")) return; router.push("/saved"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
              >
                <Bookmark className="h-5 w-5 text-[#667eea]" />
                <span>Saved Products</span>
              </button>

              {/* Following */}
              <button
                onClick={() => { setSidebarOpen(false); if (!checkAuth(user, "view followed shops")) return; router.push("/followed-shops"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
              >
                <Star className="h-5 w-5 text-[#667eea]" />
                <span>Followed Shops</span>
              </button>

              {/* My Shop / Register */}
              {!isCheckingShop && hasShop && (
                <button
                  onClick={() => { setSidebarOpen(false); if (!checkAuth(user, "access my shop")) return; router.push("/shop/dashboard"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
                >
                  <Store className="h-5 w-5 text-[#667eea]" />
                  <span>My Shop</span>
                </button>
              )}
              {!isCheckingShop && !hasShop && (
                <button
                  onClick={() => { setSidebarOpen(false); if (!checkAuth(user, "register a shop")) return; router.push("/onboarding/shop-registration"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
                >
                  <Plus className="h-5 w-5 text-[#667eea]" />
                  <span>Register Shop</span>
                </button>
              )}

              {/* Auth Section */}
              <div className="pt-3 border-t border-gray-200/20 mt-2">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setSidebarOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
                    >
                      <User className="h-5 w-5 text-[#667eea]" />
                      <span className="truncate">{user?.displayName || "Profile"}</span>
                    </Link>
                    <button
                      onClick={() => { setSidebarOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-500 text-sm transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Log out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth"
                      onClick={() => setSidebarOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-[var(--text-dark)] text-sm transition-colors"
                    >
                      <User className="h-5 w-5 text-[#667eea]" />
                      <span>Log in</span>
                    </Link>
                    <Link
                      href="/auth"
                      onClick={() => setSidebarOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#667eea] text-white text-sm transition-colors mt-1"
                    >
                      <User className="h-5 w-5" />
                      <span>Sign up</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* Overlay for mobile nav drawer */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-[9999] bg-black/40 lg:hidden"
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

          {/* Mobile Bottom Sheet - Shop List */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9997]">
            {/* Drag Handle */}
            <div
              onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
              className="bg-[var(--card-bg)] border-t border-gray-200/20 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] px-4 pt-3 pb-2 flex flex-col items-center cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-1 bg-gray-400/50 rounded-full mb-1"></div>
              <div className="flex items-center gap-1 text-xs text-[var(--text-gray)]">
                <ChevronUp className={`h-4 w-4 transition-transform duration-300 ${bottomSheetOpen ? 'rotate-180' : ''}`} />
                <span>{bottomSheetOpen ? 'Close' : 'Nearby Shops'}</span>
              </div>
            </div>

            {/* Sheet Content */}
            <div className={`bg-[var(--card-bg)] shadow-xl transition-all duration-300 ease-out ${bottomSheetOpen ? 'max-h-[60vh]' : 'max-h-0'}`}>
              <div className="h-[60vh] overflow-y-auto">
                <ShopSidebar
                  shops={searchQuery.trim() ? [] : nearbyShops}
                  loading={isLoading}
                  error={error}
                  radius={radius}
                  onRetry={retryShops}
                  onGetDirections={(shop) => {
                    setBottomSheetOpen(false);
                    handleGetDirections(shop);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Directions Panel - Outside main to appear above map */}
          {showDirectionsPanel && route && (
            <div className={`absolute z-[9999] bg-[var(--card-bg)] border border-gray-200/20 shadow-xl transition-all duration-300 ${
              directionsMinimized
                ? 'right-4 bottom-24 lg:right-4 lg:top-20 lg:bottom-auto w-auto rounded-full px-4 py-2'
                : 'right-4 top-20 w-[calc(100%-2rem)] lg:w-80 max-h-[70vh] overflow-y-auto rounded-xl p-4'
            }`}>
              <div className={`flex items-center justify-between ${!directionsMinimized && 'mb-4 pb-3 border-b border-gray-200/20'}`}>
                {!directionsMinimized && <h3 className="font-semibold text-[var(--text-dark)]">Directions</h3>}

                {/* Compact summary when minimized */}
                {directionsMinimized && (
                  <div className="flex items-center gap-3 mr-2">
                    <span className="font-medium text-[#667eea] text-sm">{directionsShop?.name}</span>
                    <span className="text-xs text-[var(--text-gray)]">
                      {routeLoading ? "..." : `${(route.totalDistance / 1000).toFixed(1)} km • ${Math.round(route.totalDuration / 60)} min`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDirectionsMinimized(!directionsMinimized)}
                    className="p-1 hover:bg-gray-500/10 rounded-full lg:hidden"
                    title={directionsMinimized ? "Expand" : "Minimize"}
                  >
                    {directionsMinimized ? (
                      <ChevronUp className="h-5 w-5 text-[var(--text-gray)]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[var(--text-gray)]" />
                    )}
                  </button>
                  <button
                    onClick={handleCloseDirections}
                    className="p-1 hover:bg-gray-500/10 rounded-full"
                  >
                    <X className="h-5 w-5 text-[var(--text-gray)]" />
                  </button>
                </div>
              </div>

              {!directionsMinimized && (
                <>
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
                </>
              )}
            </div>
          )}
      </div>
      <AuthGuardModal />
    </div>
  );
}
