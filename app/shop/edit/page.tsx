"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Store, CheckCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  { value: "electronics", label: "Electronics", label_mm: "အီလက်ထရွန်နစ်ပစ္စည်းများ" },
  { value: "fashion", label: "Fashion", label_mm: "ဖက်ရှင်ပစ္စည်းများ" },
  { value: "food", label: "Food & Beverages", label_mm: "အစားအသောက်များ" },
  { value: "beauty", label: "Beauty & Health", label_mm: "အလှအပနှင့်ကျန်းမာရေး" },
  { value: "home", label: "Home & Garden", label_mm: "အိမ်သုံးပစ္စည်းများနှင့် ဥယျာဉ်" },
  { value: "sports", label: "Sports & Outdoors", label_mm: "အားကစားပစ္စည်းများ" },
  { value: "books", label: "Books & Stationery", label_mm: "စာအုပ်နှင့်စာရေးကိရိယာများ" },
  { value: "toys", label: "Toys & Games", label_mm: "အကစားပစ္စည်းများနှင့်ဂိမ်းများ" },
  { value: "automotive", label: "Automotive", label_mm: "ယာဉ်ပစ္စည်းများ" },
  { value: "other", label: "Other", label_mm: "အခြား" },
];

interface ShopData {
  shop_id: string;
  name: string;
  name_mm?: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  category: string;
  delivery_available: boolean;
  description?: string;
  description_mm?: string;
}

export default function EditShopPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [language, setLanguage] = useState<"en" | "my">("en");

  const [shopData, setShopData] = useState<ShopData>({
    shop_id: "",
    name: "",
    name_mm: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    category: "other",
    delivery_available: false,
    description: "",
    description_mm: "",
  });

  // Load shop data
  useEffect(() => {
    const loadShop = async () => {
      if (!user?.shop_id) {
        setError("No shop associated with your account");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/shops/${user.shop_id}`);
        if (!res.ok) throw new Error("Failed to load shop");
        
        const data = await res.json();
        setShopData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load shop");
      } finally {
        setLoading(false);
      }
    };

    loadShop();
  }, [user]);

  const handleSave = async () => {
    if (!shopData.shop_id) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/shops/${shopData.shop_id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update shop");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shop");
    } finally {
      setSaving(false);
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
                <ArrowLeft className="h-5 w-5 text-black" />
              </button>
              <h1 className="text-xl font-semibold text-black">
                {language === "en" ? "Edit Shop" : "ဆိုင်ပြင်ဆင်မည်"}
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
            </div>
          ) : error && !shopData.shop_id ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-800">
                    {language === "en" ? "Shop updated successfully!" : "ဆိုင်အောင်မြင်စွာပြင်ဆင်ပြီးပါပြီ!"}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Shop Info Form */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Store className="h-6 w-6 text-[#667eea]" />
                  <h2 className="text-lg font-semibold text-black">
                    {language === "en" ? "Shop Information" : "ဆိုင်အချက်အလက်များ"}
                  </h2>
                </div>

                {/* Shop Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {language === "en" ? "Shop Name" : "ဆိုင်နာမည်"} *
                    </label>
                    <input
                      type="text"
                      value={shopData.name}
                      onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                      placeholder={language === "en" ? "Enter shop name" : "ဆိုင်နာမည်ထည့်ပါ"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {language === "en" ? "Shop Name (Myanmar)" : "ဆိုင်နာမည် (မြန်မာ)"}
                    </label>
                    <input
                      type="text"
                      value={shopData.name_mm || ""}
                      onChange={(e) => setShopData({ ...shopData, name_mm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                      placeholder={language === "en" ? "Enter Myanmar name" : "မြန်မာနာမည်ထည့်ပါ"}
                    />
                  </div>
                </div>

                {/* Phone & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {language === "en" ? "Phone Number" : "ဖုန်းနံပါတ်"} *
                    </label>
                    <input
                      type="tel"
                      value={shopData.phone}
                      onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                      placeholder={language === "en" ? "Enter phone number" : "ဖုန်းနံပါတ်ထည့်ပါ"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {language === "en" ? "Address" : "လိပ်စာ"} *
                    </label>
                    <input
                      type="text"
                      value={shopData.address}
                      onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                      placeholder={language === "en" ? "Enter address" : "လိပ်စာထည့်ပါ"}
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {language === "en" ? "Category" : "အမျိုးအစား"} *
                  </label>
                  <select
                    value={shopData.category}
                    onChange={(e) => setShopData({ ...shopData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {language === "en" ? cat.label : cat.label_mm}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {language === "en" ? "About This Shop" : "ဆိုင်အကြောင်း"}
                    </label>
                    <textarea
                      value={shopData.description || ""}
                      onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black h-24 resize-none"
                      placeholder={language === "en" ? "Welcome to our shop! Browse our products above." : "ကျွန်ုပ်တို့ဆိုင်မှကြိုဆိုပါသည်! ထက်ပါပစ္စည်းများကိုရှာဖွေကြည့်ရှုပါ။"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {language === "en" ? "About This Shop (Myanmar)" : "ဆိုင်အကြောင်း (မြန်မာ)"}
                    </label>
                    <textarea
                      value={shopData.description_mm || ""}
                      onChange={(e) => setShopData({ ...shopData, description_mm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black h-24 resize-none"
                      placeholder={language === "en" ? "Myanmar description..." : "မြန်မာဘာသာဖော်ပြချက်..."}
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={shopData.facebook || ""}
                      onChange={(e) => setShopData({ ...shopData, facebook: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                      placeholder="facebook.com/yourshop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      TikTok
                    </label>
                    <input
                      type="text"
                      value={shopData.tiktok || ""}
                      onChange={(e) => setShopData({ ...shopData, tiktok: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-black"
                      placeholder="@yourshop"
                    />
                  </div>
                </div>

                {/* Delivery Available */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={shopData.delivery_available}
                    onChange={(e) => setShopData({ ...shopData, delivery_available: e.target.checked })}
                    className="h-5 w-5 text-[#667eea] rounded focus:ring-[#667eea]"
                  />
                  <label htmlFor="delivery" className="text-black">
                    {language === "en" ? "Delivery Available" : "အိမ်အရောက်ပို့ဆောင်ခြင်း"}
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => router.push("/shop/dashboard")}
                    className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium text-black hover:border-gray-400 transition-colors"
                  >
                    {language === "en" ? "Cancel" : "ပယ်ဖျက်မည်"}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {language === "en" ? "Saving..." : "သိမ်းဆည်းနေသည်..."}
                      </>
                    ) : (
                      language === "en" ? "Save Changes" : "ပြောင်းလဲမှုများသိမ်းမည်"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
