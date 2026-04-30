"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { uploadImages } from "@/lib/upload";
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
  AlertCircle
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
    // Shop Info
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
    // Contact
    phone: "Phone Number",
    phonePlaceholder: "+959...",
    phoneRequired: "Phone number is required",
    address: "Address",
    addressPlaceholder: "Full address of your shop",
    // Social
    facebook: "Facebook Page (Optional)",
    facebookPlaceholder: "facebook.com/yourshop",
    tiktok: "TikTok Account (Optional)",
    tiktokPlaceholder: "@yourshop",
    // Buttons
    next: "Next",
    prev: "Previous",
    createShopBtn: "Create Shop",
    creating: "Creating...",
    english: "English",
    myanmar: "မြန်မာ",
    // Success
    success: "Shop Created Successfully!",
    successDesc: "Your shop is ready. Start uploading products now.",
    startUploading: "Start Uploading Products",
    // Errors
    enterShopName: "Please enter shop name",
    pleaseSelectCategory: "Please select a category",
    enterPhone: "Please enter phone number",
    enterAddress: "Please enter address",
    invalidPhone: "Please enter a valid phone number",
    fileTooLarge: "Logo must be under 5MB",
    invalidFileType: "Logo must be JPG or PNG",
  },
  my: {
    back: "နောက်သို့",
    createShop: "သင့်ဆိုင်ဖန်တီးပါ",
    subtitle: "ပစ္စည်းစာရင်းပြုရန် ဆိုင်အချက်အလက်များ ဖြည့်ပါ",
    step1: "ဆိုင်အချက်အလက်",
    step2: "ဆက်သွယ်ရေး",
    step3: "လူမှုကွန်ရက်",
    // Shop Info
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
    // Contact
    phone: "ဖုန်းနံပါတ်",
    phonePlaceholder: "+959...",
    phoneRequired: "ဖုန်းနံပါတ်ထည့်ရန်လိုအပ်",
    address: "လိပ်စာ",
    addressPlaceholder: "ဆိုင်လိပ်စာအပြည့်အစုံ",
    // Social
    facebook: "Facebook စာမျက်နှာ (မဖြစ်မနေ)",
    facebookPlaceholder: "facebook.com/yourshop",
    tiktok: "TikTok အကောင့် (မဖြစ်မနေ)",
    tiktokPlaceholder: "@yourshop",
    // Buttons
    next: "ရှေ့သို့",
    prev: "နောက်သို့",
    createShopBtn: "ဆိုင်ဖန်တီးမယ်",
    creating: "ဖန်တီးနေသည်...",
    english: "English",
    myanmar: "မြန်မာ",
    // Success
    success: "ဆိုင်ဖန်တီးခြင်း အောင်မြင်ပါသည်!",
    successDesc: "သင့်ဆိုင်အဆင်သင့်ဖြစ်ပါပြီ။ ပစ္စည်းများတင်ပါ။",
    startUploading: "ပစ္စည်းစတင်တင်မယ်",
    // Errors
    enterShopName: "ဆိုင်နာမည်ထည့်ပါ",
    selectCategory: "အမျိုးအစားရွေးပါ",
    enterPhone: "ဖုန်းနံပါတ်ထည့်ပါ",
    enterAddress: "လိပ်စာထည့်ပါ",
    invalidPhone: "မှန်ကန်သောဖုန်းနံပါတ်ထည့်ပါ",
    fileTooLarge: "လိုဂို ၅MB ထက်နည်းရမည်",
    invalidFileType: "လိုဂို JPG သို့မဟုတ် PNG ဖြစ်",
  },
};

const CATEGORIES = ["clothes", "electronics", "food", "cosmetics", "second_hand", "other"];

export default function ShopRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdShopLocation, setCreatedShopLocation] = useState<{lat: number; lng: number} | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    name_mm: "",
    category: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    logo: null,
    location: null,
  });

  const t = TRANSLATIONS[language];

  // Load language preference
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t.fileTooLarge);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(t.invalidFileType);
      return;
    }

    setFormData((prev) => ({ ...prev, logo: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
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
        // Basic phone validation
        if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) return t.invalidPhone;
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
      // Get user's location
      let location = formData.location;
      if (!location) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch {
          // Default to Hpa Khant if location not available
          location = { lat: 25.8, lng: 96.3 };
        }
      }

      // Upload logo to Cloudinary if selected
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

      // Create shop in database
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
          location: location,
          owner_id: user?.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create shop");
      }

      // Store location and show success
      setCreatedShopLocation(location);
      setSuccess(true);
      
      // Auto-redirect to map after 2 seconds
      setTimeout(() => {
        router.push(`/map?lat=${location.lat}&lng=${location.lng}&highlight=new`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.success}</h1>
          <p className="text-gray-600 mb-8">{t.successDesc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/shop/dashboard")}
              className="px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              {t.startUploading}
            </button>
            <button
              onClick={() => router.push("/map")}
              className="px-8 py-4 border-2 border-[#667eea] text-[#667eea] rounded-xl font-semibold hover:bg-[#667eea] hover:text-white transition-all"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => step === 1 ? router.push("/map") : handlePrev()}
              className="flex items-center gap-2 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600">{t.back}</span>
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? t.english : t.myanmar}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.createShop}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 ${
                s < step ? "text-green-600" : s === step ? "text-[#667eea]" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s < step
                    ? "bg-green-100"
                    : s === step
                    ? "bg-[#667eea] text-white"
                    : "bg-gray-100"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className="text-sm hidden sm:inline">
                {s === 1 ? t.step1 : s === 2 ? t.step2 : t.step3}
              </span>
              {s < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Shop Name (English) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.shopName}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                  placeholder={t.shopNamePlaceholder}
                />
              </div>

              {/* Shop Name (Myanmar) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.shopNameMM}
                </label>
                <input
                  type="text"
                  value={formData.name_mm}
                  onChange={(e) => handleInputChange("name_mm", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                  placeholder={t.shopNameMMPlaceholder}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.category}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent bg-white"
                >
                  <option value="">{t.selectACategory}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t.categories[cat as keyof typeof t.categories]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.shopLogo}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <Upload className="h-4 w-4 text-gray-700" />
                      <span className="text-sm font-medium text-gray-900">{t.uploadLogo}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">{t.logoHint}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.phone} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder={t.phonePlaceholder}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.address} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none"
                    placeholder={t.addressPlaceholder}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Facebook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.facebook}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 font-bold text-lg">f</span>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange("facebook", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder={t.facebookPlaceholder}
                  />
                </div>
              </div>

              {/* TikTok */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.tiktok}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 font-bold">♪</span>
                  <input
                    type="text"
                    value={formData.tiktok}
                    onChange={(e) => handleInputChange("tiktok", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder={t.tiktokPlaceholder}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  {language === "en" ? "Summary" : "အကျဉ်းချုပ်"}
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-700 font-medium">{t.shopName}:</span> <span className="text-gray-900">{formData.name}</span></p>
                  <p><span className="text-gray-700 font-medium">{t.category}:</span> <span className="text-gray-900">{t.categories[formData.category as keyof typeof t.categories]}</span></p>
                  <p><span className="text-gray-700 font-medium">{t.phone}:</span> <span className="text-gray-900">{formData.phone}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {t.prev}
              </button>
            )}
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.creating}
                </span>
              ) : step === 3 ? (
                t.createShopBtn
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t.next}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
