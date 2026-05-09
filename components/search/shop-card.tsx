"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Truck, Store } from "lucide-react";

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
  image_urls?: string[];
}

const CATEGORY_ICONS: Record<string, string> = {
  clothes: "👕", electronics: "📱", food: "🍜", cosmetics: "💄", second_hand: "♻️", other: "🏪",
};

const CATEGORY_LABELS: Record<string, string> = {
  clothes: "Clothes", electronics: "Electronics", food: "Food", cosmetics: "Cosmetics", second_hand: "Second-hand", other: "Other",
};

export function ShopCard({
  shop_id, name, name_mm, category, distance_km, rating, review_count, delivery_available, logo_url, image_urls,
}: ShopCardProps) {
  const displayName = name_mm || name;
  const bannerUrl = image_urls?.[0];

  return (
    <Link href={`/shop/${shop_id}`} className="group block">
      <motion.div
        whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(102,126,234,0.15)" }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden border border-[var(--border-subtle)]/60 bg-[var(--card-bg)] h-full flex flex-col"
      >
        {/* Banner - bigger like product cards */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={`${displayName} banner`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#667eea]/15 via-purple-500/10 to-[#764ba2]/15" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
          {rating > 0 && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative px-4 pb-4 flex flex-col flex-1">
          {/* Logo overlapping banner */}
          <div className="relative -mt-10 mb-3 flex items-end gap-3">
            {logo_url ? (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--card-bg)] bg-white shadow-xl transition-transform duration-300 group-hover:scale-105">
                <img src={logo_url} alt={displayName} className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--card-bg)] bg-gradient-to-br from-[#667eea] to-[#764ba2] text-3xl shadow-xl transition-transform duration-300 group-hover:scale-105">
                {CATEGORY_ICONS[category] || "🏪"}
              </div>
            )}
            <div className="mb-2 min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-[var(--text-dark)] transition-colors group-hover:text-[#667eea]">
                {displayName}
              </h3>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-gray)]">
              <Store className="h-3 w-3" />
              {CATEGORY_LABELS[category] || category}
            </span>
            {delivery_available && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                <Truck className="h-3 w-3" /> Delivery
              </span>
            )}
          </div>

          {/* Meta - pushed to bottom */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/40">
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#667eea]">
              <MapPin className="h-4 w-4" />
              {distance_km.toFixed(1)} km away
            </span>
            {review_count > 0 ? (
              <span className="text-sm text-[var(--text-gray)]">{review_count} reviews</span>
            ) : (
              <span className="text-sm text-[var(--text-gray)]">No reviews yet</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}