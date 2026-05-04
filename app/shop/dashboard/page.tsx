"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Store,
  Package,
  Settings,
  Plus,
  Edit,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Star,
  ArrowLeft,
  LogOut,
  Trash2,
  X,
  RefreshCw,
  Grid3X3,
  List,
  ShoppingCart,
  Heart,
  Eye,
  Activity,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock
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
  clothes: "👕 Clothes",
  electronics: "📱 Electronics",
  food: "🍜 Food",
  cosmetics: "💄 Cosmetics",
  second_hand: "♻️ Second-hand",
  other: "🏪 Other",
};

export default function ShopDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [stats, setStats] = useState({
    totalReviews: 0,
  });

  // Category management state
  const [newCategory, setNewCategory] = useState({ name: "", name_mm: "", icon: "📦" });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState({ name: "", name_mm: "", icon: "" });
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Handle shop deletion
  const handleDeleteShop = async () => {
    if (!shop) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/shops/${shop.shop_id}/delete`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        router.push("/map");
      } else {
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

  useEffect(() => {
    fetchShopData();
  }, [user?.uid]);

  const fetchShopData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch shop by owner_id
      const response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);

      if (response.status === 404) {
        // No shop found - show registration prompt
        setShop(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch shop data");
      }

      const data = await response.json();
      const userShop = data.data;
      
      if (userShop) {
        setShop(userShop);
        
        // Fetch products for this shop
        const productsRes = await fetch(`/api/shops/${userShop.shop_id}/products`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.data?.products || []);
        }

        // Calculate stats from real data
        setStats({
          totalReviews: userShop.review_count || 0,
        });
      }
    } catch (err) {
      setError("Failed to load shop data");
    } finally {
      setLoading(false);
    }
  };

  const getFreshnessBadge = (status: string) => {
    const colors = {
      green: "bg-green-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-400";
  };

  const getFreshnessLabel = (status: string) => {
    const labels = {
      green: "New",
      orange: "Recent",
      red: "Old",
    };
    return labels[status as keyof typeof labels] || "";
  };

  // Category management functions
  const addCategory = async () => {
    console.log("addCategory called:", { shopId: shop?.shop_id, userId: user?.uid, newCategory });
    if (!shop?.shop_id || !user?.uid) {
      console.error("Missing shop_id or user.uid");
      setCategoryError("Shop or user not loaded");
      return;
    }
    if (!newCategory.name.trim() && !newCategory.name_mm.trim()) {
      setCategoryError("Please enter at least one name");
      return;
    }

    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategory.name,
          name_mm: newCategory.name_mm,
          icon: newCategory.icon,
          userId: user.uid,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShop(prev => prev ? {
          ...prev,
          categories: [...(prev.categories || []), data.data],
        } : null);
        setNewCategory({ name: "", name_mm: "", icon: "📦" });
        setCategoryError(null);
      } else {
        const errorData = await response.json();
        console.error("Category creation failed:", { status: response.status, error: errorData });
        
        let errorMsg = errorData.error || "Failed to add category";
        if (response.status === 403) {
          errorMsg = "Authorization failed - you don't own this shop";
        } else if (response.status === 404) {
          errorMsg = "Shop not found";
        } else if (response.status === 500 && errorData.details) {
          errorMsg = `Server error: ${errorData.details}`;
        }
        
        setCategoryError(errorMsg);
      }
    } catch (err) {
      console.error("Category creation error:", err);
      setCategoryError("Network error - check console");
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setEditCategoryData({
      name: category.name || "",
      name_mm: category.name_mm || "",
      icon: category.icon || "📦",
    });
  };

  const saveEditCategory = async () => {
    if (!shop?.shop_id || !user?.uid || !editingCategory) return;
    if (!editCategoryData.name.trim() && !editCategoryData.name_mm.trim()) return;

    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editingCategory,
          name: editCategoryData.name,
          name_mm: editCategoryData.name_mm,
          icon: editCategoryData.icon,
          userId: user.uid,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShop(prev => prev ? {
          ...prev,
          categories: prev.categories?.map(cat =>
            cat.id === editingCategory ? data.data : cat
          ) || [],
        } : null);
        setEditingCategory(null);
        setCategoryError(null);
      } else {
        const error = await response.json();
        setCategoryError(error.error || "Failed to update category");
      }
    } catch {
      setCategoryError("Failed to update category");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!shop?.shop_id || !user?.uid) return;

    const category = shop.categories?.find(c => c.id === categoryId);
    if (!category) return;

    const confirmDelete = confirm(`Delete "${category.name || category.name_mm}"? Products in this category will become uncategorized.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `/api/shops/${shop.shop_id}/categories?categoryId=${categoryId}&userId=${user.uid}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setShop(prev => prev ? {
          ...prev,
          categories: prev.categories?.filter(cat => cat.id !== categoryId) || [],
        } : null);
        setCategoryError(null);
      } else {
        const error = await response.json();
        setCategoryError(error.error || "Failed to delete category");
      }
    } catch {
      setCategoryError("Failed to delete category");
    }
  };

  const moveCategory = async (index: number, direction: number) => {
    if (!shop?.shop_id || !user?.uid || !shop.categories) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= shop.categories.length) return;

    const newCategories = [...shop.categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[newIndex];
    newCategories[newIndex] = temp;

    const reorderedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      order_index: idx,
    }));

    try {
      const response = await fetch(`/api/shops/${shop.shop_id}/categories/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds: reorderedCategories.map(cat => cat.id),
          userId: user.uid,
        }),
      });

      if (response.ok) {
        setShop(prev => prev ? { ...prev, categories: reorderedCategories } : null);
      } else {
        setCategoryError("Failed to reorder categories");
      }
    } catch {
      setCategoryError("Failed to reorder categories");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea] mx-auto mb-4" />
          <p className="text-[var(--text-gray)]">Loading your shop...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[var(--text-dark)] mb-2">
            {error || "Shop not found"}
          </h1>
          <p className="text-[var(--text-gray)] mb-6">Let&apos;s set up your shop first.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/onboarding/shop-registration")}
              className="px-6 py-3 bg-[#667eea] text-white rounded-xl font-medium hover:bg-[#5a67d8] transition-colors"
            >
              Register Shop
            </button>
            <button
              onClick={() => router.push("/map")}
              className="px-6 py-3 border border-gray-200/20 text-[var(--text-dark)] rounded-xl font-medium hover:bg-gray-500/10"
            >
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="bg-[var(--card-bg)] border-b border-gray-200/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/map")}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-500/10 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-[var(--text-gray)]" />
                </button>
                <h1 className="text-xl font-semibold text-[var(--text-dark)]">Shop Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  title="Delete Shop"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push("/shop/settings")}
                  className="p-2 rounded-lg hover:bg-gray-500/10 transition-colors"
                  title="Shop Settings"
                >
                  <Settings className="h-5 w-5 text-[var(--text-gray)]" />
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-sm w-full border border-gray-200/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-dark)]">Delete Shop?</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1 rounded-full hover:bg-gray-500/10"
                >
                  <X className="h-5 w-5 text-[var(--text-gray)]" />
                </button>
              </div>
              <p className="text-[var(--text-gray)] mb-6">
                Are you sure you want to delete &quot;{shop?.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 border border-gray-200/20 rounded-xl font-medium text-[var(--text-dark)] hover:bg-gray-500/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteShop}
                  disabled={deleting}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Shop Info Card */}
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-gray-200/20 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Shop Logo */}
              <div className="w-24 h-24 bg-[#667eea] rounded-2xl flex items-center justify-center flex-shrink-0">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Store className="h-10 w-10 text-white" />
                )}
              </div>

              {/* Shop Details */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-dark)]">{shop.name}</h2>
                    {shop.name_mm && (
                      <p className="text-[var(--text-gray)]">{shop.name_mm}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-gray)]">
                      <span className="px-3 py-1 bg-gray-500/10 rounded-full">
                        {CATEGORIES[shop.category] || shop.category}
                      </span>
                      {shop.delivery_available && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                          Delivery Available
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{shop.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                      
                      {/* Social Media Icons */}
                      {(shop.facebook || shop.tiktok) && (
                        <div className="flex items-center gap-2 ml-2">
                          {shop.facebook && (
                            <a 
                              href={shop.facebook.startsWith('http') ? shop.facebook : `https://${shop.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:bg-[#166fe5] transition-colors"
                              title="Facebook"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </a>
                          )}
                          {shop.tiktok && (
                            <a 
                              href={shop.tiktok.startsWith('http') ? shop.tiktok : `https://tiktok.com/@${shop.tiktok.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
                              title="TikTok"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="white">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/shop/${shop.shop_id}`)}
                    className="px-4 py-2 border border-gray-200/20 rounded-xl text-sm font-medium text-[var(--text-dark)] hover:bg-gray-500/10 transition-colors"
                  >
                    View Public Page
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200/20">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-gray)]">
                    <Calendar className="h-4 w-4" />
                    <span>Since {new Date(shop.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Products */}
            <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-200/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm text-[var(--text-gray)]">Products</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{products.length}</p>
            </div>

            {/* Rating */}
            <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-200/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <span className="text-sm text-[var(--text-gray)]">Rating</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{shop.rating?.toFixed(1) || "0.0"}</p>
            </div>

            {/* Reviews */}
            <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-200/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-sm text-[var(--text-gray)]">Reviews</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{stats.totalReviews}</p>
            </div>
          </div>

          {/* Categories Management Section */}
          <div className="mt-8 mb-8 bg-[var(--card-bg)] rounded-2xl shadow-sm border border-gray-200/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-dark)]">
                Product Categories
              </h3>
              <span className="text-sm text-[var(--text-gray)]">
                {shop.categories?.length || 0} categories
              </span>
            </div>

            {/* Category Error Display */}
            {categoryError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{categoryError}</p>
              </div>
            )}

            {/* Category List */}
            {shop.categories && shop.categories.length > 0 ? (
              <div className="space-y-2 mb-4">
                {shop.categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-gray-500/5 rounded-lg border border-gray-200/20"
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveCategory(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-4 w-4 text-[var(--text-gray)]" />
                      </button>
                      <button
                        onClick={() => moveCategory(index, 1)}
                        disabled={index === shop.categories!.length - 1}
                        className="p-1 rounded hover:bg-gray-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-4 w-4 text-[var(--text-gray)]" />
                      </button>
                    </div>

                    {/* Category content */}
                    <span className="text-2xl">{category.icon || "📦"}</span>

                    {editingCategory === category.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editCategoryData.name}
                          onChange={(e) => setEditCategoryData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="English name"
                          className="flex-1 px-3 py-1.5 bg-[var(--card-bg)] border border-gray-200/20 rounded-lg text-sm text-[var(--text-dark)]"
                        />
                        <input
                          type="text"
                          value={editCategoryData.name_mm}
                          onChange={(e) => setEditCategoryData(prev => ({ ...prev, name_mm: e.target.value }))}
                          placeholder="Myanmar name"
                          className="flex-1 px-3 py-1.5 bg-[var(--card-bg)] border border-gray-200/20 rounded-lg text-sm text-[var(--text-dark)]"
                        />
                        <input
                          type="text"
                          value={editCategoryData.icon}
                          onChange={(e) => setEditCategoryData(prev => ({ ...prev, icon: e.target.value }))}
                          placeholder="Icon"
                          className="w-16 px-2 py-1.5 bg-[var(--card-bg)] border border-gray-200/20 rounded-lg text-center text-sm"
                        />
                        <button
                          onClick={saveEditCategory}
                          className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="p-2 bg-gray-500/10 text-gray-500 rounded-lg hover:bg-gray-500/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-dark)]">
                            {category.name}
                            {category.name_mm && (
                              <span className="text-[var(--text-gray)] ml-1">/ {category.name_mm}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => startEditCategory(category)}
                          className="p-2 hover:bg-gray-500/10 rounded-lg"
                        >
                          <Pencil className="h-4 w-4 text-[var(--text-gray)]" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-gray)] mb-4">
                No categories yet. Add categories to organize your products.
              </p>
            )}

            {/* Add new category */}
            <div className="bg-gray-500/5 rounded-lg p-4 border border-gray-200/20">
              <h4 className="text-sm font-medium text-[var(--text-dark)] mb-3">
                Add New Category
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name (EN)"
                  className="flex-1 px-3 py-2 bg-[var(--card-bg)] border border-gray-200/20 rounded-lg text-sm text-[var(--text-dark)]"
                />
                <input
                  type="text"
                  value={newCategory.name_mm}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name_mm: e.target.value }))}
                  placeholder="Category name (MM)"
                  className="flex-1 px-3 py-2 bg-[var(--card-bg)] border border-gray-200/20 rounded-lg text-sm text-[var(--text-dark)]"
                />
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="📦"
                  className="w-14 px-2 py-2 bg-[var(--card-bg)] border border-gray-200/20 rounded-lg text-center text-sm"
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategory.name.trim() && !newCategory.name_mm.trim()}
                  className="px-4 py-2 bg-[#667eea] text-white rounded-lg text-sm font-medium hover:bg-[#5a67d8] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--text-gray)] mt-2">
                At least one name (EN or MM) is required. Default icon is 📦.
              </p>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-gray-200/20">
            <div className="p-6 border-b border-gray-200/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-dark)]">Your Products</h3>
                  <p className="text-sm text-[var(--text-gray)]">Manage your product listings</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-500/10 rounded-lg p-1 mr-2">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--card-bg)] shadow-sm" : "hover:bg-gray-500/10"}`}
                      title="List View"
                    >
                      <List className="h-4 w-4 text-[var(--text-gray)]" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--card-bg)] shadow-sm" : "hover:bg-gray-500/10"}`}
                      title="Grid View"
                    >
                      <Grid3X3 className="h-4 w-4 text-[var(--text-gray)]" />
                    </button>
                  </div>
                  <button
                    onClick={() => router.push("/shop/products/renew")}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-gray-200/20 text-[var(--text-dark)] rounded-xl text-sm font-medium hover:bg-gray-500/10 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renew
                  </button>
                  <button
                    onClick={() => router.push("/shop/products/add")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white rounded-xl text-sm font-medium hover:bg-[#5a67d8] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No products yet</h4>
                <p className="text-gray-600 mb-4">Start selling by adding your first product</p>
                <button
                  onClick={() => router.push("/shop/products/add")}
                  className="px-6 py-3 bg-[#667eea] text-white rounded-xl font-medium hover:bg-[#5a67d8] transition-colors"
                >
                  Add First Product
                </button>
              </div>
            ) : viewMode === "list" ? (
              // List View
              <div className="divide-y divide-gray-100">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="p-4 flex items-center gap-4 hover:bg-gray-500/5 transition-colors cursor-pointer"
                    onClick={() => router.push(`/shop/products/${product.product_id}/edit`)}
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-[var(--background)] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200/20">
                      {product.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-[var(--text-gray)]" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[var(--text-dark)] truncate">
                        {product.product_name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-[var(--text-gray)]">
                          {product.price?.toLocaleString() || "0"} MMK
                        </span>
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          product.freshness_status === "green" 
                            ? "bg-green-500/10 text-green-500" 
                            : product.freshness_status === "orange"
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {getFreshnessLabel(product.freshness_status)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/shop/products/${product.product_id}/edit`);
                        }}
                        className="p-2 hover:bg-gray-500/10 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4 text-[var(--text-gray)]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/product/${product.product_id}`);
                        }}
                        className="p-2 hover:bg-gray-500/10 rounded-lg transition-colors"
                        title="View Product"
                      >
                        <Eye className="h-4 w-4 text-[var(--text-gray)]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Grid View
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="group bg-[var(--background)] rounded-xl border border-gray-200/20 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/shop/products/${product.product_id}/edit`)}
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-[var(--background)] flex items-center justify-center overflow-hidden relative">
                      {product.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.product_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-[var(--text-gray)]" />
                      )}
                      {/* Status Badge Overlay */}
                      <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs rounded-full ${
                        product.freshness_status === "green" 
                          ? "bg-green-500/90 text-white" 
                          : product.freshness_status === "orange"
                          ? "bg-orange-500/90 text-white"
                          : "bg-red-500/90 text-white"
                      }`}>
                        {getFreshnessLabel(product.freshness_status)}
                      </span>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/shop/products/${product.product_id}/edit`);
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/product/${product.product_id}`);
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    {/* Product Info */}
                    <div className="p-3">
                      <h4 className="font-medium text-[var(--text-dark)] truncate text-sm">
                        {product.product_name}
                      </h4>
                      <p className="text-sm text-[var(--text-gray)] mt-1">
                        {product.price?.toLocaleString() || "0"} MMK
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
