"use client";

import { useState } from "react";
import { MapPin, Copy, Check, ExternalLink, Store } from "lucide-react";

interface AdminShopCardProps {
  shop: {
    shop_id: string;
    name: string;
    category: string;
    owner_id: string;
    created_by?: string;
    latitude: number;
    longitude: number;
    logo_url?: string;
    phone?: string;
    address?: string;
  };
  onCopyLink: (shopId: string) => void;
  onOpenDashboard: (shopId: string) => void;
}

export function AdminShopCard({ shop, onCopyLink, onOpenDashboard }: AdminShopCardProps) {
  const [copied, setCopied] = useState(false);
  const isOwnerless = shop.owner_id === "PENDING";

  const handleCopy = async () => {
    const link = `${window.location.origin}/auth?claim=${shop.shop_id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onCopyLink(shop.shop_id);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      onCopyLink(shop.shop_id);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 space-y-3 hover:border-[#667eea]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold text-sm">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-[var(--text-dark)] text-sm">{shop.name}</h3>
            <p className="text-xs text-[var(--text-gray)]">{shop.category}</p>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isOwnerless
              ? "bg-red-500/10 text-red-500"
              : "bg-green-500/10 text-green-500"
          }`}
        >
          {isOwnerless ? "Ownerless" : "Claimed"}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-gray)]">
        <MapPin className="h-3.5 w-3.5" />
        <span>
          {(shop.latitude ?? 0).toFixed(4)}, {(shop.longitude ?? 0).toFixed(4)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--border-subtle)] text-[var(--text-gray)] hover:bg-[#667eea]/10 hover:text-[#667eea] transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Invite Link
            </>
          )}
        </button>
        <button
          onClick={() => onOpenDashboard(shop.shop_id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#667eea]/10 text-[#667eea] hover:bg-[#667eea]/20 transition-colors"
        >
          <Store className="h-3.5 w-3.5" />
          Dashboard
        </button>
      </div>
    </div>
  );
}
