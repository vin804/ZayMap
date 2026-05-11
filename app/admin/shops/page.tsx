"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Store,
  Search,
  Trash2,
  ExternalLink,
  Star,
  MapPin,
  Phone,
  Package,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Shield,
  LogOut,
  Plus,
  Link2,
  Copy,
  Check,
} from "lucide-react";

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  category_label: string;
  rating: number;
  review_count: number;
  delivery_available: boolean;
  logo_url: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  created_at: string;
  product_count: number;
  owner_id: string;
  claim_token?: string;
  status?: string;
}

export default function AdminShopsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/shops");
      if (!res.ok) throw new Error("Failed to fetch shops");
      const data = await res.json();
      setShops(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shopId: string, shopName: string) => {
    if (!confirm(`Delete "${shopName}"? This cannot be undone.`)) return;
    setDeletingId(shopId);
    try {
      const res = await fetch(`/api/shops/${shopId}/delete`, { method: "DELETE" });
      if (res.ok) {
        setShops((prev) => prev.filter((s) => s.shop_id !== shopId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete shop");
      }
    } catch {
      alert("Failed to delete shop");
    } finally {
      setDeletingId(null);
    }
  };

  const copyClaimLink = (token: string) => {
    const url = `${window.location.origin}/claim/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.name_mm?.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term) ||
        s.phone.includes(term)
    );
  }, [shops, search]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-50 bg-[var(--bg-elevated)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="btn-ghost w-9 h-9 flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--fg)]">Shop Management</h1>
                <p className="text-xs text-[var(--fg-muted)]">{shops.length} shops</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/admin/shops/create")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Create Shop
              </button>
              <button
                onClick={() => router.push("/map")}
                className="btn-outline text-sm px-4 py-2"
              >
                Back to App
              </button>
              <button
                onClick={logout}
                className="btn-ghost w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-500/10"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
          <input
            type="text"
            placeholder="Search shops by name, address, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button onClick={fetchShops} className="ml-auto text-sm underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="h-12 w-12 text-[var(--fg-muted)] mx-auto mb-4" />
            <p className="text-[var(--fg-muted)]">
              {search ? "No shops match your search" : "No shops found"}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[0_4px_16px_rgba(15,17,26,0.05)] overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px_160px] gap-4 px-5 py-3 border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              <span>Shop</span>
              <span>Category</span>
              <span>Rating</span>
              <span>Products</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {filtered.map((shop) => (
                <div
                  key={shop.shop_id}
                  className="grid md:grid-cols-[1fr_120px_100px_100px_160px] gap-3 px-5 py-4 items-center hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {shop.logo_url ? (
                        <img
                          src={shop.logo_url}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-5 w-5 text-[var(--fg-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-[var(--fg)] truncate">
                          {shop.name}
                        </p>
                        {shop.status === "unclaimed" ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-semibold border border-amber-500/20">Unclaimed</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold border border-emerald-500/20">Claimed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--fg-muted)]">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{shop.address || "No address"}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--fg-muted)] md:hidden">
                        <Phone className="h-3 w-3" />
                        <span>{shop.phone || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <span className="badge badge-neutral text-xs">
                      {shop.category_label}
                    </span>
                    {shop.delivery_available && (
                      <span className="badge badge-green text-xs ml-1.5">Delivery</span>
                    )}
                  </div>

                  <div className="hidden md:flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-[var(--fg)]">
                      {shop.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-[var(--fg-muted)]">
                      ({shop.review_count})
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                    <span className="text-sm text-[var(--fg)]">{shop.product_count}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {shop.status === "unclaimed" && shop.claim_token && (
                      <button
                        onClick={() => copyClaimLink(shop.claim_token!)}
                        className={`btn-ghost w-8 h-8 flex items-center justify-center ${
                          copiedId === shop.claim_token
                            ? "text-emerald-500"
                            : "text-[#667eea]"
                        }`}
                        title="Copy claim link"
                      >
                        {copiedId === shop.claim_token ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/shop/${shop.shop_id}`)}
                      className="btn-ghost w-8 h-8 flex items-center justify-center"
                      title="View public page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/shop/${shop.shop_id}/edit`)}
                      className="btn-ghost w-8 h-8 flex items-center justify-center"
                      title="Edit shop"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(shop.shop_id, shop.name)}
                      disabled={deletingId === shop.shop_id}
                      className="btn-ghost w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      title="Delete shop"
                    >
                      {deletingId === shop.shop_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}