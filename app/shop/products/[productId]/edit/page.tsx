"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { uploadImages } from "@/lib/upload";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ImagePlus,
  X,
  Save
} from "lucide-react";

interface ProductFormData {
  name: string;
  name_mm: string;
  description: string;
  price: number;
  booking_fee: number;
  images: File[];
  existingImages: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    name_mm: "",
    description: "",
    price: 0,
    booking_fee: 500,
    images: [],
    existingImages: [],
  });

  // Load product data once on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      const uid = user?.uid;
      const pid = productId;
      
      if (!uid || !pid) return;
      
      try {
        setLoading(true);
        
        // Fetch shop
        const shopRes = await fetch(`/api/shops/my-shop?owner_id=${uid}`);
        if (!shopRes.ok) {
          router.push("/onboarding/shop-registration");
          return;
        }
        const shopData = await shopRes.json();
        if (!isMounted) return;
        setShopId(shopData.data.shop_id);

        // Fetch product
        const productRes = await fetch(`/api/products/${pid}`);
        if (!productRes.ok) {
          if (isMounted) setError("Product not found");
          return;
        }
        const productData = await productRes.json();
        const product = productData.data;

        // Verify ownership
        if (product.shop_id !== shopData.data.shop_id) {
          if (isMounted) setError("You don't have permission to edit this product");
          return;
        }

        if (isMounted) {
          setFormData({
            name: product.name || "",
            name_mm: product.name_mm || "",
            description: product.description || "",
            price: product.price || 0,
            booking_fee: product.booking_fee || 500,
            images: [],
            existingImages: product.image_urls || [],
          });
          setImagePreviews(product.image_urls || []);
        }
      } catch {
        if (isMounted) setError("Failed to load product");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Validate file count (max 1 total)
    const totalImages = formData.existingImages.length + formData.images.length + files.length;
    if (totalImages > 1) {
      setError("Maximum 1 image allowed");
      e.target.value = ""; // Reset input
      return;
    }

    // Validate file size and type
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        e.target.value = ""; // Reset input
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files allowed");
        e.target.value = ""; // Reset input
        return;
      }
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setError(null);
    e.target.value = ""; // Reset input to allow selecting more images
  };

  const removeImage = (index: number) => {
    const isExisting = index < formData.existingImages.length;
    
    if (isExisting) {
      // Remove from existing images
      setFormData(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index)
      }));
    } else {
      // Remove from new images
      const newIndex = index - formData.existingImages.length;
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== newIndex)
      }));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    // Validate at least 1 image exists
    const totalImages = formData.existingImages.length + formData.images.length;
    if (totalImages === 0) {
      setError("At least 1 product image is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let allImages = [...formData.existingImages];

      // Upload new images if any
      if (formData.images.length > 0) {
        setUploadLoading(true);
        const uploadResult = await uploadImages(formData.images, "products");
        setUploadLoading(false);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        const newImageUrls = uploadResult.urls;
        allImages = [...allImages, ...newImageUrls];
      }

      const response = await fetch(`/api/products/${productId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: formData.name,
          product_name_mm: formData.name_mm,
          description: formData.description,
          price: formData.price,
          booking_fee: formData.booking_fee,
          image_urls: allImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      setSuccess(true);
    } catch (err) {
      setUploadLoading(false);
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[#667eea] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Updated!</h1>
          <p className="text-gray-600 mb-8">Your product changes have been saved.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/shop/dashboard")}
              className="px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="px-8 py-4 border-2 border-[#667eea] text-[#667eea] rounded-xl font-semibold hover:bg-[#667eea] hover:text-white transition-all"
            >
              Edit Again
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
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/shop/dashboard")}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Product Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
                required
              />
            </div>

            {/* Product Name (Myanmar) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (Myanmar) <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.name_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                placeholder="မြန်မာဘာသာဖြင့် ထည့်ပါ"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900 resize-none"
              />
            </div>

            {/* Price */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Remove leading zeros and convert to number
                    const numValue = value === "" ? 0 : parseInt(value.replace(/^0+/, ""), 10) || 0;
                    setFormData(prev => ({ ...prev, price: numValue }));
                  }}
                  min={1}
                  className="w-full pl-12 pr-16 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">MMK</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Actual price of the product</p>
            </div>

            {/* Booking Fee */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Fee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.booking_fee || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Remove leading zeros and convert to number
                    const numValue = value === "" ? 0 : parseInt(value.replace(/^0+/, ""), 10) || 0;
                    setFormData(prev => ({ ...prev, booking_fee: numValue }));
                  }}
                  min={500}
                  step="100"
                  className="w-full pl-12 pr-16 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">MMK</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Amount customer pays to book this product (minimum 500 MMK)</p>
            </div>

            {/* Images */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">
                Product Image <span className="text-red-500">*</span> <span className="text-gray-500">(Required, Max 1)</span>
              </label>
              
              {/* Image Preview */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-1 gap-3 mb-4 max-w-xs">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Image Button */}
              {imagePreviews.length === 0 && (
                <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#667eea] hover:bg-[#667eea]/5 transition-all cursor-pointer">
                  <ImagePlus className="h-5 w-5 text-black" />
                  <span className="text-black font-medium">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading images...</span>
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
