"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { ProtectedRoute } from "@/components/protected-route";
import { uploadImages } from "@/lib/upload";
import { LocationPicker } from "@/components/admin/location-picker";
import { motion, AnimatePresence } from "framer-motion";
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
  Upload,
  X,
  Settings,
  Sparkles,
  Truck,
  ImageIcon,
} from "lucide-react";

interface Category {
  id: string;
  name?: string;
  name_mm?: string;
  icon?: string;
}

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
  latitude: number;
  longitude: number;
}

const CATEGORIES = [
  { value: "clothes", label: "Clothes", label_mm: "အဝတ်အစား" },
  { value: "electronics", label: "Electronics", label_mm: "အီလက်ထရွန်နစ်" },
  { value: "food", label: "Food", label_mm: "အစားအသောက်" },
  { value: "cosmetics", label: "Cosmetics", label_mm: "အလှကုန်" },
  { value: "second_hand", label: "Second-hand", label_mm: "ရောင်းချမှု" },
  { value: "other", label: "Other", label_mm: "အခြား" },
];

const toastVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.2 } },
} as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
} as const;

function AutoExpandingTextarea({
  value,
  onChange,
  placeholder,
  className,
  style,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
  style: React.CSSProperties;
  rows?: number;
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
      rows={rows}
      className={className}
      style={{ ...style, minHeight: `${rows * 24 + 24}px` }}
    />
  );
}

export default function ShopSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminShopId = searchParams.get("shop");
  const { user } = useAuth();

  // Compute correct dashboard return URL
  const dashboardUrl = adminShopId ? `/shop/dashboard?shop=${adminShopId}` : "/shop/dashboard";
  const { theme } = useTheme();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

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
    latitude: 21.9813,
    longitude: 96.0891,
  });

  // Fetch shop
  useEffect(() => {
    const fetchShop = async () => {
      if (!user?.uid) return;
      try {
        let response;
        if (adminShopId) {
          response = await fetch(`/api/shops/${adminShopId}`);
        } else {
          response = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        }
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
            latitude: shop.latitude ?? shop.location?.latitude ?? 21.9813,
            longitude: shop.longitude ?? shop.location?.longitude ?? 96.0891,
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

      if (logoFile) {
        const uploadResult = await uploadImages([logoFile], "shop-logos");
        if (uploadResult.error) throw new Error(uploadResult.error);
        if (uploadResult.urls.length > 0) {
          updatedFormData.logo_url = uploadResult.urls[0];
        }
      }

      if (bannerFiles.length > 0) {
        const uploadResult = await uploadImages(bannerFiles, "shop-banners");
        if (uploadResult.error) throw new Error(uploadResult.error);
        updatedFormData.image_urls = uploadResult.urls;
      } else if (bannerPreviews.length === 0) {
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

  const inputBaseClasses =
    "w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]";
  const inputStyle = {
    background: "var(--bg-elevated)",
    borderColor: "var(--border)",
    color: "var(--fg)",
  };
  const labelStyle = { color: "var(--fg)" };
  const optionalStyle = { color: "var(--fg-muted)" };
  const helperStyle = { color: "var(--fg-dim)" };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center animate-pulse">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            Loading shop settings...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error && !shopId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full rounded-3xl border p-10"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--fg)" }}>
            Shop not found
          </h1>
          <p className="mb-6" style={{ color: "var(--fg-muted)" }}>
            {error}
          </p>
          {!adminShopId && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/onboarding/shop-registration")}
              className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium shadow-lg shadow-purple-500/20"
            >
              Register Shop
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Header */}
        <header
          className="sticky top-0 z-30 border-b backdrop-blur-xl"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="max-w-3xl mx-auto px-4 py-3.5">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(dashboardUrl)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: "var(--fg)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-lg shadow-purple-500/20">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                  Shop Settings
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {/* Animated Toasts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mb-5 rounded-2xl border p-4 flex items-start gap-3 shadow-lg"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  borderColor: "rgba(239,68,68,0.2)",
                }}
              >
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-red-500">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success"
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mb-5 rounded-2xl border p-4 flex items-start gap-3 shadow-lg"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  borderColor: "rgba(34,197,94,0.2)",
                }}
              >
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-500">
                  Shop updated successfully!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border p-6 sm:p-8 space-y-6"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            {/* Shop Name */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter shop name"
                className={inputBaseClasses}
                style={inputStyle}
                required
              />
            </motion.div>

            {/* Shop Name (Myanmar) */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Shop Name (Myanmar){" "}
                <span className="font-normal" style={optionalStyle}>
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                value={formData.name_mm}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_mm: e.target.value }))}
                placeholder="မြန်မာဘာသာဖြင့် ထည့်ပါ"
                className={inputBaseClasses}
                style={inputStyle}
              />
            </motion.div>

            {/* Category */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className={`${inputBaseClasses} appearance-none cursor-pointer`}
                  style={inputStyle}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} ({cat.label_mm})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4"
                    style={{ color: "var(--fg-dim)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Logo Upload */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={3}>
              <label className="block text-sm font-semibold mb-3" style={labelStyle}>
                Shop Logo
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2"
                  style={{ background: "var(--bg)", borderColor: "var(--border)" }}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-8 w-8" style={{ color: "var(--fg-dim)" }} />
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-[#667eea]/10 border"
                    style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}>
                    <Upload className="h-4 w-4" style={{ color: "var(--fg-dim)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                      Upload Logo
                    </span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-xs mt-1.5" style={helperStyle}>
                    Max 5MB, JPG or PNG
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Banner Upload */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={4}>
              <label className="block text-sm font-semibold mb-3" style={labelStyle}>
                Shop Banner
              </label>
              <div className="space-y-3">
                {bannerPreviews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-video rounded-2xl overflow-hidden border max-w-md group"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <img
                      src={bannerPreviews[0]}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeBanner(0)}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                )}

                {bannerPreviews.length < 1 && (
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-[#667eea]/10 border"
                    style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}>
                    <ImageIcon className="h-4 w-4" style={{ color: "var(--fg-dim)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                      Upload Banner
                    </span>
                    <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                )}
                <p className="text-xs" style={helperStyle}>
                  Max 5MB, one banner image (optional)
                </p>
              </div>
            </motion.div>

            {/* Description (English) */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={5}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Shop Description{" "}
                <span className="font-normal" style={optionalStyle}>
                  (Optional)
                </span>
              </label>
              <AutoExpandingTextarea
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Tell customers about your shop, products, and services..."
                className={`${inputBaseClasses} resize-none overflow-hidden`}
                style={inputStyle}
                rows={3}
              />
            </motion.div>

            {/* Description (Myanmar) */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={6}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Shop Description (Myanmar){" "}
                <span className="font-normal" style={optionalStyle}>
                  (Optional)
                </span>
              </label>
              <AutoExpandingTextarea
                value={formData.description_mm}
                onChange={(value) => setFormData((prev) => ({ ...prev, description_mm: value }))}
                placeholder="ဆိုင်အကြောင်း၊ ပစ္စည်းများနှင့် ဝန်ဆောင်မှုများကို ဖော်ပြပါ..."
                className={`${inputBaseClasses} resize-none overflow-hidden`}
                style={inputStyle}
                rows={3}
              />
            </motion.div>

            {/* Phone */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={7}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="09..."
                  className={`${inputBaseClasses} pl-12`}
                  style={inputStyle}
                  required
                />
              </div>
            </motion.div>

            {/* Address */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={8}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-3.5 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <AutoExpandingTextarea
                  value={formData.address}
                  onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
                  placeholder="Enter your shop address"
                  className={`${inputBaseClasses} resize-none overflow-hidden pl-12`}
                  style={inputStyle}
                  rows={2}
                />
              </div>
            </motion.div>

            {/* Location Picker */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={8.5}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold" style={labelStyle}>
                  Shop Location <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-[#667eea]/10"
                  style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  <Globe className="h-3.5 w-3.5 text-[#667eea]" />
                  {mapType === "standard" ? "Satellite View" : "Standard View"}
                </button>
              </div>
              <LocationPicker
                initialLocation={{ lat: formData.latitude, lng: formData.longitude }}
                onLocationChange={(loc) =>
                  setFormData((prev) => ({
                    ...prev,
                    latitude: loc.lat,
                    longitude: loc.lng,
                  }))
                }
                mapType={mapType}
              />
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={helperStyle}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className={inputBaseClasses}
                    style={inputStyle}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={helperStyle}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className={inputBaseClasses}
                    style={inputStyle}
                  />
                </div>
              </div>
            </motion.div>

            {/* Facebook */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={9}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Facebook Page{" "}
                <span className="font-normal" style={optionalStyle}>
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <Globe
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData((prev) => ({ ...prev, facebook: e.target.value }))}
                  placeholder="facebook.com/yourpage"
                  className={`${inputBaseClasses} pl-12`}
                  style={inputStyle}
                />
              </div>
            </motion.div>

            {/* TikTok */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={10}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                TikTok{" "}
                <span className="font-normal" style={optionalStyle}>
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <Video
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="text"
                  value={formData.tiktok}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@username"
                  className={`${inputBaseClasses} pl-12`}
                  style={inputStyle}
                />
              </div>
            </motion.div>

            {/* Delivery Available */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={11}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.delivery_available}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, delivery_available: e.target.checked }))
                    }
                    className="peer sr-only"
                  />
                  <div
                    className="w-11 h-6 rounded-full transition-all duration-300"
                    style={{
                      background: formData.delivery_available
                        ? "linear-gradient(135deg, #667eea, #764ba2)"
                        : "var(--bg-hover)",
                    }}
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300 shadow-sm"
                      style={{
                        background: "var(--bg-elevated)",
                        transform: formData.delivery_available
                          ? "translateX(20px)"
                          : "translateX(0)",
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck
                    className="h-4 w-4"
                    style={{
                      color: formData.delivery_available ? "#667eea" : "var(--fg-dim)",
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                    Delivery Available
                  </span>
                </div>
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              custom={12}
              className="pt-2"
            >
              <motion.button
                whileHover={!saving ? { scale: 1.01 } : {}}
                whileTap={!saving ? { scale: 0.99 } : {}}
                type="submit"
                disabled={saving || !shopId}
                className="w-full py-3.5 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </main>
      </div>
    </ProtectedRoute>
  );
}