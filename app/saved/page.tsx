"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Heart, 
  ArrowLeft, 
  Package, 
  MapPin, 
  Trash2,
  Loader2,
  AlertCircle,
  Store
} from "lucide-react";

interface SavedProduct {
  id: string;
  product_id?: string;
  name: string;
  product_name?: string;
  product_name_mm?: string;
  price: number;
  currency: string;
  image_urls: string[];
  shop_id: string;
  shop_name: string;
  shop_name_mm?: string;
  saved_at: string;
}

export default function SavedProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // Load saved products from localStorage on mount
  useEffect(() => {
    const loadSavedProducts = async () => {
      if (!user?.uid) {
        setSavedProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get saved product IDs from localStorage (user-specific)
        const savedIds = JSON.parse(localStorage.getItem(`savedProducts_${user.uid}`) || "[]");
        
        if (savedIds.length === 0) {
          setSavedProducts([]);
          setLoading(false);
          return;
        }

        // Fetch details for each saved product
        const products: SavedProduct[] = [];
        for (const id of savedIds) {
          try {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
              const data = await res.json();
              products.push({
                ...data.data,
                saved_at: id.saved_at || new Date().toISOString(),
              });
            }
          } catch {
            // Skip failed products
          }
        }
        
        setSavedProducts(products);
      } catch {
        setError("Failed to load saved products");
      } finally {
        setLoading(false);
      }
    };

    loadSavedProducts();
  }, [user?.uid]);

  // Remove product from saved list
  const removeSaved = (productId: string) => {
    if (!productId || !user?.uid) return;
    setRemoving(productId);
    
    // Update localStorage (user-specific)
    const savedIds = JSON.parse(localStorage.getItem(`savedProducts_${user.uid}`) || "[]");
    const updated = savedIds.filter((id: string) => id !== productId);
    localStorage.setItem(`savedProducts_${user.uid}`, JSON.stringify(updated));
    
    // Update state
    setSavedProducts(savedProducts.filter(p => (p.id || p.product_id) !== productId));
    setRemoving(null);
  };

  // Clear all saved products
  const clearAll = () => {
    if (!user?.uid) return;
    if (confirm("Are you sure you want to remove all saved products?")) {
      localStorage.removeItem(`savedProducts_${user.uid}`);
      setSavedProducts([]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card-bg)] border-b border-gray-200/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-500/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[var(--text-dark)]" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-dark)]">Saved Products</h1>
              <p className="text-sm text-[var(--text-gray)]">Your wishlist</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
          </div>
        ) : savedProducts.length === 0 ? (
          <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-gray-200/20">
            <Heart className="h-16 w-16 text-[var(--text-gray)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-dark)] mb-2">No saved products yet</h3>
            <p className="text-[var(--text-gray)] mb-4">Save products you like to view them later</p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[var(--text-gray)]">
                {savedProducts.length} product{savedProducts.length !== 1 ? "s" : ""} saved
              </p>
              <button
                onClick={clearAll}
                className="text-red-500 text-sm font-medium hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((product) => (
                <div
                  key={product.id || product.product_id}
                  className="bg-[var(--card-bg)] rounded-xl border border-gray-200/20 overflow-hidden group"
                >
                  {/* Product Image */}
                  <Link href={`/product/${product.id || product.product_id}`} className="block relative">
                    <div className="aspect-square bg-[var(--background)]">
                      {product.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.product_name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link href={`/product/${product.id || product.product_id}`}>
                      <h3 className="font-medium text-[var(--text-dark)] mb-1 line-clamp-2 hover:text-[#667eea] transition-colors">
                        {product.name || product.product_name}
                      </h3>
                    </Link>
                    
                    <p className="text-[#667eea] font-bold text-lg mb-2">
                      {product.price?.toLocaleString()} {product.currency}
                    </p>

                    {/* Shop Info */}
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <Store className="h-3.5 w-3.5" />
                      <span className="truncate">{product.shop_name}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/product/${product.id || product.product_id}`}
                        className="flex-1 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-medium text-center"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => removeSaved(product.id || product.product_id || '')}
                        disabled={removing === (product.id || product.product_id)}
                        className="p-2 border border-gray-200/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-colors"
                      >
                        {removing === (product.id || product.product_id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
