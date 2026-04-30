"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User,
  Store,
  ArrowRight,
  Globe,
  Loader2
} from "lucide-react";

type Language = "en" | "my";
type UserRole = "consumer" | "producer";

const TRANSLATIONS = {
  en: {
    chooseRole: "Choose Your Role",
    subtitle: "How would you like to use Zaymap?",
    consumer: "I'm a Consumer",
    consumerDesc: "I want to browse and book products from shops",
    producer: "I'm a Shop Owner",
    producerDesc: "I want to list my products and receive bookings",
    continue: "Continue",
    english: "English",
    myanmar: "မြန်မာ",
    loading: "Saving...",
  },
  my: {
    chooseRole: "သင့်အခန်းကဏ္ဍရွေးပါ",
    subtitle: "Zaymap ကို ဘယ်လိုအသုံးပြုချင်ပါသလဲ?",
    consumer: "ဖက်ထရိတ်သည် ဖြစ်",
    consumerDesc: "ဆိုင်များမှ ပစ္စည်းများရှာဖွေ ဘွတ်ကောင့်လိုက်",
    producer: "ဆိုင်ပိုင်ရှင် ဖြစ်",
    producerDesc: "ပစ္စည်းများစာရင်းပြု ဘွတ်ကောင့်လက်ခံရန်",
    continue: "ဆက်သွားမယ်",
    english: "English",
    myanmar: "မြန်မာ",
    loading: "သိမ်းဆည်းနေသည်...",
  },
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);

    try {
      // TODO: Save user role to database
      // For now, just save to localStorage
      localStorage.setItem("user_role", selectedRole);

      if (selectedRole === "producer") {
        router.push("/onboarding/shop-registration");
      } else {
        router.push("/map");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Failed to save role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
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

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.chooseRole}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Consumer Option */}
          <button
            onClick={() => setSelectedRole("consumer")}
            className={`p-8 rounded-2xl border-2 text-left transition-all ${
              selectedRole === "consumer"
                ? "border-[#667eea] bg-[#667eea]/5 shadow-lg"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
              selectedRole === "consumer" ? "bg-[#667eea] text-white" : "bg-gray-100 text-gray-600"
            }`}>
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.consumer}</h3>
            <p className="text-gray-600">{t.consumerDesc}</p>
          </button>

          {/* Producer Option */}
          <button
            onClick={() => setSelectedRole("producer")}
            className={`p-8 rounded-2xl border-2 text-left transition-all ${
              selectedRole === "producer"
                ? "border-[#764ba2] bg-[#764ba2]/5 shadow-lg"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
              selectedRole === "producer" ? "bg-[#764ba2] text-white" : "bg-gray-100 text-gray-600"
            }`}>
              <Store className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.producer}</h3>
            <p className="text-gray-600">{t.producerDesc}</p>
          </button>
        </div>

        {/* Continue Button */}
        <div className="mt-12 text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.loading}
              </>
            ) : (
              <>
                {t.continue}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
