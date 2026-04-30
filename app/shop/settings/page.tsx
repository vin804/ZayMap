"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
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
  X
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
  
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    name_mm: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    category: "other",
    delivery_available: false,
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
          });
          if (shop.logo_url) {
            setLogoPreview(shop.logo_url);
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
      const response = await fetch(`/api/shops/${shopId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[#667eea] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error && !shopId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Shop not found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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
                <h1 className="text-xl font-semibold text-gray-900">Shop Settings</h1>
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

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Shop updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Shop Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter shop name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
                required
              />
            </div>

            {/* Shop Name (Myanmar) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name (Myanmar) <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.name_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                placeholder="မြန်မာဘာသာဖြင့် ထည့်ပါ"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900 bg-white"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.label_mm})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="09..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your shop address"
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900 resize-none"
                  required
                />
              </div>
            </div>

            {/* Facebook */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Page <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="facebook.com/yourpage"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
                />
              </div>
            </div>

            {/* TikTok */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.tiktok}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@username"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none text-gray-900"
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
                <span className="text-gray-700">Delivery Available</span>
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
