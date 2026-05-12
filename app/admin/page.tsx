"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LocationPicker } from "@/components/admin/location-picker";
import { AdminShopCard } from "@/components/admin/shop-card";
import { uploadImages } from "@/lib/upload";
import {
  Store,
  Plus,
  X,
  Upload,
  Loader2,
  MapPin,
  Phone,
  Globe,
  Video,
  ImageIcon,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  "Clothing",
  "Electronics",
  "Food & Beverage",
  "Grocery",
  "Pharmacy",
  "Beauty",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
  "Jewelry",
  "Furniture",
  "Automotive",
  "Pet",
  "Health & Wellness",
  "Services",
  "Education",
  "Entertainment",
  "General",
  "Other",
];

interface ShopFormData {
  name: string;
  name_mm: string;
  category: string;
  phone: string;
  address: string;
  facebook: string;
  tiktok: string;
  latitude: number | null;
  longitude: number | null;
}

interface Shop {
  shop_id: string;
  name: string;
  category: string;
  owner_id: string;
  owner_name?: string;   // <-- ADD THIS
  latitude: number;
  longitude: number;
  logo_url?: string;
  phone?: string;
  address?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    name_mm: "",
    category: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    latitude: null,
    longitude: null,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const fetchShops = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/shops", {
        headers: { "x-user-id": user?.uid || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch shops");
      const result = await response.json();
      setShops(result.shops || result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shops");
    } finally {
      setFetching(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, latitude: location.lat, longitude: location.lng }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBannerFiles(files);
    setBannerPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const uploadAllImages = async (): Promise<{ logo_url: string; image_urls: string[] }> => {
    setUploadingImages(true);
    try {
      let logo_url = "";
      const image_urls: string[] = [];

        if (logoFile) {
        const result = await uploadImages([logoFile], "shop-logos");
        if (result.error) throw new Error(result.error);
        logo_url = result.urls[0] || "";
      }

      if (bannerFiles.length > 0) {
        const result = await uploadImages(bannerFiles, "shop-banners");
        if (result.error) throw new Error(result.error);
        image_urls.push(...result.urls);
      }

      return { logo_url, image_urls };
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      setError("Please select a location on the map.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { logo_url, image_urls } = await uploadAllImages();

      const response = await fetch("/api/admin/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
        },
        body: JSON.stringify({
          name: formData.name,
          name_mm: formData.name_mm,
          category: formData.category,
          phone: formData.phone,
          address: formData.address,
          facebook: formData.facebook,
          tiktok: formData.tiktok,
          logo_url,
          image_urls,
          location: { lat: formData.latitude, lng: formData.longitude },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create shop");
      }

      // Reset form
      setFormData({
        name: "",
        name_mm: "",
        category: "",
        phone: "",
        address: "",
        facebook: "",
        tiktok: "",
        latitude: null,
        longitude: null,
      });
      setLogoFile(null);
      setBannerFiles([]);
      setLogoPreview("");
      setBannerPreviews([]);
      setShowForm(false);

      fetchShops();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = (shopId: string) => {
    window.open(`/shop/dashboard?shop=${shopId}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-dark)]">Admin Panel</h1>
              <p className="text-xs text-[var(--text-gray)]">Shop Creation & Claim System</p>
            </div>
          </div>
<button
  onClick={() => router.push("/admin/map")}
  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
>
  <MapPin className="h-4 w-4" />
  View Map
</button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Close Form" : "Create Shop"}
          </button>
          
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Create Shop Form */}
        {showForm && (
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-[var(--text-dark)] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#667eea]" />
              Create New Shop
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)]">
                    Shop Name (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors"
                    placeholder="e.g. ZayMap Store"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)]">
                    Shop Name (MM)
                  </label>
                  <input
                    type="text"
                    value={formData.name_mm}
                    onChange={(e) => setFormData((p) => ({ ...p, name_mm: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors"
                    placeholder="မြန်မာအမည်"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)]">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)]">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors"
                    placeholder="09xxxxxxxxx"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)]">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors resize-none"
                  placeholder="Full address..."
                />
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)] flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[var(--text-gray)]" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => setFormData((p) => ({ ...p, facebook: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors"
                    placeholder="Facebook page URL"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)] flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-[var(--text-gray)]" />
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={formData.tiktok}
                    onChange={(e) => setFormData((p) => ({ ...p, tiktok: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea] transition-colors"
                    placeholder="@username"
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)] flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-[var(--text-gray)]" />
                    Logo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-gray)] hover:border-[#667eea] hover:text-[#667eea] cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {logoFile ? logoFile.name : "Choose logo"}
                    </label>
                  </div>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-dark)] flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-[var(--text-gray)]" />
                    Banners (multiple)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBannerChange}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-gray)] hover:border-[#667eea] hover:text-[#667eea] cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {bannerFiles.length > 0 ? `${bannerFiles.length} files` : "Choose banners"}
                    </label>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {bannerPreviews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Banner ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-gray)]" />
                  Location <span className="text-red-500">*</span>
                </label>
                <LocationPicker
                  onLocationChange={handleLocationChange}
                  initialLocation={
                    formData.latitude && formData.longitude
                      ? { lat: formData.latitude, lng: formData.longitude }
                      : undefined
                  }
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-gray)] hover:bg-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImages}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading || uploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4" />
                      Create Shop
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shops List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-dark)] flex items-center gap-2">
              <Store className="h-5 w-5 text-[#667eea]" />
              All Shops
              <span className="text-sm font-normal text-[var(--text-gray)]">
                ({shops.length})
              </span>
            </h2>
            <button
              onClick={fetchShops}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-gray)] hover:text-[#667eea] hover:bg-[#667eea]/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
              <Store className="h-12 w-12 text-[var(--text-gray)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--text-gray)]">No shops found.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-[#667eea] hover:underline"
              >
                Create your first shop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <AdminShopCard
                  key={shop.shop_id}
                  shop={shop}
                  onCopyLink={() => {}}
                  onOpenDashboard={handleOpenDashboard}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
