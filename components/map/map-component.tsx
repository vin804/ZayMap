"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { YANGON_COORDINATES, MYANMAR_BOUNDS, TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION, SATELLITE_TILE_URL, SATELLITE_ATTRIBUTION, LABELS_TILE_URL, LABELS_ATTRIBUTION } from "@/lib/leaflet-config";
import { Loader2, MapPin, AlertCircle } from "lucide-react";

// Unified shop interface for map display
interface MapShop {
  shop_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  rating: number;
  review_count: number;
  response_speed_score: number;
  delivery_available: boolean;
}

interface RouteData {
  coordinates: [number, number][];
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    type: string;
  }>;
  totalDistance: number;
  totalDuration: number;
}

interface MapComponentProps {
  userLat: number;
  userLon: number;
  userLocationLoading: boolean;
  userLocationError: string | null;
  shops: MapShop[];
  shopsLoading: boolean;
  shopsError: string | null;
  onRetryLocation: () => void;
  onRetryShops: () => void;
  highlightedShopId?: string | null;
  initialCenter?: { lat: number; lng: number } | null;
  radius?: number; // Search radius in km
  route?: RouteData | null;
  flyToUserLocation?: boolean; // Trigger fly to user location
  onFlyComplete?: () => void; // Callback when fly completes
  mapType?: 'street' | 'satellite'; // Map tile layer type
  actualUserLat?: number; // Actual GPS location for fly-to-me button
  actualUserLon?: number; // Actual GPS location for fly-to-me button
}

export function MapComponent({
  userLat,
  userLon,
  userLocationLoading,
  userLocationError,
  shops,
  shopsLoading,
  shopsError,
  onRetryLocation,
  onRetryShops,
  highlightedShopId,
  initialCenter,
  radius = 5, // Default 5km
  route,
  flyToUserLocation,
  onFlyComplete,
  mapType = 'street',
  actualUserLat,
  actualUserLon,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const radiusCircleRef = useRef<unknown>(null);
  const radiusLabelRef = useRef<unknown>(null);
  const routeLineRef = useRef<unknown>(null);
  const routeShadowRef = useRef<unknown>(null);
  const routeStartMarkerRef = useRef<unknown>(null);
  const routeEndMarkerRef = useRef<unknown>(null);
  const zoomRef = useRef<number>(14); // Track current zoom level
  const baseTileLayerRef = useRef<unknown>(null);
  const labelsTileLayerRef = useRef<unknown>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLeafletLoaded(true);
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L || require("leaflet");

    // Determine initial center
    // Use initialCenter if provided (from URL params), otherwise use user location
    // Validate coordinates and fallback to default if invalid
    let centerLat = initialCenter?.lat ?? userLat;
    let centerLng = initialCenter?.lng ?? userLon;
    
    // Check for NaN or invalid coordinates
    if (isNaN(centerLat) || isNaN(centerLng) || !centerLat || !centerLng) {
      console.log("[Map] Invalid coordinates detected, using default location");
      centerLat = (YANGON_COORDINATES as [number, number])[0];
      centerLng = (YANGON_COORDINATES as [number, number])[1];
    }
    
    // Use tracked zoom level to preserve user's zoom when map re-initializes
    const isDefaultLocation =
      centerLat === (YANGON_COORDINATES as [number, number])[0] &&
      centerLng === (YANGON_COORDINATES as [number, number])[1];
    const zoom = initialCenter && !isNaN(initialCenter.lat) ? 16 : (isDefaultLocation ? 12 : zoomRef.current);

    // Create map with bounds restricted to Myanmar
    const map = L.map(mapRef.current, {
      maxBounds: MYANMAR_BOUNDS,
      maxBoundsViscosity: 1.0, // Prevents dragging outside bounds
      zoomControl: false, // Disable +/- zoom buttons
    }).setView([centerLat, centerLng], zoom);
    mapInstanceRef.current = map;

    // Track zoom changes to preserve user zoom level
    map.on('zoomend', () => {
      zoomRef.current = map.getZoom();
    });

    // Add base tile layer based on mapType
    if (mapType === 'satellite') {
      const satelliteLayer = L.tileLayer(SATELLITE_TILE_URL, {
        attribution: SATELLITE_ATTRIBUTION,
        maxZoom: 18,
        minZoom: 5,
      }).addTo(map);
      baseTileLayerRef.current = satelliteLayer;

      // Add labels overlay on top of satellite
      const labelsLayer = L.tileLayer(LABELS_TILE_URL, {
        attribution: LABELS_ATTRIBUTION,
        maxZoom: 18,
        minZoom: 5,
        pane: 'tilePane',
      }).addTo(map);
      labelsLayer.setZIndex(250);
      labelsTileLayerRef.current = labelsLayer;
    } else {
      // Street map
      const streetLayer = L.tileLayer(TILE_LAYER_URL, {
        attribution: TILE_LAYER_ATTRIBUTION,
        maxZoom: 18,
        minZoom: 5,
      }).addTo(map);
      baseTileLayerRef.current = streetLayer;
    }

    // Create Myanmar mask overlay (hide other countries)
    map.createPane("myanmarMask");
    const maskPane = map.getPane("myanmarMask");
    if (maskPane) {
      maskPane.style.zIndex = "650";
    }

    // Create dark mask covering world with hole for Myanmar (actual border shape)
    const worldBounds: [number, number][] = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
    ];

    // Myanmar border polygon from real GeoJSON data
    // Coordinates converted from GeoJSON [lng,lat] to Leaflet [lat,lng] format
    const myanmarBorder: [number, number][] = [
      [20.186598, 99.543309],
      [19.752981, 98.959676],
      [19.708203, 98.253724],
      [18.627080, 97.797783],
      [18.445438, 97.375896],
      [17.567946, 97.859123],
      [16.837836, 98.493761],
      [16.177824, 98.903348],
      [15.308497, 98.537376],
      [15.123703, 98.192074],
      [14.622028, 98.430819],
      [13.827503, 99.097755],
      [13.269294, 99.212012],
      [12.804748, 99.196354],
      [11.892763, 99.587286],
      [10.960546, 99.038121],
      [9.932960, 98.553551],
      [10.675266, 98.457174],
      [11.441292, 98.764546],
      [12.032987, 98.428339],
      [13.122378, 98.509574],
      [13.640460, 98.103604],
      [14.837286, 97.777732],
      [16.100568, 97.597072],
      [16.928734, 97.164540],
      [16.427241, 96.505769],
      [15.714390, 95.369352],
      [15.803454, 94.808405],
      [16.037936, 94.188804],
      [17.277240, 94.533486],
      [18.213514, 94.324817],
      [19.366493, 93.540988],
      [19.726962, 93.663255],
      [19.855145, 93.078278],
      [20.670883, 92.368554],
      [21.475485, 92.303234],
      [21.324048, 92.652257],
      [22.041239, 92.672721],
      [22.278460, 93.166128],
      [22.703111, 93.060294],
      [23.043658, 93.286327],
      [24.078556, 93.325188],
      [23.850741, 94.106742],
      [24.675238, 94.552658],
      [25.162495, 94.603249],
      [26.001307, 95.155153],
      [26.573572, 95.124768],
      [27.264589, 96.419366],
      [27.083774, 97.133999],
      [27.699059, 97.051989],
      [27.882536, 97.402561],
      [28.261583, 97.327114],
      [28.335945, 97.911988],
      [27.747221, 98.246231],
      [27.508812, 98.682690],
      [26.743536, 98.712094],
      [25.918703, 98.671838],
      [25.083637, 97.724609],
      [23.897405, 97.604720],
      [24.063286, 98.660262],
      [23.142722, 98.898749],
      [22.949039, 99.531992],
      [22.118314, 99.240899],
      [21.742937, 99.983489],
      [21.558839, 100.416538],
      [21.849984, 101.150033],
      [21.436573, 101.180005],
      [20.786122, 100.329101],
      [20.417850, 100.115988],
      [20.186598, 99.543309],  // Close loop
    ];

    const maskLayer = L.polygon([worldBounds, myanmarBorder], {
      pane: "myanmarMask",
      fillColor: "#0f0f23",
      fillOpacity: 0.9,
      color: "#667eea",
      weight: 2,
      interactive: false,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, userLat, userLon]);

  // Update map view when user location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;

    const map = mapInstanceRef.current as { panTo: (coords: [number, number], options?: { animate?: boolean }) => void; getZoom: () => number };

    // Pan map to user location without changing zoom (only if not default)
    const isDefaultLocation =
      userLat === (YANGON_COORDINATES as [number, number])[0] &&
      userLon === (YANGON_COORDINATES as [number, number])[1];
    if (!isDefaultLocation && userLat && userLon) {
      map.panTo([userLat, userLon]); // Use panTo instead of setView to preserve zoom
    }
  }, [userLat, userLon, leafletLoaded]);

  // Fly to user location when button is clicked
  useEffect(() => {
    // Use actual GPS location if available, otherwise fall back to userLat/userLon
    const targetLat = actualUserLat ?? userLat;
    const targetLon = actualUserLon ?? userLon;
    
    if (!mapInstanceRef.current || !leafletLoaded || !flyToUserLocation || !targetLat || !targetLon) return;

    const map = mapInstanceRef.current as { flyTo: (coords: [number, number], zoom: number, options?: { duration?: number }) => void };
    map.flyTo([targetLat, targetLon], 15, { duration: 1.5 });

    if (onFlyComplete) {
      onFlyComplete();
    }
  }, [flyToUserLocation, userLat, userLon, actualUserLat, actualUserLon, leafletLoaded, onFlyComplete]);

  // Switch tile layers when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded || !baseTileLayerRef.current) return;

    const L: typeof import("leaflet") = window.L || require("leaflet");
    const map = mapInstanceRef.current as L.Map;
    const baseLayer = baseTileLayerRef.current as L.TileLayer;

    // Remove existing base layer
    map.removeLayer(baseLayer);

    // Add new base layer based on mapType
    if (mapType === 'satellite') {
      const satelliteLayer = L.tileLayer(SATELLITE_TILE_URL, {
        attribution: SATELLITE_ATTRIBUTION,
        maxZoom: 18,
        minZoom: 5,
      }).addTo(map);
      baseTileLayerRef.current = satelliteLayer;

      // Add labels overlay on top of satellite
      if (!labelsTileLayerRef.current) {
        const labelsLayer = L.tileLayer(LABELS_TILE_URL, {
          attribution: LABELS_ATTRIBUTION,
          maxZoom: 18,
          minZoom: 5,
          pane: 'tilePane',
        }).addTo(map);
        // Bring labels to front
        labelsLayer.setZIndex(250);
        labelsTileLayerRef.current = labelsLayer;
      }
    } else {
      // Street map
      const streetLayer = L.tileLayer(TILE_LAYER_URL, {
        attribution: TILE_LAYER_ATTRIBUTION,
        maxZoom: 18,
        minZoom: 5,
      }).addTo(map);
      baseTileLayerRef.current = streetLayer;

      // Remove labels layer if it exists
      if (labelsTileLayerRef.current) {
        map.removeLayer(labelsTileLayerRef.current as L.Layer);
        labelsTileLayerRef.current = null;
      }
    }
  }, [mapType, leafletLoaded]);

  // Update radius circle - optimized to use setRadius instead of recreating
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded || !userLat || !userLon) return;

    const L: typeof import("leaflet") = window.L || require("leaflet");
    const map = mapInstanceRef.current as L.Map;

    // Convert km to meters for Leaflet
    const radiusMeters = radius * 1000;

    // If circle already exists, just update radius
    if (radiusCircleRef.current) {
      const circle = radiusCircleRef.current as L.Circle;
      circle.setRadius(radiusMeters);
      return;
    }

    // Create radius circle centered on user location (only once)
    const circle = L.circle([userLat, userLon], {
      radius: radiusMeters,
      color: "#667eea",
      fillColor: "#667eea",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "5, 10",
    }).addTo(map);

    radiusCircleRef.current = circle;

    // Add a user icon at the center of the radius (only once)
    if (!radiusLabelRef.current) {
      const userIcon = L.divIcon({
        className: "user-location-icon",
        html: `<div style="
          width: 32px;
          height: 32px;
          background: #667eea;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"></path>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const label = L.marker([userLat, userLon], {
        icon: userIcon,
        zIndexOffset: 2000,
        interactive: false,
      }).addTo(map);

      radiusLabelRef.current = label;
    }

    return () => {
      try {
        if (radiusCircleRef.current) {
          map.removeLayer(radiusCircleRef.current as L.Layer);
          radiusCircleRef.current = null;
        }
        if (radiusLabelRef.current) {
          map.removeLayer(radiusLabelRef.current as L.Layer);
          radiusLabelRef.current = null;
        }
      } catch {
        // Ignore errors if layers already removed
      }
    };
  }, [userLat, userLon, radius, leafletLoaded]);

  // Update shop markers
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;

    const L: typeof import("leaflet") = window.L || require("leaflet");
    const map = mapInstanceRef.current as L.Map;

    // Clear existing shop markers
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker as L.Layer);
    });
    markersRef.current = [];

    // Add new shop markers
    const markerMap = new Map<string, unknown>();
    
    shops.forEach((shop) => {
      const emoji = getEmojiForCategory(shop.category);
      const shopIcon = L.divIcon({
        className: "shop-marker",
        html: `<div style="
          width: 40px;
          height: 40px;
          background: white;
          border: 3px solid #667eea;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        " onmouseover="this.style.transform='scale(1.1)';this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" 
           onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
          ${emoji}
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([shop.latitude, shop.longitude], { icon: shopIcon }).addTo(map);
      
      // Add popup
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${shop.name}</strong><br>
          <span style="color: #667eea; font-size: 12px;">${shop.distance_km.toFixed(1)} km away</span><br>
          <span style="color: #666; font-size: 11px;">${shop.category}</span>
        </div>
      `);

      markersRef.current.push(marker);
      markerMap.set(shop.shop_id, marker);
    });

    // Open popup for highlighted shop (single search result)
    if (highlightedShopId && markerMap.has(highlightedShopId)) {
      const marker = markerMap.get(highlightedShopId);
      if (marker && (marker as { openPopup?: () => void }).openPopup) {
        (marker as { openPopup: () => void }).openPopup();
        // Center map on the highlighted shop
        const shop = shops.find((s) => s.shop_id === highlightedShopId);
        if (shop) {
          map.setView([shop.latitude, shop.longitude], 16);
        }
      }
    }
  }, [shops, leafletLoaded, highlightedShopId]);

  // Draw route line when route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;

    const L: typeof import("leaflet") = window.L || require("leaflet");
    const map = mapInstanceRef.current as L.Map;

    // Check if map is ready
    if (!map || typeof map.removeLayer !== 'function') return;

    // Remove existing route line and shadow
    if (routeLineRef.current) {
      try {
        map.removeLayer(routeLineRef.current as L.Layer);
      } catch {
        // Ignore errors
      }
      routeLineRef.current = null;
    }
    if (routeShadowRef.current) {
      try {
        map.removeLayer(routeShadowRef.current as L.Layer);
      } catch {}
      routeShadowRef.current = null;
    }

    // Remove existing start/end markers
    if (routeStartMarkerRef.current) {
      try {
        map.removeLayer(routeStartMarkerRef.current as L.Layer);
      } catch {}
      routeStartMarkerRef.current = null;
    }
    if (routeEndMarkerRef.current) {
      try {
        map.removeLayer(routeEndMarkerRef.current as L.Layer);
      } catch {}
      routeEndMarkerRef.current = null;
    }

    // Debug logging
    console.log("Drawing route - full route object:", route);
    console.log("Drawing route:", route?.coordinates?.length, "points", route?.coordinates);

    // Draw new route line if route exists
    if (route && route.coordinates && route.coordinates.length > 1) {
      try {
        // Create a more visible route line with shadow effect
        // First add a shadow/outline polyline
        const shadowPolyline = L.polyline(route.coordinates, {
          color: '#ffffff',
          weight: 12,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // Main route line - solid bright blue
        const polyline = L.polyline(route.coordinates, {
          color: '#3b82f6',
          weight: 6,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        routeLineRef.current = polyline;
        routeShadowRef.current = shadowPolyline;

        // Add start marker (user location)
        const startCoords = route.coordinates[0];
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `<div style="
            background: #22c55e;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const startMarker = L.marker(startCoords, { icon: startIcon, zIndexOffset: 1000 }).addTo(map);
        startMarker.bindPopup('<strong>Your Location</strong>');
        routeStartMarkerRef.current = startMarker;

        // Add end marker (shop location)
        const endCoords = route.coordinates[route.coordinates.length - 1];
        const endIcon = L.divIcon({
          className: 'custom-end-marker',
          html: `<div style="
            background: #ef4444;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">📍</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const endMarker = L.marker(endCoords, { icon: endIcon, zIndexOffset: 1000 }).addTo(map);
        endMarker.bindPopup('<strong>Destination</strong>');
        routeEndMarkerRef.current = endMarker;

        // Fit map to show the entire route
        const bounds = polyline.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80] });
        }
      } catch (err) {
        console.error("Error drawing route:", err);
      }
    }
  }, [route, leafletLoaded]);

  if (!leafletLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {/* Loading overlay */}
      {(userLocationLoading || shopsLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-6 py-4 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-[#667eea]" />
            <p className="text-sm text-[var(--text-gray)]">
              {userLocationLoading ? "Getting your location..." : "Loading shops..."}
            </p>
          </div>
        </div>
      )}

      {/* Location error message */}
      {userLocationError && (
        <div className="absolute left-4 right-4 top-4 z-[1000] rounded-lg bg-red-50 px-4 py-3 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{userLocationError}</p>
              <button
                onClick={onRetryLocation}
                className="mt-1 text-sm font-medium text-red-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shops error message */}
      {shopsError && !shopsLoading && (
        <div className="absolute left-4 right-4 top-4 z-[1000] rounded-lg bg-red-50 px-4 py-3 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{shopsError}</p>
              <button
                onClick={onRetryShops}
                className="mt-1 text-sm font-medium text-red-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No shops message */}
      {!shopsLoading && !shopsError && shops.length === 0 && !userLocationLoading && (
        <div className="absolute left-4 right-4 bottom-4 z-[1000] rounded-lg bg-blue-50 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-blue-700">
              No shops found nearby. Try increasing the radius.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getEmojiForCategory(category: string): string {
  const emojis: Record<string, string> = {
    Clothing: "👕",
    Electronics: "📱",
    "Food & Beverage": "🍔",
    Food: "🍔",
    Beverage: "☕",
    Grocery: "🛒",
    Pharmacy: "💊",
    Beauty: "💄",
    "Home & Garden": "🏠",
    Sports: "⚽",
    Books: "📚",
    Toys: "🧸",
    Jewelry: "💍",
    Furniture: "🪑",
    Automotive: "🚗",
    Pet: "🐾",
    "Health & Wellness": "💪",
    Services: "🔧",
    Education: "🎓",
    Entertainment: "🎬",
    General: "🏪",
    Other: "🏪",
  };
  return emojis[category] || "🏪";
}
