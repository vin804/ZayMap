"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Shop {
  shop_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  logo_url?: string;
  address?: string;
}

interface Props {
  shops: Shop[];
  center: [number, number];
  mapType: "street" | "satellite";
}

export default function AdminMapViewer({ shops, center, mapType }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
    }).setView(center, shops.length > 0 ? 12 : 6);

    mapRef.current = map;
    L.control.scale({ imperial: false }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update view when center changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, shops.length > 0 ? 12 : 6);
    }
  }, [center, shops.length]);

  // Swap tile layer when mapType changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const url =
      mapType === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution =
      mapType === "satellite"
        ? "Tiles &copy; Esri"
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    tileLayerRef.current = L.tileLayer(url, {
      attribution,
      maxZoom: mapType === "satellite" ? 18 : 19,
    }).addTo(mapRef.current);
  }, [mapType]);

  // Update markers when shops change
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    shops.forEach((shop) => {
      const initial = shop.name.charAt(0).toUpperCase();
      const logoHtml = shop.logo_url
        ? `<img src="${shop.logo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-size:14px;font-weight:bold;border-radius:50%;\\'>'+this.parentElement.dataset.initial+'</div>'" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-size:14px;font-weight:bold;border-radius:50%;">${initial}</div>`;

      const icon = L.divIcon({
        className: "custom-shop-marker",
        html: `<div data-initial="${initial}" style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);background:white;">${logoHtml}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([shop.latitude, shop.longitude], { icon })
        .bindPopup(
          `<div style="min-width:180px;font-family:sans-serif">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:#f0f0f0;flex-shrink:0;">
                ${shop.logo_url ? `<img src="${shop.logo_url}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-size:12px;font-weight:bold;">${initial}</div>`}
              </div>
              <p style="font-weight:700;margin:0;font-size:14px;color:#333">${shop.name}</p>
            </div>
            <p style="font-size:12px;color:#888;margin:0 0 4px">${shop.category}</p>
            ${shop.address ? `<p style="font-size:11px;color:#aaa;margin:0">${shop.address}</p>` : ""}
          </div>`
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [shops]);

  return (
    <>
      <style>{`
        .admin-map-viewer .leaflet-control-zoom {
          margin-top: 60px !important;
        }
      `}</style>
      <div ref={containerRef} className="admin-map-viewer" style={{ height: "100%", width: "100%" }} />
    </>
  );
}