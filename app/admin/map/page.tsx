"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layers, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const AdminMapViewer = dynamic(() => import("@/components/admin/admin-map-viewer"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
    </div>
  ),
});

interface Shop {
  shop_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  logo_url?: string;
  address?: string;
}

export default function AdminMapPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");

  useEffect(() => {
    fetch("/api/admin/shops/all")
      .then((res) => res.json())
      .then((result) => {
        const data = (result.data || []).filter(
          (s: Shop) => s.latitude && s.longitude
        );
        setShops(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const center = useMemo((): [number, number] => {
    if (shops.length === 0) return [20.0, 96.0];
    const avgLat = shops.reduce((sum, s) => sum + s.latitude, 0) / shops.length;
    const avgLng = shops.reduce((sum, s) => sum + s.longitude, 0) / shops.length;
    return [avgLat, avgLng];
  }, [shops]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--background)]">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/admin")}
        className="absolute top-4 left-4 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-lg text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </motion.button>

      {/* Satellite / Street Toggle */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() =>
          setMapType((prev) => (prev === "street" ? "satellite" : "street"))
        }
        className="absolute top-4 right-4 z-[9999] flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-lg hover:bg-[var(--bg-hover)] transition-colors"
      >
        <Layers className="h-5 w-5 text-[var(--fg)]" />
        <span className="text-[10px] font-medium text-[var(--fg-muted)]">
          {mapType === "street" ? "Satellite" : "Street"}
        </span>
      </motion.button>

      {/* Shop Count Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border)] shadow-lg"
      >
        <p className="text-sm font-medium text-[var(--fg)]">
          {shops.length} shop{shops.length !== 1 ? "s" : ""} on map
        </p>
      </motion.div>

      <AdminMapViewer shops={shops} center={center} mapType={mapType} />
    </div>
  );
}