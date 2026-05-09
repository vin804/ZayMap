"use client";

import { SearchShop } from "@/hooks/use-shop-search";
import { X, MapPin, Star, Store } from "lucide-react";
import Link from "next/link";

interface SearchResultsListProps {
  results: SearchShop[];
  loading: boolean;
  onClose: () => void;
  onResultClick?: (shop: SearchShop) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕", electronics: "📱", food: "🍜", cosmetics: "💄", second_hand: "♻️", other: "🏪",
};

export function SearchResultsList({ results, loading, onClose, onResultClick }: SearchResultsListProps) {
  if (loading) {
    return (
      <div className="absolute top-20 left-4 right-4 z-[999] bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-semibold text-sm text-[var(--text-dark)]">Searching...</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--border-subtle)] rounded-full transition-colors">
            <X className="h-4 w-4 text-[var(--text-gray)]" />
          </button>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#667eea]" />
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-20 left-4 right-4 z-[999] bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-semibold text-sm text-[var(--text-dark)]">No shops found</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--border-subtle)] rounded-full transition-colors">
            <X className="h-4 w-4 text-[var(--text-gray)]" />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-[var(--text-gray)]">Try a different search term or check your spelling.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-20 left-4 right-4 z-[999] bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-subtle)] max-h-[60vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <h3 className="font-semibold text-sm text-[var(--text-dark)]">{results.length} shops found</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-[var(--border-subtle)] rounded-full transition-colors">
          <X className="h-4 w-4 text-[var(--text-gray)]" />
        </button>
      </div>
      <div className="overflow-auto flex-1">
        {results.map((shop) => (
          <div key={shop.shop_id} onClick={() => onResultClick?.(shop)}
            className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--border-subtle)] cursor-pointer transition-colors">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center overflow-hidden">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-lg">{CATEGORY_ICONS[shop.category] || "🏪"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-[var(--text-dark)] truncate">{shop.name}</h4>
              <div className="flex items-center gap-2 text-xs text-[var(--text-gray)] mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{shop.distance_km.toFixed(1)} km</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{shop.rating.toFixed(1)}</span>
              </div>
            </div>
            <Link href={`/shop/${shop.shop_id}`} onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-[#667eea] hover:text-white hover:bg-[#667eea] px-3 py-1.5 rounded-lg transition-all">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}