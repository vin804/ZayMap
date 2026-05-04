"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { uploadImages } from "@/lib/upload";
import {
  Store,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  MapPin,
  Phone,
  Globe,
  Video,
  ImagePlus,
  X,
  Upload,
} from "lucide-react";

interface ShopFormData {
  name: string;
  name_mm: string;
  phone: string;
  address: string;
  facebook: string;
  tiktok: string;
  category: string;
  delivery_available: boolean;
  logo_url: string;
  image_urls: string[];
  description: string;
  description_mm: string;
  categories: Category[];
}

const CATEGORIES = [
  { value: "clothes", label: "Clothes", label_mm: "အဝတ်အစား" },
  { value: "electronics", label: "Electronics", label_mm: "အီလက်ထရွန်နစ်" },
  { value: "food", label: "Food", label_mm: "အစားအသောက်" },
  { value: "cosmetics", label: "Cosmetics", label_mm: "အလှကုန်" },
  { value: "second_hand", label: "Second-hand", label_mm: "ရောင်းချမှု" },
  { value: "other", label: "Other", label_mm: "အခြား" },
];

export default function ShopSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    name_mm: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    category: "other",
    delivery_available: false,
    logo_url: "",
    image_urls: [],
    description: "",
    description_mm: "",
    categories: [],
  });

  // Fetch user's shop
  useEffect(() => {
    const fetchShop = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          const shop = data.data;
          setShopId(shop.shop_id);
          setFormData({
            name: shop.name || "",
            name_mm: shop.name_mm || "",
            phone: shop.phone || "",
            address: shop.address || "",
            facebook: shop.facebook || "",
            tiktok: shop.tiktok || "",
            category: shop.category || "other",
            delivery_available: shop.delivery_available || false,
            logo_url: shop.logo_url || "",
            image_urls: shop.image_urls || [],
            description: shop.description || "",
            description_mm: shop.description_mm || "",
            categories: shop.categories || [],
          });
          if (shop.logo_url) {
            setLogoPreview(shop.logo_url);
          }
          if (shop.image_urls && shop.image_urls.length > 0) {
            setBannerPreviews(shop.image_urls);
          }
        } else {
          setError("Shop not found");
        }
      } catch {
        setError("Failed to load shop");
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [user?.uid]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (bannerFiles.length + files.length > 1) {
      setError("Only 1 banner image allowed");
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each banner must be under 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Banners must be images");
        return;
      }
    }

    setBannerFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setError(null);
  };

  const removeBanner = (index: number) => {
    setBannerFiles((prev) => prev.filter((_, i) => i !== index));
    setBannerPreviews((prev) => prev.filter((_, i) => i !== index));
    // Also clear from formData so old URLs don't persist
    setFormData((prev) => ({ ...prev, image_urls: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      setError("Shop not found");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let updatedFormData = { ...formData };

      // Upload new logo if selected
      if (logoFile) {
        const uploadResult = await uploadImages([logoFile], "shop-logos");
        if (uploadResult.error) throw new Error(uploadResult.error);
        if (uploadResult.urls.length > 0) {
          updatedFormData.logo_url = uploadResult.urls[0];
        }
      }

      // Upload new banners if selected (replace old ones)
      if (bannerFiles.length > 0) {
        const uploadResult = await uploadImages(bannerFiles, "shop-banners");
        if (uploadResult.error) throw new Error(uploadResult.error);
        updatedFormData.image_urls = uploadResult.urls; // Replace, don't append
      } else if (bannerPreviews.length === 0) {
        // No banners left, clear image_urls
        updatedFormData.image_urls = [];
      }

      const response = await fetch(`/api/shops/${shopId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update shop");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shop");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[#667eea] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-gray)]">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error && !shopId) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-dark)] mb-2">Shop not found</h1>
          <p className="text-[var(--text-gray)] mb-6">{error}</p>
          <button
            onClick={() => router.push("/onboarding/shop-registration")}
            className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium"
          >
            Register Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="bg-[var(--card-bg)] border-b border-gray-200/20 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/shop/dashboard")}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-500/10 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-[var(--text-gray)]" />
                </button>
                <h1 className="text-xl font-semibold text-[var(--text-dark)]">Shop Settings</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <span>Shop updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-gray-200/20 p-6">
            {/* Shop Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter shop name"
                className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)]"
                required
              />
            </div>

            {/* Shop Name (Myanmar) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Shop Name (Myanmar) <span className="text-[var(--text-gray)]">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.name_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                placeholder="မြန်မာဘာသာဖြင့် ထည့်ပါ"
                className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)]"
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)]"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.label_mm})
                  </option>
                ))}
              </select>
            </div>

            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Shop Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-500/10 rounded-xl flex items-center justify-center overflow-hidden border-2 border-[var(--border-subtle)]">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-8 w-8 text-[var(--text-gray)]" />
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500/10 rounded-lg cursor-pointer hover:bg-gray-500/20 transition-colors">
                    <Upload className="h-4 w-4 text-[var(--text-gray)]" />
                    <span className="text-sm font-medium text-[var(--text-dark)]">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-[var(--text-gray)] mt-1">Max 5MB, JPG or PNG</p>
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Shop Banner
              </label>
              <div className="space-y-3">
                {/* Banner Preview */}
                {bannerPreviews.length > 0 && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-[var(--border-subtle)] max-w-md">
                    <img src={bannerPreviews[0]} alt="Banner" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeBanner(0)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                {bannerPreviews.length < 1 && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500/10 rounded-lg cursor-pointer hover:bg-gray-500/20 transition-colors">
                    <Upload className="h-4 w-4 text-[var(--text-gray)]" />
                    <span className="text-sm font-medium text-[var(--text-dark)]">Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-[var(--text-gray)]">Max 5MB, one banner image (optional)</p>
              </div>
            </div>

            {/* Description (English) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Shop Description <span className="text-[var(--text-gray)]">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell customers about your shop, products, and services..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)] resize-none"
              />
            </div>

            {/* Description (Myanmar) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Shop Description (Myanmar) <span className="text-[var(--text-gray)]">(Optional)</span>
              </label>
              <textarea
                value={formData.description_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, description_mm: e.target.value }))}
                placeholder="ဆိုင်အကြောင်း၊ ပစ္စည်းများနှင့် ဝန်ဆောင်မှုများကို ဖော်ပြပါ..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)] resize-none"
              />
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-gray)]" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="09..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)]"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3 h-5 w-5 text-[var(--text-gray)]" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your shop address"
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)] resize-none"
                  required
                />
              </div>
            </div>

            {/* Facebook */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                Facebook Page <span className="text-[var(--text-gray)]">(Optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-gray)]" />
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="facebook.com/yourpage"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)]"
                />
              </div>
            </div>

            {/* TikTok */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-gray)] mb-2">
                TikTok <span className="text-[var(--text-gray)]">(Optional)</span>
              </label>
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-gray)]" />
                <input
                  type="text"
                  value={formData.tiktok}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@username"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/20 bg-[var(--card-bg)] rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-[var(--text-dark)]"
                />
              </div>
            </div>

            {/* Delivery Available */}
            <div className="mb-8">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.delivery_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_available: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]"
                />
                <span className="text-[var(--text-dark)]">Delivery Available</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !shopId}
              className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
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
