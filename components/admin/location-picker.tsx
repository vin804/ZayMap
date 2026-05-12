"use client";

import { useEffect, useRef, useState } from "react";
import { MYANMAR_BOUNDS, TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION } from "@/lib/leaflet-config";
import { MapPin, Loader2 } from "lucide-react";

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

export function LocationPicker({ onLocationChange, initialLocation }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then(() => {
      import("leaflet/dist/leaflet.css").then(() => setLeafletLoaded(true));
    });
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L || require("leaflet");
    const startLat = initialLocation?.lat ?? 21.9747;
    const startLng = initialLocation?.lng ?? 96.0836;

    const map = L.map(mapRef.current).setView([startLat, startLng], 14);
    mapInstanceRef.current = map;

    L.tileLayer(TILE_LAYER_URL, {
      attribution: TILE_LAYER_ATTRIBUTION,
      maxZoom: 18,
      minZoom: 5,
    }).addTo(map);

    // Custom div icon that doesn't rely on external PNG files
    const createIcon = () =>
      L.divIcon({
        className: "custom-marker-icon",
        html: `<div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

    // Add initial marker if provided
    if (initialLocation) {
      const marker = L.marker([initialLocation.lat, initialLocation.lng], {
        draggable: true,
        icon: createIcon(),
      }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange({ lat: pos.lat, lng: pos.lng });
      });
    }

    // Click to place marker
    map.on("click", (e: any) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        const marker = L.marker(e.latlng, {
          draggable: true,
          icon: createIcon(),
        }).addTo(map);
        markerRef.current = marker;
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange({ lat: pos.lat, lng: pos.lng });
        });
      }
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  return (
    <div className="relative rounded-xl border border-[var(--border)] overflow-hidden">
      {!leafletLoaded && (
        <div className="h-64 bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-gray)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      <div ref={mapRef} className="h-64 w-full" />
      <div className="absolute bottom-2 left-2 bg-[var(--card-bg)]/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-[var(--text-gray)] border border-[var(--border)] flex items-center gap-1">
        <MapPin className="h-3 w-3 text-[#667eea]" />
        Click map to place pin
      </div>
    </div>
  );
}