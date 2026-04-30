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
  booking_fee: number;
  currency: string;
  freshness_status: "green" | "orange" | "red";
  shop_rating: number;
  distance_km: number;
}

const FRESHNESS_STYLES = {
  green: {
    label: "Fresh",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    dotColor: "bg-green-500",
  },
  orange: {
    label: "Recent",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    dotColor: "bg-orange-500",
  },
  red: {
    label: "Old",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    dotColor: "bg-red-500",
  },
};

export function ProductCard({
  product_id,
  product_name,
  product_name_mm,
  shop_id,
  shop_name,
  shop_name_mm,
  image_url,
  price,
  booking_fee,
  currency,
  freshness_status,
  shop_rating,
  distance_km,
}: ProductCardProps) {
  const displayProductName = product_name_mm || product_name;
  const displayShopName = shop_name_mm || shop_name;
  const freshness = FRESHNESS_STYLES[freshness_status] || FRESHNESS_STYLES.red;

  return (
    <Link href={`/product/${product_id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        {image_url ? (
          <img
            src={image_url}
            alt={displayProductName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-black text-sm">No Image</span>
          </div>
        )}
        {/* Freshness Badge - Top Left like shop page */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-medium px-2 py-1 rounded ${freshness.bgColor} ${freshness.textColor}`}>
            {freshness.label}
          </span>
        </div>
      </div>

      {/* Product Info - Amazon style like shop page */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-black line-clamp-2 mb-1 group-hover:text-[#667eea] transition-colors min-h-[2.5rem]">
          {displayProductName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${star <= Math.round(shop_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-xs text-black">({shop_rating.toFixed(1)})</span>
        </div>

        {/* Price */}
        <div className="flex flex-col">
          <span className="text-lg font-bold text-black whitespace-nowrap">
            {price?.toLocaleString()} {currency}
          </span>
          <span className="text-xs text-black whitespace-nowrap">
            + {booking_fee.toLocaleString()} {currency} fee
          </span>
        </div>

        {/* Delivery/Pickup badge */}
        <div className="mt-2 flex items-center gap-1 text-xs text-black">
          <MapPin className="h-3 w-3" />
          <span>{distance_km.toFixed(1)} km away</span>
        </div>
      </div>
    </Link>
  );
}
