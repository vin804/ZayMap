"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";

interface ProductCardProps {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  shop_id: string;
  shop_name: string;
  shop_name_mm?: string;
  image_url?: string;
  price: number;
  currency: string;
  freshness_status: "green" | "orange" | "red";
  product_rating?: number;
  distance_km: number;
}

// Freshness labels - simplified to just "New"
const FRESHNESS_STYLES = {
  green: {
    label: "New",
    bgColor: "bg-green-500/20",
    textColor: "text-green-500",
    dotColor: "bg-green-500",
  },
  orange: {
    label: "New",
    bgColor: "bg-green-500/20",
    textColor: "text-green-500",
    dotColor: "bg-green-500",
  },
  red: {
    label: "",
    bgColor: "",
    textColor: "",
    dotColor: "",
  },
};

export function ProductCard({
  product_id,
  product_name,
  product_name_mm,
  shop_name,
  shop_name_mm,
  image_url,
  price,
  currency,
  freshness_status,
  product_rating = 0,
  distance_km,
}: ProductCardProps) {
  const displayProductName = product_name_mm || product_name;
  const displayShopName = shop_name_mm || shop_name;
  const freshness = FRESHNESS_STYLES[freshness_status] || FRESHNESS_STYLES.red;
  // Only show product's own rating, not shop rating fallback
  const hasProductRating = product_rating && product_rating > 0;

  return (
    <Link href={`/product/${product_id}`} className="group block bg-[var(--card-bg)] rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-2 border-[var(--border-subtle)] hover:border-[var(--border-color)] overflow-hidden">
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-[var(--background)]">
        {image_url ? (
          <img
            src={image_url}
            alt={displayProductName}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[var(--text-gray)] text-sm">No Image</span>
          </div>
        )}
        {/* New Badge - only show for green/orange (new items) */}
        {freshness_status !== "red" && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${freshness.bgColor} ${freshness.textColor}`}>
              {freshness.label}
            </span>
          </div>
        )}
      </div>

      {/* Product Info - Amazon style like shop page */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-[var(--text-dark)] line-clamp-2 mb-1 group-hover:text-[#667eea] transition-colors min-h-[2.5rem]">
          {displayProductName}
        </h3>

        {/* Rating - hide stars if no reviews, show encouraging text */}
        <div className="flex items-center gap-1 mb-2 min-h-[1rem]">
          {hasProductRating ? (
            <>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${star <= Math.round(product_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--text-gray)]">({(product_rating || 0).toFixed(1)})</span>
            </>
          ) : (
            <span className="text-xs text-[#667eea]">Be first to review!</span>
          )}
        </div>

        {/* Price */}
        <div>
          <span className="text-lg font-bold text-[var(--text-dark)] whitespace-nowrap">
            {price?.toLocaleString()} {currency}
          </span>
        </div>

        {/* Delivery/Pickup badge */}
        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-gray)]">
          <MapPin className="h-3 w-3" />
          <span>{distance_km.toFixed(1)} km away</span>
        </div>
      </div>
    </Link>
  );
}
