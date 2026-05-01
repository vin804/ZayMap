"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Store,
  Package,
  TrendingUp,
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
  RefreshCw
} from "lucide-react";

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
}

interface Product {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  image_urls: string[];
  price?: number;
  freshness_status: "green" | "orange" | "red";
  created_at: string;
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
  const [stats, setStats] = useState({
    totalViews: 0,
  });

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

        // Calculate stats
        setStats({
          totalViews: userShop.views || 0,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea] mx-auto mb-4" />
          <p className="text-gray-600">Loading your shop...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Shop not found"}
          </h1>
          <p className="text-gray-600 mb-6">Let&apos;s set up your shop first.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/onboarding/shop-registration")}
              className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
            >
              Register Shop
            </button>
            <button
              onClick={() => router.push("/map")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/map")}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Shop Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  title="Delete Shop"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push("/shop/settings")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Shop Settings"
                >
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Shop?</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{shop?.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Shop Logo */}
              <div className="w-24 h-24 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center flex-shrink-0">
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
                    <h2 className="text-2xl font-bold text-gray-900">{shop.name}</h2>
                    {shop.name_mm && (
                      <p className="text-gray-600">{shop.name_mm}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="px-3 py-1 bg-gray-100 rounded-full">
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
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/shop/${shop.shop_id}`)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Public Page
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Since {new Date(shop.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Total Views</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Products</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Products</h3>
                  <p className="text-sm text-gray-600">Manage your product listings</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/shop/products/renew")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renew
                  </button>
                  <button
                    onClick={() => router.push("/shop/products/add")}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
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
                  className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/shop/products/${product.product_id}/edit`)}
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {product.product_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${getFreshnessBadge(
                            product.freshness_status
                          )}`}
                        />
                        <span className="text-sm text-gray-500">
                          {product.price?.toLocaleString() || "0"} MMK
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
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
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
