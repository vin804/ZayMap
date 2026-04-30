"use client";

import { Shop, getCategoryEmoji } from "@/hooks/use-shops-nearby";
import { MapPin, Loader2, AlertCircle, Star, Navigation } from "lucide-react";
import Link from "next/link";

interface ShopSidebarProps {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  radius: number;
  onRetry: () => void;
  onGetDirections?: (shop: Shop) => void;
}

export function ShopSidebar({
  shops,
  loading,
  error,
  radius,
  onRetry,
  onGetDirections,
}: ShopSidebarProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-[var(--text-gray)]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading shops...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-[var(--text-dark)]">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-[var(--text-gray)]">
        <MapPin className="h-8 w-8" />
        <p className="text-sm">No shops within {radius} km.</p>
        <p className="text-xs">Try increasing the radius.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-dark)]">
          Nearby Shops
        </h2>
        <p className="text-xs text-[var(--text-gray)]">
          {shops.length} shop{shops.length !== 1 ? "s" : ""} within {radius} km
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {shops.map((shop) => (
            <Link
              key={shop.shopId}
              href={`/shop/${shop.shopId}`}
              className="block rounded-lg border border-transparent p-3 transition-all hover:border-[#667eea] hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                {/* Business Logo */}
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg flex-shrink-0">
                    {getCategoryEmoji(shop.category)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[var(--text-dark)]">
                    {shop.name}
                  </h3>
                  <p className="text-xs text-[var(--text-gray)]">
                    {shop.category}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-medium text-[#667eea]">
                      {shop.distance?.toFixed(1) ?? "?"} km
                    </p>
                    {shop.rating !== undefined && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        {shop.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {onGetDirections && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onGetDirections(shop);
                      }}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-[#667eea] hover:text-[#5a67d8] transition-colors"
                    >
                      <Navigation className="h-3 w-3" />
                      Get Directions
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
