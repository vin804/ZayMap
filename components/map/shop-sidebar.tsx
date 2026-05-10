"use client";

import { Shop, getCategoryEmoji } from "@/hooks/use-shops-nearby";
import { MapPin, Loader2, AlertCircle, Star, Navigation, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ShopSidebarProps {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  radius: number;
  onRetry: () => void;
  onGetDirections?: (shop: Shop) => void;
}

const KF_ID = "shop-sidebar-kf";
const KEYFRAMES = `
  @keyframes sbSlideIn {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes sbFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl bg-[var(--bg-elevated)] shadow-[0_8px_24px_rgba(15,17,26,0.04)]">
      <div className="h-24 animate-pulse bg-gray-300/15" />
      <div className="relative px-3 pb-3">
        <div className="relative -mt-5 mb-2 flex items-end gap-3">
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full border-2 border-[var(--card-bg)] bg-gray-300/15" />
          <div className="mb-0.5 flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-300/15" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-gray-300/15" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-14 animate-pulse rounded bg-gray-300/15" />
          <div className="h-2.5 w-10 animate-pulse rounded bg-gray-300/15" />
        </div>
      </div>
    </div>
  );
}

export function ShopSidebar({
  shops,
  loading,
  error,
  radius,
  onRetry,
  onGetDirections,
}: ShopSidebarProps) {
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById(KF_ID)) {
      const s = document.createElement("style");
      s.id = KF_ID;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
    const t = setTimeout(() => setAnimReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col" style={{ animation: "sbFadeIn 0.3s ease-out" }}>
        <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
          <div className="mb-1.5 flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-gray-300/15" />
            <div className="h-4 w-28 animate-pulse rounded bg-gray-300/15" />
          </div>
          <div className="h-3 w-40 animate-pulse rounded bg-gray-300/15" />
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                opacity: animReady ? undefined : 0,
                animation: animReady
                  ? `sbSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 90}ms forwards`
                  : undefined,
              }}
            >
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center"
        style={{ animation: "sbFadeIn 0.35s ease-out" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-dark)]">Unable to load shops</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-gray)]">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.03] hover:shadow-purple-500/35 active:scale-[0.97]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        style={{ animation: "sbFadeIn 0.35s ease-out" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
          <MapPin className="h-7 w-7 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-dark)]">No shops found</p>
          <p className="mt-1 text-xs text-[var(--text-gray)]">
            No shops within {radius} km of your location.
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-gray)] opacity-70">
            Try increasing the search radius.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2]">
            <Store className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-dark)]">
            Nearby Shops
          </h2>
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-gray)]">
          {shops.length} shop{shops.length !== 1 ? "s" : ""} within {radius} km
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {shops.map((shop, index) => (
            <Link
              key={shop.shopId}
              href={`/shop/${shop.shopId}`}
              className="group block overflow-hidden rounded-xl bg-[var(--bg-elevated)] shadow-[0_8px_24px_rgba(15,17,26,0.04)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,17,26,0.06)]"
              style={{
                opacity: animReady ? undefined : 0,
                animation: animReady
                  ? `sbSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index * 70, 500)}ms forwards`
                  : undefined,
              }}
            >
              <div className="relative h-24 overflow-hidden">
                {shop.bannerUrl ? (
                  <img
                    src={shop.bannerUrl}
                    alt={`${shop.name} banner`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#667eea]/15 via-purple-500/10 to-[#764ba2]/15" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                {shop.rating !== undefined && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-md">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-bold text-white">
                      {shop.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative px-3 pb-3">
                <div className="relative -mt-5 mb-1.5 flex items-end gap-2.5">
                  {shop.logoUrl ? (
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[var(--card-bg)] bg-white shadow-md transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--card-bg)] bg-gradient-to-br from-[#667eea] to-[#764ba2] text-base shadow-md transition-transform duration-300 group-hover:scale-105">
                      {getCategoryEmoji(shop.category)}
                    </div>
                  )}

                  <div className="mb-0.5 min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[var(--text-dark)] transition-colors group-hover:text-[#667eea]">
                      {shop.name}
                    </h3>
                    <p className="text-[11px] text-[var(--text-gray)]">{shop.category}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#667eea]">
                    <Navigation className="h-3 w-3" />
                    {shop.distance?.toFixed(1) ?? "?"} km
                  </span>

                  {onGetDirections && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onGetDirections(shop);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-[#667eea]/10 px-2.5 py-1 text-[11px] font-semibold text-[#667eea] transition-all hover:bg-[#667eea] hover:text-white active:scale-95"
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}