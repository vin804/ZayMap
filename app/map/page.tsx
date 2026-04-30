"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { MapComponent } from "@/components/map/map-component";
import { ShopSidebar } from "@/components/map/shop-sidebar";
import { RadiusControl } from "@/components/map/radius-control";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResultsList } from "@/components/search/search-results-list";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useShopsNearby, Shop } from "@/hooks/use-shops-nearby";
import { useShopSearch, SearchShop } from "@/hooks/use-shop-search";
import { useRouting, RouteStep } from "@/hooks/use-routing";
import { LogOut, User, Menu, X, Store, Plus, Calendar, Bell, Navigation, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [shopId, setShopId] = useState<string | null>(null);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [lastBookingCount, setLastBookingCount] = useState(0);
  const [newBookingPopup, setNewBookingPopup] = useState<{productName: string; customerName: string} | null>(null);
  const [highlightedShopId, setHighlightedShopId] = useState<string | undefined>(undefined);
  const [initialCenter, setInitialCenter] = useState<{lat: number; lng: number} | undefined>(undefined);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [directionsShop, setDirectionsShop] = useState<Shop | null>(null);
  
  // Routing hook
  const { route, loading: routeLoading, getRoute, clearRoute } = useRouting();

  // Check if user has a shop and get shop ID
  useEffect(() => {
    const checkUserShop = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setHasShop(true);
          setShopId(data.data?.shop_id || null);
        }
      } catch {
        setHasShop(false);
        setShopId(null);
      }
    };
    checkUserShop();
  }, [user?.uid]);

  // Poll for new bookings
  useEffect(() => {
    if (!shopId) return;

    const checkBookings = async () => {
      try {
        const response = await fetch(`/api/shops/${shopId}/bookings`);
        if (response.ok) {
          const data = await response.json();
          const bookings: Array<{id: string; product_name: string; user_name?: string; status: string; created_at: string}> = data.data || [];
          const pending = bookings.filter((b) => b.status === "pending").length;
          
          // Check for new bookings (if count increased)
          if (lastBookingCount > 0 && bookings.length > lastBookingCount) {
            // Find the newest booking
            const sortedBookings = [...bookings].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const latestBooking = sortedBookings[0];
            if (latestBooking) {
              setNewBookingPopup({
                productName: latestBooking.product_name,
                customerName: latestBooking.user_name || "A customer"
              });
              // Auto-hide after 5 seconds
              setTimeout(() => setNewBookingPopup(null), 5000);
            }
          }
          
          setLastBookingCount(bookings.length);
          setPendingBookings(pending);
        }
      } catch {
        // Silent fail
      }
    };

    // Check immediately
    checkBookings();

    // Poll every 30 seconds
    const interval = setInterval(checkBookings, 30000);
    return () => clearInterval(interval);
  }, [shopId, lastBookingCount]);

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
  // Handle get directions
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
  }, [clearRoute]);

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
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-zinc-50">
        {/* New Booking Popup Notification */}
        {newBookingPopup && (
          <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">New Booking!</p>
              <p className="text-sm text-white/90">
                {newBookingPopup.customerName} booked {newBookingPopup.productName}
              </p>
            </div>
            <button 
              onClick={() => {
                setNewBookingPopup(null);
                router.push("/shop/dashboard");
              }}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              View
            </button>
            <button 
              onClick={() => setNewBookingPopup(null)}
              className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Directions Panel */}
        {showDirectionsPanel && directionsShop && (
          <div className="fixed top-20 right-4 z-[1100] w-[320px] max-h-[70vh] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-semibold text-white">{directionsShop.name}</p>
                  <p className="text-xs text-white/80">{directionsShop.distance?.toFixed(1)} km away</p>
                </div>
              </div>
              <button
                onClick={handleCloseDirections}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Route Summary */}
            {route && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Distance</span>
                  <span className="text-sm font-semibold text-[#667eea]">
                    {(route.totalDistance / 1000).toFixed(1)} km
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Time</span>
                  <span className="text-sm font-semibold text-[#667eea]">
                    {Math.round(route.totalDuration / 60)} min
                  </span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {routeLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#667eea]" />
                <span className="ml-2 text-sm text-gray-500">Calculating route...</span>
              </div>
            )}

            {/* Turn-by-turn Directions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {route?.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#667eea]/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-[#667eea]">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {step.instruction}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(step.distance / 1000).toFixed(1)} km · {Math.round(step.duration / 60)} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <header className="z-20 bg-white shadow-sm">
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
              {/* My Bookings Button */}
              <button
                onClick={() => router.push("/bookings")}
                className="hidden sm:flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                title="My Bookings"
              >
                <Calendar className="h-4 w-4" />
                <span>My Bookings</span>
              </button>

              {/* Mobile My Bookings Button */}
              <button
                onClick={() => router.push("/bookings")}
                className="flex sm:hidden items-center gap-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                title="My Bookings"
              >
                <Calendar className="h-4 w-4" />
              </button>

              {/* My Shop Button - for shop owners */}
              <button
                onClick={() => router.push("/shop/dashboard")}
                className="hidden sm:flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-md relative"
                title="My Shop Dashboard"
              >
                <Store className="h-4 w-4" />
                <span>My Shop</span>
                {pendingBookings > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingBookings > 9 ? '9+' : pendingBookings}
                  </span>
                )}
              </button>
              
              {/* Mobile My Shop Button */}
              <button
                onClick={() => router.push("/shop/dashboard")}
                className="flex sm:hidden items-center gap-1 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-3 py-2 text-sm font-medium text-white relative"
                title="My Shop"
              >
                <Store className="h-4 w-4" />
                {pendingBookings > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500" />
                )}
              </button>
              
              {/* Register Shop Button - only show if user doesn't have a shop */}
              {!hasShop && (
                <button
                  onClick={() => router.push("/onboarding/shop-registration")}
                  className="hidden sm:flex items-center gap-2 rounded-lg border-2 border-[#667eea] text-[#667eea] px-4 py-2 text-sm font-medium transition-all hover:bg-[#667eea] hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Shop</span>
                </button>
              )}
              
              {/* Mobile Register Shop Button - only show if user doesn't have a shop */}
              {!hasShop && (
                <button
                  onClick={() => router.push("/onboarding/shop-registration")}
                  className="flex sm:hidden items-center gap-1 rounded-lg border-2 border-[#667eea] text-[#667eea] px-3 py-2 text-sm font-medium hover:bg-[#667eea] hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              
              <RadiusControl 
                radius={radius} 
                max={1800}
                onChange={(newRadius) => {
                  setRadiusState(newRadius);
                  // Update URL params without reloading
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("radius", newRadius.toString());
                  router.replace(`/map?${params.toString()}`, { scroll: false });
                }} 
              />
              <div className="hidden items-center gap-2 text-sm text-[var(--text-gray)] sm:flex">
                <User className="h-4 w-4" />
                <span className="max-w-[100px] truncate">{user?.displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Sidebar - Desktop always visible, Mobile toggle */}
          <aside
            className={`absolute left-0 top-0 z-10 h-full w-[280px] bg-white shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0 ${
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
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
