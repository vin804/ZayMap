"use client";

import Link from "next/link";
import { Star, MapPin, Truck } from "lucide-react";

interface ShopCardProps {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  distance_km: number;
  rating: number;
  review_count: number;
  delivery_available: boolean;
  logo_url?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕",
  electronics: "📱",
  food: "🍜",
  cosmetics: "💄",
  second_hand: "♻️",
  other: "🏪",
};

const CATEGORY_LABELS: Record<string, string> = {
  clothes: "Clothes",
  electronics: "Electronics",
  food: "Food",
  cosmetics: "Cosmetics",
  second_hand: "Second-hand",
  other: "Other",
};

export function ShopCard({
  shop_id,
  name,
  name_mm,
  category,
  distance_km,
  rating,
  review_count,
  delivery_available,
  logo_url,
}: ShopCardProps) {
  const displayName = name_mm || name;
  
  return (
    <Link
      href={`/shop/${shop_id}`}
      className="group block rounded-xl border border-gray-200/20 bg-[var(--card-bg)] p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#667eea]/30"
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#667eea]/30 to-[#764ba2]/30 flex items-center justify-center overflow-hidden">
          {logo_url ? (
            <img 
              src={logo_url} 
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-xl">{CATEGORY_ICONS[category] || "🏪"}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Shop Name */}
          <h3 className="font-semibold text-[var(--text-dark)] group-hover:text-[#667eea] transition-colors truncate">
            {displayName}
          </h3>
          
          {/* Category Badge */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-[var(--text-gray)]">
              <span>{CATEGORY_ICONS[category] || "🏪"}</span>
              <span>{CATEGORY_LABELS[category] || category}</span>
            </span>
            
            {/* Delivery Badge */}
            {delivery_available && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                <Truck className="h-3 w-3" />
                <span>Delivery</span>
              </span>
            )}
          </div>
          
          {/* Distance */}
          <div className="mt-2 flex items-center gap-1 text-sm text-[var(--text-gray)]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{distance_km.toFixed(1)} km away</span>
          </div>
        </div>
        
        {/* Rating */}
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-[var(--text-dark)]">{rating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-[var(--text-gray)]">({review_count} reviews)</span>
        </div>
      </div>
    </Link>
  );
}
