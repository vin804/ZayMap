"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  ArrowLeft, 
  Store, 
  Heart, 
  MapPin, 
  Phone, 
  Star,
  Trash2,
  Loader2,
  AlertCircle,
  Package
} from "lucide-react";

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  phone: string;
  address: string;
  logo_url?: string;
  rating: number;
  review_count: number;
  delivery_available: boolean;
}

export default function FollowedShopsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [followedShops, setFollowedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  // Load followed shops
  useEffect(() => {
    const loadFollowedShops = async () => {
      if (!user?.uid) {
        setFollowedShops([]);
        setLoading(false);
        return;
      }

      const savedIds = JSON.parse(localStorage.getItem(`followedShops_${user.uid}`) || "[]");
      
      if (savedIds.length === 0) {
        setFollowedShops([]);
        setLoading(false);
        return;
      }

      // Fetch shop details
      const shops: Shop[] = [];
      for (const shopId of savedIds) {
        try {
          const res = await fetch(`/api/shops/${shopId}`);
          if (res.ok) {
            const data = await res.json();
            shops.push(data.data);
          }
        } catch {
          // Skip failed fetches
        }
      }
      
      setFollowedShops(shops);
      setLoading(false);
    };

    loadFollowedShops();
  }, [user?.uid]);

  // Remove shop from followed list
  const removeFollowed = (shopId: string) => {
    if (!user?.uid) return;
    setRemoving(shopId);
    
    // Update localStorage
    const savedIds = JSON.parse(localStorage.getItem(`followedShops_${user.uid}`) || "[]");
    const updated = savedIds.filter((id: string) => id !== shopId);
    localStorage.setItem(`followedShops_${user.uid}`, JSON.stringify(updated));
    
    // Update state
    setFollowedShops(followedShops.filter(s => s.shop_id !== shopId));
    setRemoving(null);
  };

  // Clear all followed shops
  const clearAll = () => {
    if (!user?.uid) return;
    if (confirm("Are you sure you want to unfollow all shops?")) {
      localStorage.setItem(`followedShops_${user.uid}`, "[]");
      setFollowedShops([]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card-bg)] border-b border-gray-200/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-500/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[var(--text-dark)]" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-dark)]">Followed Shops</h1>
                <p className="text-sm text-[var(--text-gray)]">Shops you are following</p>
              </div>
            </div>
            
            {followedShops.length > 0 && (
              <button
                onClick={clearAll}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#667eea] mb-4" />
            <p className="text-[var(--text-gray)]">Loading followed shops...</p>
          </div>
        ) : followedShops.length === 0 ? (
          <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-gray-200/20">
            <Store className="h-16 w-16 text-[var(--text-gray)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-dark)] mb-2">No followed shops</h3>
            <p className="text-[var(--text-gray)] mb-4">Follow shops to see them here</p>
            <button
              onClick={() => router.push("/map")}
              className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium hover:shadow-md transition-all"
            >
              Explore Shops
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followedShops.map((shop) => (
              <div
                key={shop.shop_id}
                className="bg-[var(--card-bg)] rounded-xl border border-gray-200/20 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Shop Logo */}
                  <Link href={`/shop/${shop.shop_id}`} className="flex-shrink-0">
                    {shop.logo_url ? (
                      <img
                        src={shop.logo_url}
                        alt={shop.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                        <Store className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </Link>

                  {/* Shop Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${shop.shop_id}`}>
                      <h3 className="font-semibold text-[var(--text-dark)] mb-1 hover:text-[#667eea] transition-colors">
                        {shop.name}
                      </h3>
                    </Link>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{shop.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">({shop.review_count} reviews)</span>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{shop.address}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/shop/${shop.shop_id}`}
                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-medium text-center hover:shadow-md transition-all"
                      >
                        View Shop
                      </Link>
                      <a
                        href={`tel:${shop.phone}`}
                        className="p-1.5 border border-gray-200/20 rounded-lg hover:bg-gray-500/10 transition-colors"
                      >
                        <Phone className="h-4 w-4 text-[var(--text-gray)]" />
                      </a>
                      <button
                        onClick={() => removeFollowed(shop.shop_id)}
                        disabled={removing === shop.shop_id}
                        className="p-1.5 border border-gray-200/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-colors"
                      >
                        {removing === shop.shop_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
