"use client";

import { SearchShop } from "@/hooks/use-shop-search";
import { X, MapPin } from "lucide-react";
import Link from "next/link";

interface SearchResultsListProps {
  results: SearchShop[];
  loading: boolean;
  onClose: () => void;
  onResultClick?: (shop: SearchShop) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕",
  electronics: "📱",
  food: "🍜",
  cosmetics: "💄",
  second_hand: "♻️",
  other: "🏪",
};

export function SearchResultsList({
  results,
  loading,
  onClose,
  onResultClick,
}: SearchResultsListProps) {
  if (loading) {
    return (
      <div className="absolute top-20 left-4 right-4 z-[999] bg-[var(--card-bg)] rounded-xl shadow-lg p-4 max-h-[60vh] overflow-auto border border-gray-200/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[var(--text-dark)]">Searching...</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-500/10 rounded-full">
            <X className="h-4 w-4 text-[var(--text-gray)]" />
          </button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#667eea]" />
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-20 left-4 right-4 z-[999] bg-[var(--card-bg)] rounded-xl shadow-lg p-4 border border-gray-200/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[var(--text-dark)]">No shops found</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-500/10 rounded-full">
            <X className="h-4 w-4 text-[var(--text-gray)]" />
          </button>
        </div>
        <p className="text-sm text-[var(--text-gray)]">Try a different search term or check your spelling.</p>
      </div>
    );
  }

  return (
    <div className="absolute top-20 left-4 right-4 z-[999] bg-[var(--card-bg)] rounded-xl shadow-lg max-h-[60vh] overflow-hidden flex flex-col border border-gray-200/20">
      <div className="flex items-center justify-between p-4 border-b border-gray-200/20">
        <h3 className="font-semibold text-[var(--text-dark)]">{results.length} shops found</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-500/10 rounded-full">
          <X className="h-4 w-4 text-[var(--text-gray)]" />
        </button>
      </div>
      
      <div className="overflow-auto flex-1">
        {results.map((shop) => (
          <div
            key={shop.shop_id}
            onClick={() => onResultClick?.(shop)}
            className="flex items-center gap-3 p-4 border-b border-gray-200/20 hover:bg-gray-500/10 cursor-pointer transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gray-500/10 rounded-full flex items-center justify-center text-lg">
              {CATEGORY_ICONS[shop.category] || "🏪"}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-[var(--text-dark)] truncate">{shop.name}</h4>
              <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {shop.distance_km.toFixed(1)} km
                </span>
                <span>•</span>
                <span>⭐ {shop.rating.toFixed(1)}</span>
              </div>
            </div>
            <Link
              href={`/shop/${shop.shop_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-[#667eea] hover:text-[#5a67d8] px-3 py-1 rounded-lg hover:bg-[#667eea]/10 transition-colors"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
