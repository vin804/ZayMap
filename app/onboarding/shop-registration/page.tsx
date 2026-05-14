"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LocationPicker } from "@/components/admin/location-picker";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { uploadImages } from "@/lib/upload";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Globe,
  Loader2,
  Upload,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ImageIcon,
  Video,
  ChevronRight,
  Check,
  Navigation,
} from "lucide-react";

type Language = "en" | "my";

interface ShopFormData {
  name: string;
  name_mm: string;
  category: string;
  phone: string;
  address: string;
  facebook: string;
  tiktok: string;
  logo: File | null;
  banners: File[];
  location: {
    lat: number;
    lng: number;
  } | null;
}

const TRANSLATIONS = {
  en: {
    back: "Back",
    createShop: "Create Your Shop",
    subtitle: "Fill in your shop details to start listing products",
    step1: "Shop Info",
    step2: "Contact & Location",
    step3: "Social Media",
    shopName: "Shop Name (English)",
    shopNamePlaceholder: "e.g., Fresh Mart",
    shopNameMM: "Shop Name (Myanmar)",
    shopNameMMPlaceholder: "ဥပမာ - စျေးဆိုင်သစ်",
    category: "Category",
    selectACategory: "Select a category",
    categories: {
      clothes: "Clothes",
      electronics: "Electronics",
      food: "Food",
      cosmetics: "Cosmetics",
      second_hand: "Second-hand",
      other: "Other",
    },
    shopLogo: "Shop Logo",
    uploadLogo: "Upload Logo",
    logoHint: "Max 5MB, JPG or PNG",
    shopBanner: "Shop Banner",
    uploadBanner: "Upload Banner",
    bannerHint: "Max 5MB, one banner image (optional)",
    phone: "Phone Number",
    phonePlaceholder: "+959...",
    phoneRequired: "Phone number is required",
    address: "Address",
    addressPlaceholder: "Full address of your shop",
    facebook: "Facebook Page (Optional)",
    facebookPlaceholder: "facebook.com/yourshop",
    tiktok: "TikTok Account (Optional)",
    tiktokPlaceholder: "@yourshop",
    next: "Next",
    prev: "Previous",
    createShopBtn: "Create Shop",
    creating: "Creating...",
    english: "English",
    myanmar: "မြန်မာ",
    success: "Shop Created Successfully!",
    successDesc: "Your shop is ready. Start uploading products now.",
    startUploading: "Start Uploading Products",
    viewOnMap: "View on Map",
    enterShopName: "Please enter shop name",
    pleaseSelectCategory: "Please select a category",
    enterPhone: "Please enter phone number",
    enterAddress: "Please enter address",
    invalidPhone: "Please enter a valid phone number",
    fileTooLarge: "Logo must be under 5MB",
    invalidFileType: "Logo must be an image",
    summary: "Summary",
  },
  my: {
    back: "နောက်သို့",
    createShop: "သင့်ဆိုင်ဖန်တီးပါ",
    subtitle: "ပစ္စည်းစာရင်းပြုရန် ဆိုင်အချက်အလက်များ ဖြည့်ပါ",
    step1: "ဆိုင်အချက်အလက်",
    step2: "ဆက်သွယ်ရေး",
    step3: "လူမှုကွန်ရက်",
    shopName: "ဆိုင်နာမည် (အင်္ဂလိပ်)",
    shopNamePlaceholder: "ဥပမာ - Fresh Mart",
    shopNameMM: "ဆိုင်နာမည် (မြန်မာ)",
    shopNameMMPlaceholder: "ဥပမာ - စျေးဆိုင်သစ်",
    category: "အမျိုးအစား",
    selectACategory: "အမျိုးအစားရွေးပါ",
    categories: {
      clothes: "အဝတ်အစား",
      electronics: "အီလက်ထရွန်",
      food: "အစားအစာ",
      cosmetics: "အလှကုန်",
      second_hand: "အသုံးပြုထားသော",
      other: "အခြား",
    },
    shopLogo: "ဆိုင်လိုဂို",
    uploadLogo: "လိုဂိုတင်ပါ",
    logoHint: "အများဆုံး ၅MB၊ JPG သို့မဟုတ် PNG",
    shopBanner: "ဆိုင်ဘန်နာ",
    uploadBanner: "ဘန်နာတင်ပါ",
    bannerHint: "အများဆုံး ၅MB၊ ဘန်နာပုံ ၁ ပုံ (မဖြစ်မနေ မဟုတ်)",
    phone: "ဖုန်းနံပါတ်",
    phonePlaceholder: "+959...",
    phoneRequired: "ဖုန်းနံပါတ်ထည့်ရန်လိုအပ်",
    address: "လိပ်စာ",
    addressPlaceholder: "ဆိုင်လိပ်စာအပြည့်အစုံ",
    facebook: "Facebook စာမျက်နှာ (မဖြစ်မနေ)",
    facebookPlaceholder: "facebook.com/yourshop",
    tiktok: "TikTok အကောင့် (မဖြစ်မနေ)",
    tiktokPlaceholder: "@yourshop",
    next: "ရှေ့သို့",
    prev: "နောက်သို့",
    createShopBtn: "ဆိုင်ဖန်တီးမယ်",
    creating: "ဖန်တီးနေသည်...",
    english: "English",
    myanmar: "မြန်မာ",
    success: "ဆိုင်ဖန်တီးခြင်း အောင်မြင်ပါသည်!",
    successDesc: "သင့်ဆိုင်အဆင်သင့်ဖြစ်ပါပြီ။ ပစ္စည်းများတင်ပါ။",
    startUploading: "ပစ္စည်းစတင်တင်မယ်",
    viewOnMap: "မြေပုံမှာ ကြည့်မယ်",
    enterShopName: "ဆိုင်နာမည်ထည့်ပါ",
    selectCategory: "အမျိုးအစားရွေးပါ",
    enterPhone: "ဖုန်းနံပါတ်ထည့်ပါ",
    enterAddress: "လိပ်စာထည့်ပါ",
    invalidPhone: "မှန်ကန်သောဖုန်းနံပါတ်ထည့်ပါ",
    fileTooLarge: "လိုဂို ၅MB ထက်နည်းရမည်",
    invalidFileType: "လိုဂို ပုံစံသာဖြစ်ရမည်",
    summary: "အကျဉ်းချုပ်",
  },
};

const CATEGORIES = ["clothes", "electronics", "food", "cosmetics", "second_hand", "other"];

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
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
} as const;

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
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

export default function ShopRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdShopLocation, setCreatedShopLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    name_mm: "",
    category: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    logo: null,
    banners: [],
    location: null,
  });

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "my" : "en";
    setLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
  };

  const handleInputChange = (field: keyof ShopFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLocationChange = useCallback((loc: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, location: loc }));
    setError(null);
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t.fileTooLarge);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t.invalidFileType);
      return;
    }

    setFormData((prev) => ({ ...prev, logo: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.banners.length + files.length > 1) {
      setError(language === "en" ? "Only 1 banner image allowed" : "ဘန်နာပုံ ၁ ပုံသာခွင့်ပြု");
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t.fileTooLarge);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError(t.invalidFileType);
        return;
      }
    }

    setFormData((prev) => ({ ...prev, banners: [...prev.banners, ...files] }));

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
    setFormData((prev) => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== index),
    }));
    setBannerPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) return t.enterShopName;
        if (!formData.category) return t.selectACategory;
        return null;
      case 2:
        if (!formData.phone.trim()) return t.enterPhone;
        if (!formData.address.trim()) return t.enterAddress;
        if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) return t.invalidPhone;
        if (!formData.location) return "Please select a shop location.";
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((prev) => prev + 1);
    setError(null);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const location = formData.location;
      if (!location) {
        setError("Please select a shop location before submitting.");
        setLoading(false);
        return;
      }

      let logoUrl = "";
      if (formData.logo) {
        const uploadResult = await uploadImages([formData.logo], "shop-logos");
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        if (uploadResult.urls.length > 0) {
          logoUrl = uploadResult.urls[0];
        }
      }

      let bannerUrls: string[] = [];
      if (formData.banners.length > 0) {
        const uploadResult = await uploadImages(formData.banners, "shop-banners");
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        bannerUrls = uploadResult.urls;
      }

      const response = await fetch("/api/shops/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          name_mm: formData.name_mm,
          category: formData.category,
          phone: formData.phone,
          address: formData.address,
          facebook: formData.facebook,
          tiktok: formData.tiktok,
          logo_url: logoUrl,
          image_urls: bannerUrls,
          location: location,
          owner_id: user?.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create shop");
      }

      setCreatedShopLocation(location);
      setSuccess(true);

      setTimeout(() => {
        router.push(`/map?lat=${location.lat}&lng=${location.lng}&highlight=new`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
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

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center max-w-md w-full rounded-3xl border p-10"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.15 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.1)" }}
          >
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>
            {t.success}
          </h1>
          <p className="mb-8" style={{ color: "var(--fg-muted)" }}>
            {t.successDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/shop/dashboard")}
              className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium shadow-lg shadow-purple-500/20"
            >
              {t.startUploading}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/map")}
              className="px-6 py-3 rounded-xl font-semibold border-2 transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--fg)",
                background: "var(--bg-elevated)",
              }}
            >
              {t.viewOnMap}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (step === 1 ? router.push("/map") : handlePrev())}
              className="flex items-center gap-2 p-2 -ml-2 rounded-xl transition-colors"
              style={{ color: "var(--fg)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t.back}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border"
              style={{
                background: "var(--bg-hover)",
                borderColor: "var(--border)",
                color: "var(--fg-dim)",
              }}
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? t.english : t.myanmar}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="relative mx-auto mb-4 w-fit">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Store className="h-8 w-8 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-30 -z-10"
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
            />
          </div>
          <h1 className="text-2xl font-bold mb-1.5" style={{ color: "var(--fg)" }}>
            {t.createShop}
          </h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {t.subtitle}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center gap-1 mb-8"
        >
          {[1, 2, 3].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    background:
                      s < step
                        ? "linear-gradient(135deg, #22c55e, #16a34a)"
                        : s === step
                        ? "linear-gradient(135deg, #667eea, #764ba2)"
                        : "var(--bg-hover)",
                    color: s <= step ? "white" : "var(--fg-dim)",
                    borderColor: s <= step ? "transparent" : "var(--border)",
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300"
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </motion.div>
                <span
                  className="text-sm font-medium hidden sm:block transition-colors duration-300"
                  style={{
                    color: s === step ? "#667eea" : s < step ? "var(--fg)" : "var(--fg-dim)",
                  }}
                >
                  {s === 1 ? t.step1 : s === 2 ? t.step2 : t.step3}
                </span>
              </div>
              {idx < 2 && (
                <div
                  className="w-8 sm:w-12 h-px mx-2 sm:mx-3 transition-colors duration-300"
                  style={{
                    background: s < step ? "#22c55e" : "var(--border)",
                  }}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-3xl border p-6 sm:p-8"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mb-6 rounded-2xl border p-4 flex items-start gap-3"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  borderColor: "rgba(239,68,68,0.2)",
                }}
              >
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-red-500">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Shop Name */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.shopName}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t.shopNamePlaceholder}
                    className={inputBaseClasses}
                    style={inputStyle}
                  />
                </motion.div>

                {/* Shop Name MM */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.shopNameMM}
                  </label>
                  <input
                    type="text"
                    value={formData.name_mm}
                    onChange={(e) => handleInputChange("name_mm", e.target.value)}
                    placeholder={t.shopNameMMPlaceholder}
                    className={inputBaseClasses}
                    style={inputStyle}
                  />
                </motion.div>

                {/* Category */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.category}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className={`${inputBaseClasses} appearance-none cursor-pointer`}
                      style={inputStyle}
                    >
                      <option value="">{t.selectACategory}</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {t.categories[cat as keyof typeof t.categories]}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight
                        className="h-4 w-4 rotate-90"
                        style={{ color: "var(--fg-dim)" }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Logo */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={3}>
                  <label className="block text-sm font-semibold mb-3" style={labelStyle}>
                    {t.shopLogo}
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2"
                      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-8 w-8" style={{ color: "var(--fg-dim)" }} />
                      )}
                    </div>
                    <div>
                      <label
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-[#667eea]/10 border"
                        style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}
                      >
                        <Upload className="h-4 w-4" style={{ color: "var(--fg-dim)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                          {t.uploadLogo}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs mt-1.5" style={helperStyle}>
                        {t.logoHint}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Banner */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={4}>
                  <label className="block text-sm font-semibold mb-3" style={labelStyle}>
                    {t.shopBanner}
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
                          onClick={() => removeBanner(0)}
                          className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    )}

                    {bannerPreviews.length < 1 && (
                      <label
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-[#667eea]/10 border"
                        style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}
                      >
                        <ImageIcon className="h-4 w-4" style={{ color: "var(--fg-dim)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                          {t.uploadBanner}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-xs" style={helperStyle}>
                      {t.bannerHint}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Phone */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.phone} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                      style={{ color: "var(--fg-dim)" }}
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className={`${inputBaseClasses} pl-12`}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>

                {/* Address */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.address} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-3.5 h-5 w-5"
                      style={{ color: "var(--fg-dim)" }}
                    />
                    <AutoExpandingTextarea
                      value={formData.address}
                      onChange={(value) => handleInputChange("address", value)}
                      placeholder={t.addressPlaceholder}
                      className={`${inputBaseClasses} resize-none overflow-hidden pl-12`}
                      style={inputStyle}
                      rows={2}
                    />
                  </div>
                </motion.div>

                {/* Location Picker */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
                  <label className="block text-sm font-semibold mb-3" style={labelStyle}>
                    Shop Location <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-wrap gap-3 mb-3">
                    <button
                      type="button"
                      onClick={async () => {
                        setDetectingLocation(true);
                        setError(null);
                        try {
                          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                              enableHighAccuracy: true,
                              timeout: 10000,
                              maximumAge: 0,
                            });
                          });
                          const loc = {
                            lat: Math.round(position.coords.latitude * 10000) / 10000,
                            lng: Math.round(position.coords.longitude * 10000) / 10000,
                          };
                          handleLocationChange(loc);
                        } catch {
                          setError("Could not detect your location. Please drop the pin manually on the map.");
                        } finally {
                          setDetectingLocation(false);
                        }
                      }}
                      disabled={detectingLocation}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-[#667eea]/10 disabled:opacity-50"
                      style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--fg)" }}
                    >
                      {detectingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4 text-[#667eea]" />
                      )}
                      {detectingLocation ? "Detecting..." : "Use My Current Location"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-[#667eea]/10"
                      style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--fg)" }}
                    >
                      <Globe className="h-4 w-4 text-[#667eea]" />
                      {mapType === "standard" ? "Satellite View" : "Standard View"}
                    </button>

                    {formData.location && (
                      <button
                        type="button"
                        onClick={() => handleLocationChange(null as any)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <X className="h-4 w-4" />
                        Clear Pin
                      </button>
                    )}
                  </div>

                  {formData.location && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-[#667eea]/10 border border-[#667eea]/20 text-xs font-mono text-[#667eea]">
                      Lat: {formData.location.lat}, Lng: {formData.location.lng}
                    </div>
                  )}

                  <LocationPicker
                    onLocationChange={handleLocationChange}
                    initialLocation={formData.location || undefined}
                    mapType={mapType}
                  />
                </motion.div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Facebook */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.facebook}
                  </label>
                  <div className="relative">
                    <Globe
  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
  style={{ color: "var(--fg-dim)" }}
/>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange("facebook", e.target.value)}
                      placeholder={t.facebookPlaceholder}
                      className={`${inputBaseClasses} pl-12`}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>

                {/* TikTok */}
                <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                    {t.tiktok}
                  </label>
                  <div className="relative">
                    <Video
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                      style={{ color: "var(--fg-dim)" }}
                    />
                    <input
                      type="text"
                      value={formData.tiktok}
                      onChange={(e) => handleInputChange("tiktok", e.target.value)}
                      placeholder={t.tiktokPlaceholder}
                      className={`${inputBaseClasses} pl-12`}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>

                {/* Summary */}
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                  className="rounded-2xl border p-5"
                  style={{ background: "var(--bg)", borderColor: "var(--border)" }}
                >
                  <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--fg)" }}>
                    {t.summary}
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--fg-dim)" }}>{t.shopName}</span>
                      <span className="font-medium" style={{ color: "var(--fg)" }}>
                        {formData.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--fg-dim)" }}>{t.category}</span>
                      <span className="font-medium" style={{ color: "var(--fg)" }}>
                        {t.categories[formData.category as keyof typeof t.categories]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--fg-dim)" }}>{t.phone}</span>
                      <span className="font-medium" style={{ color: "var(--fg)" }}>
                        {formData.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--fg-dim)" }}>{t.address}</span>
                      <span className="font-medium text-right max-w-[60%]" style={{ color: "var(--fg)" }}>
                        {formData.address}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrev}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              >
                {t.prev}
              </motion.button>
            )}
            <motion.button
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={loading}
              className="flex-1 py-3 px-4 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.creating}</span>
                </>
              ) : step === 3 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{t.createShopBtn}</span>
                </>
              ) : (
                <>
                  <span>{t.next}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}