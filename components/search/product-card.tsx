"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, Package, Share2 } from "lucide-react";
import { useState } from "react";

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

const FRESHNESS_STYLES = {
  green:  { label: "New",    bg: "rgba(34,197,94,0.12)",  text: "#22c55e", border: "rgba(34,197,94,0.2)" },
  orange: { label: "Recent", bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  red:    { label: "",       bg: "",                       text: "",       border: "" },
};

export function ProductCard({
  product_id, product_name, product_name_mm, image_url, price, currency, freshness_status, product_rating = 0, distance_km,
}: ProductCardProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const displayProductName = product_name_mm || product_name;
  const freshness = FRESHNESS_STYLES[freshness_status] || FRESHNESS_STYLES.red;
  const hasProductRating = product_rating && product_rating > 0;

  return (
    <Link href={`/product/${product_id}`} className="group block">
      <motion.div
        whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(102,126,234,0.15)" }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden border border-[var(--border-subtle)]/60 bg-[var(--card-bg)]"
      >
        {/* Image - wider aspect ratio for bigger cards */}
        <div className="relative w-full aspect-[4/3] bg-[var(--bg)] overflow-hidden">
          {image_url ? (
            <img
              src={image_url}
              alt={displayProductName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-[var(--text-gray)] opacity-30" />
            </div>
          )}
          {freshness_status !== "red" && (
            <div className="absolute top-3 left-3">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: freshness.bg, color: freshness.text, border: `1px solid ${freshness.border}` }}
              >
                {freshness.label}
              </span>
            </div>
          )}
          {/* Share button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/product/${product_id}`);
              setShareCopied(true);
              setTimeout(() => setShareCopied(false), 2000);
            }}
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all"
            title="Copy link"
          >
            <Share2 className={`h-4 w-4 ${shareCopied ? "text-green-400" : "text-white"}`} />
          </button>
          {shareCopied && (
            <span className="absolute top-12 right-3 z-10 text-[10px] font-semibold text-green-500 bg-white px-2 py-0.5 rounded-md shadow-sm">
              Copied!
            </span>
          )}
        </div>

        {/* Info - bigger text */}
        <div className="p-4">
          <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-[#667eea] transition-colors text-[var(--text-dark)] leading-snug">
            {displayProductName}
          </h3>

          <div className="flex items-center gap-1.5 mb-2.5">
            {hasProductRating ? (
              <>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${star <= Math.round(product_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-500/30"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-[var(--text-gray)]">({(product_rating || 0).toFixed(1)})</span>
              </>
            ) : (
              <span className="text-sm text-[#667eea]/80">Be first to review!</span>
            )}
          </div>

          <p className="text-xl font-bold text-[var(--text-dark)] mb-1.5">
            {price?.toLocaleString()} {currency}
          </p>

          <div className="flex items-center gap-1.5 text-sm text-[var(--text-gray)]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{distance_km.toFixed(1)} km away</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}