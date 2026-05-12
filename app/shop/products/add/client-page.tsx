"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { uploadImages } from "@/lib/upload";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2, Package, ArrowLeft, Upload, CheckCircle, AlertCircle, DollarSign, ImagePlus, X, Tag, FileText } from "lucide-react";

interface Category {
  id: string;
  name?: string;
  name_mm?: string;
  icon?: string;
  order_index: number;
}

interface ProductFormData {
  name: string;
  name_mm: string;
  description: string;
  price: number;
  category: string;
  category_id: string;
  images: File[];
}

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminShopId = searchParams.get("shop");
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    name_mm: "",
    description: "",
    price: 0,
    category: "other",
    category_id: "",
    images: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);

  // Compute correct dashboard return URL
  const dashboardUrl = adminShopId ? `/shop/dashboard?shop=${adminShopId}` : "/shop/dashboard";

  useEffect(() => {
    const fetchShop = async () => {
      if (!user?.uid) return;
      try {
        let response;
        if (adminShopId) {
          // Admin adding product to a specific shop
          response = await fetch(`/api/shops/${adminShopId}`);
        } else {
          // Owner adding product to their own shop
          response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        }

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setShopId(data.data.shop_id);
            setCategories(data.data.categories || []);
          }
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    };
    fetchShop();
  }, [user?.uid, adminShopId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 5) {
      setError("Maximum 5 images allowed");
      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files allowed");
        e.target.value = "";
        return;
      }
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setError(null);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      setError("Shop not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrls: string[] = [];

      if (formData.images.length > 0) {
        setUploadLoading(true);
        const uploadResult = await uploadImages(formData.images, "products");
        setUploadLoading(false);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        imageUrls = uploadResult.urls;
      }

      const response = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          product_name: formData.name,
          product_name_mm: formData.name_mm,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          image_urls: imageUrls,
          category_id: formData.category_id || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      setSuccess(true);
    } catch (err) {
      setUploadLoading(false);
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Product Added!</h1>
          <p className="text-[var(--fg-muted)] mb-8">Your product is now visible on the map.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push(dashboardUrl)} className="btn-gradient px-8 py-4">
              Back to Dashboard
            </button>
            <button onClick={() => {
              setSuccess(false);
              setFormData({ name: "", name_mm: "", description: "", price: 0, category: "other", category_id: "", images: [] });
              setImagePreviews([]);
            }} className="btn-outline px-8 py-4">
              Add Another
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
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(dashboardUrl)} className="btn-ghost w-9 h-9 flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-[var(--fg)]">Add New Product</h1>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  className="input-field !pl-10"
                  required
                />
              </div>
            </div>

            {/* Product Name (Myanmar) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Product Name (Myanmar) <span className="text-[var(--fg-dim)]">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.name_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                placeholder="မြန်မာဘာသာဖြင့် ထည့်ပါ"
                className="input-field"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Description <span className="text-[var(--fg-dim)]">(Optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--fg-dim)] z-10" />
                <AutoExpandingTextarea
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Describe your product..."
                  className="input-field !pl-10 resize-none overflow-hidden"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Product Price (MMK) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
                <input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === "" ? 0 : parseInt(value.replace(/^0+/, ""), 10) || 0;
                    setFormData(prev => ({ ...prev, price: numValue }));
                  }}
                  min={1}
                  placeholder="0"
                  className="input-field !pl-10"
                  required
                />
              </div>
              <p className="text-xs text-[var(--fg-muted)] mt-1.5">Actual price of the product.</p>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="select-field"
              >
                <option value="clothes">👕 Clothes</option>
                <option value="electronics">📱 Electronics</option>
                <option value="food">🍜 Food</option>
                <option value="cosmetics">💄 Cosmetics</option>
                <option value="second_hand">♻️ Second-hand</option>
                <option value="other">🏪 Other</option>
              </select>
            </div>

            {/* Shop Category */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                  Shop Category <span className="text-[var(--fg-dim)]">(Optional)</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="select-field"
                >
                  <option value="">-- Select a category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || "📦"} {cat.name || cat.name_mm || "Unnamed"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--fg-muted)] mt-1.5">Assign this product to a custom category.</p>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[var(--fg-muted)] mb-3">Upload up to 5 images (max 5MB each)</p>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded-xl border border-[var(--border)]" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imagePreviews.length < 5 && (
                <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--bg-hover)] transition-all">
                  <div className="text-center">
                    <ImagePlus className="h-8 w-8 text-[var(--fg-dim)] mx-auto mb-2" />
                    <span className="text-sm text-[var(--fg-muted)]">Add Photo</span>
                    <span className="text-xs text-[var(--fg-dim)] block mt-1">{imagePreviews.length}/5</span>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || uploadLoading || !shopId} className="btn-gradient w-full py-4">
              {uploadLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Uploading images...</span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Creating...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Package className="h-5 w-5" /> Add Product</span>
              )}
            </button>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// MOVED OUTSIDE the main component so React doesn't recreate it on every render
function AutoExpandingTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      placeholder={placeholder}
      className={className}
      style={{ minHeight: "52px" }}
    />
  );
}