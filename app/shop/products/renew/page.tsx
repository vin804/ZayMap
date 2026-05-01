"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  ArrowLeft,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock
} from "lucide-react";

interface Product {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  image_urls: string[];
  price?: number;
  updated_at?: string;
  created_at: string;
}

export default function RenewProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // Fetch shop
        const shopRes = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (!shopRes.ok) {
          router.push("/onboarding/shop-registration");
          return;
        }
        const shopData = await shopRes.json();
        const shopId = shopData.data.shop_id;

        // Fetch products
        const productsRes = await fetch(`/api/shops/${shopId}/products`);
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.data?.products || []);
        }
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user?.uid, router]);

  // Toggle individual product selection
  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Select/deselect all products
  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.product_id)));
    }
  };

  // Get relative time display
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Renew selected products
  const handleRenew = async () => {
    if (selectedProducts.size === 0) {
      setError("Please select at least one product to renew");
      return;
    }

    setRenewing(true);
    setError(null);
    setSuccess(null);

    try {
      const promises = Array.from(selectedProducts).map(async (productId) => {
        const res = await fetch(`/api/products/${productId}/renew`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to renew product ${productId}`);
        return res.json();
      });

      await Promise.all(promises);
      
      // Update local state to reflect new timestamps
      const now = new Date().toISOString();
      setProducts(products.map(p => 
        selectedProducts.has(p.product_id) 
          ? { ...p, updated_at: now }
          : p
      ));
      
      setSuccess(`Successfully renewed ${selectedProducts.size} product(s)`);
      setSelectedProducts(new Set());
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to renew some products. Please try again.");
    } finally {
      setRenewing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/shop/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">Renew Products</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">What is Renew?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Renewing a product updates its timestamp to show customers that the item is still in stock. 
                  The product will display as "updated today" or "updated X days ago" instead of its original upload date.
                </p>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-600 mb-4">Add some products first to renew them</p>
              <button
                onClick={() => router.push("/shop/products/add")}
                className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
              >
                Add Product
              </button>
            </div>
          ) : (
            <>
              {/* Actions Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]"
                      />
                      <span className="text-sm font-medium">
                        {selectedProducts.size === products.length ? "Deselect All" : "Select All"}
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      ({selectedProducts.size} selected)
                    </span>
                  </div>
                  
                  <button
                    onClick={handleRenew}
                    disabled={renewing || selectedProducts.size === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {renewing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Renewing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Renew Selected
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const isSelected = selectedProducts.has(product.product_id);
                    const lastUpdated = product.updated_at || product.created_at;
                    const isRecentlyUpdated = new Date().getTime() - new Date(lastUpdated).getTime() < 24 * 60 * 60 * 1000;
                    
                    return (
                      <div
                        key={product.product_id}
                        className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => toggleProduct(product.product_id)}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product.product_id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]"
                          />
                        </div>

                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.image_urls?.[0] ? (
                            <img
                              src={product.image_urls[0]}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.product_name}
                          </h3>
                          <p className="text-sm text-[#667eea] font-semibold">
                            {product.price?.toLocaleString() || "0"} MMK
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {isRecentlyUpdated ? (
                                <span className="text-green-600 font-medium">Updated {getRelativeTime(lastUpdated)}</span>
                              ) : (
                                `Updated ${getRelativeTime(lastUpdated)}`
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {isRecentlyUpdated ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                              Fresh
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                              Needs Renew
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
