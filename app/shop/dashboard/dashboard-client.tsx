"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Store, Package, Settings, Plus, Edit, MapPin, Phone, Calendar, ChevronRight, Loader2,
  AlertCircle, Star, ArrowLeft, LogOut, Trash2, X, RefreshCw, Grid3X3, List,
  Eye, ChevronUp, ChevronDown, Pencil, Check, Users,
} from "lucide-react";

interface Category {
  id: string;
  name?: string;
  name_mm?: string;
  icon?: string;
  order_index: number;
}

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  logo_url?: string;
  phone: string;
  address: string;
  delivery_available: boolean;
  rating: number;
  products_count: number;
  created_at: string;
  facebook?: string;
  tiktok?: string;
  review_count: number;
  categories?: Category[];
}

interface Product {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  image_urls: string[];
  price?: number;
  freshness_status: "green" | "orange" | "red";
  created_at: string;
  category_id?: string;
}

const CATEGORIES: Record<string, string> = {
  clothes: "👕 Clothes", electronics: "📱 Electronics", food: "🍜 Food",
  cosmetics: "💄 Cosmetics", second_hand: "♻️ Second-hand", other: "🏪 Other",
};

const FRESHNESS_STYLES = {
  green: { label: "New", bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
  orange: { label: "Recent", bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  red: { label: "Old", bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
};

export default function ShopDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminShopId = searchParams.get("shop");
  const { user, logout, initializing } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [newCategory, setNewCategory] = useState({ name: "", name_mm: "", icon: "📦" });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState({ name: "", name_mm: "", icon: "" });
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Helper to build edit URLs with admin shop param
  const getEditUrl = (productId: string) => {
    return adminShopId
      ? `/shop/products/${productId}/edit?shop=${adminShopId}`
      : `/shop/products/${productId}/edit`;
  };

  const handleDeleteShop = async () => {
    if (!shop) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shops/${shop.shop_id}/delete`, {
        method: "DELETE",
        headers: { "x-user-id": user?.uid || "" },
      });
      if (res.ok) {
        // Force full page reload to clear all caches
        if (adminShopId) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/map";
        }
      }
      else {
        const data = await res.json();
        setError(data.error || "Failed to delete shop");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Failed to delete shop");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
     }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete product");
      }
    } catch {
      setError("Failed to delete product");
    }
  };

    useEffect(() => { fetchShopData(); }, [user?.uid, adminShopId]);

  const fetchShopData = async () => {
    if (!user?.uid) { setLoading(false); return; }
    try {
      setLoading(true);
      
      // Admin viewing a specific shop via ?shop=SHOP_ID
      let response;
      if (adminShopId) {
        response = await fetch(`/api/shops/${adminShopId}`);
      } else {
        response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
      }
      if (response.status === 404) { setShop(null); setLoading(false); return; }
      if (!response.ok) throw new Error("Failed to fetch shop data");
      const data = await response.json();
      const userShop = data.data;
      if (userShop) {
        setShop(userShop);
        const productsRes = await fetch(`/api/shops/${userShop.shop_id}/products`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.data?.products || []);
        }
      }
    } catch { setError("Failed to load shop data"); }
    finally { setLoading(false); }
  };

  const addCategory = async () => {
    if (!shop?.shop_id || !user?.uid) { setCategoryError("Shop or user not loaded"); return; }
    if (!newCategory.name.trim() && !newCategory.name_mm.trim()) { setCategoryError("Please enter at least one name"); return; }
    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.name, name_mm: newCategory.name_mm, icon: newCategory.icon, userId: user.uid }),
      });
      if (response.ok) {
        const data = await response.json();
        setShop(prev => prev ? { ...prev, categories: [...(prev.categories || []), data.data] } : null);
        setNewCategory({ name: "", name_mm: "", icon: "📦" });
        setCategoryError(null);
      } else {
        const errorData = await response.json();
        setCategoryError(errorData.error || "Failed to add category");
      }
    } catch { setCategoryError("Network error"); }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setEditCategoryData({ name: category.name || "", name_mm: category.name_mm || "", icon: category.icon || "📦" });
  };

  const saveEditCategory = async () => {
    if (!shop?.shop_id || !user?.uid || !editingCategory) return;
    if (!editCategoryData.name.trim() && !editCategoryData.name_mm.trim()) return;
    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: editingCategory, name: editCategoryData.name, name_mm: editCategoryData.name_mm, icon: editCategoryData.icon, userId: user.uid }),
      });
      if (response.ok) {
        const data = await response.json();
        setShop(prev => prev ? { ...prev, categories: prev.categories?.map(cat => cat.id === editingCategory ? data.data : cat) || [] } : null);
        setEditingCategory(null); setCategoryError(null);
      } else {
        const errData = await response.json().catch(() => ({ error: "Failed to update category" }));
        setCategoryError(errData.error || "Failed to update category");
      }
    } catch { setCategoryError("Failed to update category"); }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!shop?.shop_id || !user?.uid) return;
    const category = shop.categories?.find(c => c.id === categoryId);
    if (!category) return;
    if (!confirm(`Delete "${category.name || category.name_mm}"? Products will become uncategorized.`)) return;
    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories?categoryId=${categoryId}&userId=${user.uid}`, { method: "DELETE" });
      if (response.ok) {
        setShop(prev => prev ? { ...prev, categories: prev.categories?.filter(cat => cat.id !== categoryId) || [] } : null);
        setCategoryError(null);
      } else { setCategoryError("Failed to delete category"); }
    } catch { setCategoryError("Failed to delete category"); }
  };

  const moveCategory = async (index: number, direction: number) => {
    if (!shop?.shop_id || !user?.uid || !shop.categories) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= shop.categories.length) return;
    const newCategories = [...shop.categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    const reordered = newCategories.map((cat, idx) => ({ ...cat, order_index: idx }));
    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories/reorder`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: reordered.map(cat => cat.id), userId: user.uid }),
      });
      if (response.ok) setShop(prev => prev ? { ...prev, categories: reordered } : null);
      else setCategoryError("Failed to reorder categories");
    } catch { setCategoryError("Failed to reorder categories"); }
  };
  // Auth initializing guard — prevents "Shop not found" flash on refresh
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] animate-pulse" />
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }} />
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Skeleton Header */}
        <div className="sticky top-0 z-50 bg-[var(--bg-elevated)]/80 backdrop-blur-xl border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-5 w-32 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-xl animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-9 w-9 rounded-xl animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-9 w-9 rounded-xl animate-pulse bg-[var(--bg-hover)]" />
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Skeleton Shop Card */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex gap-5">
              <div className="h-20 w-20 rounded-2xl animate-pulse bg-[var(--bg-hover)] flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-4 w-32 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 rounded-full animate-pulse bg-[var(--bg-hover)]" />
                  <div className="h-6 w-20 rounded-full animate-pulse bg-[var(--bg-hover)]" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
                  <div className="h-4 w-full rounded animate-pulse bg-[var(--bg-hover)]" />
                  <div className="h-4 w-full rounded animate-pulse bg-[var(--bg-hover)]" />
                  <div className="h-4 w-full rounded animate-pulse bg-[var(--bg-hover)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-5 last:col-span-2 md:last:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl animate-pulse bg-[var(--bg-hover)]" />
                  <div className="h-3 w-16 rounded animate-pulse bg-[var(--bg-hover)]" />
                </div>
                <div className="h-8 w-12 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
              </div>
            ))}
          </div>

          {/* Skeleton Products */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-3 w-48 rounded animate-pulse bg-[var(--bg-hover)]" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-9 w-9 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                <div className="h-9 w-20 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
              </div>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl animate-pulse bg-[var(--bg-hover)] flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded animate-pulse bg-[var(--bg-hover)]" />
                    <div className="flex gap-2">
                      <div className="h-3 w-24 rounded animate-pulse bg-[var(--bg-hover)]" />
                      <div className="h-5 w-12 rounded-full animate-pulse bg-[var(--bg-hover)]" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-8 w-8 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                    <div className="h-8 w-8 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--fg)] mb-2">{error || "Shop not found"}</h1>
          <p className="text-[var(--fg-muted)] mb-6">Let&apos;s set up your shop first.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/onboarding/shop-registration")} className="btn-gradient px-6 py-3">
              Register Shop
            </button>
            <button onClick={() => router.push("/map")} className="btn-outline px-6 py-3">
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Glass Header */}
        <header className="sticky top-0 z-50 bg-[var(--bg-elevated)]/80 backdrop-blur-xl border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
<button
  onClick={() => router.push(adminShopId ? "/admin" : "/map")}
  className="btn-ghost w-9 h-9 flex items-center justify-center"
>
  <ArrowLeft className="h-5 w-5" />
</button>
                <h1 className="text-lg font-bold text-[var(--fg)]">Shop Dashboard</h1>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-500/10" title="Delete Shop">
                  <Trash2 className="h-5 w-5" />
                </button>
                <button onClick={() => router.push(adminShopId ? `/shop/settings?shop=${adminShopId}` : "/shop/settings")} className="btn-ghost w-9 h-9 flex items-center justify-center" title="Shop Settings">
                  <Settings className="h-5 w-5" />
                </button>
                <button onClick={logout} className="btn-ghost w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-500/10" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 max-w-sm w-full border border-[var(--border)] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--fg)]">Delete Shop?</h3>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost w-8 h-8">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-[var(--fg-muted)] mb-6 text-sm">Are you sure you want to delete &quot;{shop?.name}&quot;? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-outline flex-1 py-2.5">Cancel</button>
                <button onClick={handleDeleteShop} disabled={deleting} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Shop Info Card */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[0_4px_16px_rgba(15,17,26,0.05)] p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-5">
              <img src={shop.logo_url || "/logo.png"} alt={shop.name} className="w-20 h-20 rounded-2xl object-cover border border-[var(--border)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--fg)]">{shop.name}</h2>
                    {shop.name_mm && <p className="text-sm text-[var(--fg-muted)]">{shop.name_mm}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="badge badge-neutral">{CATEGORIES[shop.category] || shop.category}</span>
                      {shop.delivery_available && <span className="badge badge-green">Delivery</span>}
                      <span className="flex items-center gap-1 text-sm text-yellow-500"><Star className="h-3.5 w-3.5 fill-current" />{shop.rating?.toFixed(1) || "0.0"}</span>
                      {(shop.facebook || shop.tiktok) && (
                        <div className="flex items-center gap-1.5 ml-1">
                          {shop.facebook && (
                            <a href={shop.facebook.startsWith('http') ? shop.facebook : `https://${shop.facebook}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                          )}
                          {shop.tiktok && (
                            <a href={shop.tiktok.startsWith('http') ? shop.tiktok : `https://tiktok.com/@${shop.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => router.push(`/shop/${shop.shop_id}`)} className="btn-outline text-sm px-4 py-2">View Public Page</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]"><MapPin className="h-4 w-4" /><span className="truncate">{shop.address}</span></div>
                  <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]"><Phone className="h-4 w-4" /><span>{shop.phone}</span></div>
                  <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]"><Calendar className="h-4 w-4" /><span>Since {new Date(shop.created_at).toLocaleDateString()}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Products", value: products.length, icon: Package, color: "from-green-500 to-emerald-600" },
              { label: "Rating", value: shop.rating?.toFixed(1) || "0.0", icon: Star, color: "from-yellow-500 to-amber-600" },
              { label: "Reviews", value: shop.review_count || 0, icon: Users, color: "from-[#667eea] to-[#764ba2]" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-5 shadow-[0_4px_16px_rgba(15,17,26,0.05)] last:col-span-2 md:last:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold text-[var(--fg)]">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[0_4px_16px_rgba(15,17,26,0.05)] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--fg)]">Product Categories</h3>
              <span className="text-xs text-[var(--fg-muted)]">{shop.categories?.length || 0} categories</span>
            </div>
            {categoryError && <div className="alert alert-error text-sm mb-4"><span>{categoryError}</span></div>}
            {shop.categories && shop.categories.length > 0 ? (
              <div className="space-y-2 mb-4">
                {shop.categories.map((category, index) => (
                  <div key={category.id} className="flex items-center gap-2 p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)]">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveCategory(index, -1)} disabled={index === 0} className="p-0.5 rounded hover:bg-[var(--border-hover)] disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></button>
                      <button onClick={() => moveCategory(index, 1)} disabled={index === shop.categories!.length - 1} className="p-0.5 rounded hover:bg-[var(--border-hover)] disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></button>
                    </div>
                    <span className="text-xl">{category.icon || "📦"}</span>
                                        {editingCategory === category.id ? (
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_60px_40px_40px] gap-2 items-center">
                        <input
                          type="text"
                          value={editCategoryData.name}
                          onChange={(e) => setEditCategoryData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="English name"
                          className="input-field text-sm py-2"
                        />
                        <input
                          type="text"
                          value={editCategoryData.name_mm}
                          onChange={(e) => setEditCategoryData(prev => ({ ...prev, name_mm: e.target.value }))}
                          placeholder="Myanmar name"
                          className="input-field text-sm py-2"
                        />
                        <input
                          type="text"
                          value={editCategoryData.icon}
                          onChange={(e) => setEditCategoryData(prev => ({ ...prev, icon: e.target.value }))}
                          className="input-field text-center text-sm py-2"
                        />
                        <button onClick={saveEditCategory} className="h-9 w-9 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingCategory(null)} className="h-9 w-9 bg-[var(--bg-hover)] text-[var(--fg-muted)] rounded-lg hover:bg-[var(--border-hover)] flex items-center justify-center">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[var(--fg)] truncate">{category.name}{category.name_mm && <span className="text-[var(--fg-muted)] ml-1">/ {category.name_mm}</span>}</p></div>
                        <button onClick={() => startEditCategory(category)} className="btn-ghost w-8 h-8"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => deleteCategory(category.id)} className="btn-ghost w-8 h-8 text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-[var(--fg-muted)] mb-4">No categories yet. Add categories to organize your products.</p>}
            <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-3">Add New Category</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={newCategory.name} onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))} placeholder="Name (EN)" className="input-field flex-1 text-sm" />
                <input type="text" value={newCategory.name_mm} onChange={(e) => setNewCategory(prev => ({ ...prev, name_mm: e.target.value }))} placeholder="Name (MM)" className="input-field flex-1 text-sm" />
                <div className="flex gap-2">
                  <input type="text" value={newCategory.icon} onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))} className="input-field w-14 text-center text-sm" />
                  <button onClick={addCategory} disabled={!newCategory.name.trim() && !newCategory.name_mm.trim()} className="btn-gradient px-3"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[0_4px_16px_rgba(15,17,26,0.05)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--fg)]">Your Products</h3>
                  <p className="text-xs text-[var(--fg-muted)]">Manage your product listings</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[var(--bg-hover)] rounded-lg p-1">
                    <button onClick={() => setViewMode("list")} className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--bg-elevated)] shadow-sm" : "hover:bg-[var(--border-hover)]"}`}><List className="h-4 w-4 text-[var(--fg-muted)]" /></button>
                    <button onClick={() => setViewMode("grid")} className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--bg-elevated)] shadow-sm" : "hover:bg-[var(--border-hover)]"}`}><Grid3X3 className="h-4 w-4 text-[var(--fg-muted)]" /></button>
                  </div>
                  <button onClick={() => router.push(adminShopId ? `/shop/products/renew?shop=${adminShopId}` : "/shop/products/renew")} className="btn-outline text-sm px-3 py-2"><RefreshCw className="h-4 w-4" /></button>
                  <button onClick={() => router.push(adminShopId ? `/shop/products/add?shop=${adminShopId}` : "/shop/products/add")} className="btn-gradient text-sm px-4 py-2"><Plus className="h-4 w-4" /> Add</button>
                </div>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-[var(--fg-dim)]" />
                </div>
                <h4 className="text-base font-semibold text-[var(--fg)] mb-1">No products yet</h4>
                <p className="text-sm text-[var(--fg-muted)] mb-4">Start selling by adding your first product</p>
                <button onClick={() => router.push(adminShopId ? `/shop/products/add?shop=${adminShopId}` : "/shop/products/add")} className="btn-gradient px-6 py-3">Add First Product</button>
              </div>
            ) : viewMode === "list" ? (
              <div className="divide-y divide-[var(--border)]">
                {products.map((product) => {
                  const f = FRESHNESS_STYLES[product.freshness_status] || FRESHNESS_STYLES.red;
                  return (
                    <div key={product.product_id} className="p-4 flex items-center gap-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer" onClick={() => router.push(getEditUrl(product.product_id))}>
                      <div className="w-14 h-14 bg-[var(--bg)] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--border)]">
                        {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.product_name} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-[var(--fg-dim)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-[var(--fg)] truncate">{product.product_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[var(--fg-muted)]">{product.price?.toLocaleString() || "0"} MMK</span>
                          <span className="badge" style={{ background: f.bg, color: f.text, border: `1px solid ${f.border}` }}>{f.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); router.push(getEditUrl(product.product_id)); }} className="btn-ghost w-8 h-8" title="Edit"><Edit className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.product_id}`); }} className="btn-ghost w-8 h-8" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.product_id, product.product_name); }} className="btn-ghost w-8 h-8 text-red-500 hover:bg-red-500/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => {
                  const f = FRESHNESS_STYLES[product.freshness_status] || FRESHNESS_STYLES.red;
                  return (
                    <div key={product.product_id} className="group bg-[var(--bg)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-[0_12px_32px_rgba(15,17,26,0.06)] transition-all cursor-pointer" onClick={() => router.push(getEditUrl(product.product_id))}>
                      <div className="aspect-square bg-[var(--bg)] flex items-center justify-center overflow-hidden relative">
                        {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Package className="h-10 w-10 text-[var(--fg-dim)]" />}
                        <span className="absolute top-2 left-2 badge" style={{ background: f.bg, color: f.text, border: `1px solid ${f.border}` }}>{f.label}</span>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); router.push(getEditUrl(product.product_id)); }} className="p-2 bg-white rounded-full hover:bg-gray-100"><Edit className="h-4 w-4 text-gray-700" /></button>
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.product_id}`); }} className="p-2 bg-white rounded-full hover:bg-gray-100"><Eye className="h-4 w-4 text-gray-700" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.product_id, product.product_name); }} className="p-2 bg-red-500 rounded-full hover:bg-red-600"><Trash2 className="h-4 w-4 text-white" /></button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-[var(--fg)] truncate">{product.product_name}</h4>
                        <p className="text-sm text-[var(--fg-muted)] mt-1">{product.price?.toLocaleString() || "0"} MMK</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}