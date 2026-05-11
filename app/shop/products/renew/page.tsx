"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { ProtectedRoute } from "@/components/protected-route";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

interface Product {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  image_urls: string[];
  price?: number;
  updated_at?: string;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const toastVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
};

export default function RenewProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "my">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as "en" | "my";
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);

        // Fetch shop
        const shopRes = await fetch(`/api/shops/my-shop?owner_id=${user.uid}`);
        if (!shopRes.ok) {
          router.push("/onboarding/shop-registration");
          return;
        }
        const shopData = await shopRes.json();
        const shopId = shopData.data.shop_id;

        // Fetch products
        const productsRes = await fetch(`/api/shops/${shopId}/products`);
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.data?.products || []);
        }
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user?.uid, router]);

  // Toggle individual product selection
  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Select/deselect all products
  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.product_id)));
    }
  };

  // Get relative time display
  const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const translations = {
    en: {
      renewHeading: "What is Renew?",
      renewBody: `Renewing a product updates its timestamp to show customers that the item is still in stock. The product will display as "updated today" or "updated X days ago" instead of its original upload date.`,
    },
    my: {
      renewHeading: "ပြန်အသက်သွင်းခြင်း ဆိုသည်မှာ?",
      renewBody: `ပစ္စည်းကို ပြန်အသက်သွင်းခြင်းသည် ၀ယ်သူများအား အရောင်းခင်းပေါ်တွင် ပစ္စည်းသည် သိုလှောင်ပြီး ထပ်မံ ရောင်းချနိုင်နေကြောင်း ပြသရန် အချိန်စာရင်းကို နောက်ဆုံးအပ်ဒိတ်ပေးခြင်းဖြစ်သည်။ ပစ္စည်းသည် မူလတင်သည့်ရက်မဟုတ်ဘဲ "ယနေ့အပ်ဒိတ်ပြီး" သို့မဟုတ် "X ရက်ကြာပြီ" ဟု ပြသမည်ဖြစ်သည်။`,
    },
  };

  // Renew selected products
  const handleRenew = async () => {
    if (selectedProducts.size === 0) {
      setError("Please select at least one product to renew");
      return;
    }

    setRenewing(true);
    setError(null);
    setSuccess(null);

    try {
      const promises = Array.from(selectedProducts).map(async (productId) => {
        const res = await fetch(`/api/products/${productId}/renew`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          console.error(`Renew failed for ${productId}:`, errorData);
          throw new Error(`Failed to renew product ${productId}: ${errorData.error || res.statusText}`);
        }
        return res.json();
      });

      await Promise.all(promises);

      // Update local state to reflect new timestamps
      const now = new Date().toISOString();
      setProducts(
        products.map((p) =>
          selectedProducts.has(p.product_id)
            ? { ...p, upload_timestamp: now, updated_at: now }
            : p
        )
      );

      setSuccess(`Successfully renewed ${selectedProducts.size} product(s)`);
      setSelectedProducts(new Set());

      // Refresh products to get updated timestamps from server
      setTimeout(() => {
        if (user?.uid) {
          fetch(`/api/shops/my-shop?owner_id=${user.uid}`)
            .then((res) => res.json())
            .then((shopData) => {
              const shopId = shopData.data?.shop_id;
              if (shopId) {
                return fetch(`/api/shops/${shopId}/products`);
              }
            })
            .then((res) => res?.json())
            .then((data) => {
              if (data?.data?.products) {
                setProducts(data.data.products);
              }
            })
            .catch(console.error);
        }
      }, 500);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Renew error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to renew: ${errorMessage}`);
    } finally {
      setRenewing(false);
    }
  };

  const selectedCount = selectedProducts.size;
  const totalCount = products.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Header */}
        <header
          className="sticky top-0 z-30 border-b backdrop-blur-xl"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3.5">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/shop/dashboard")}
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
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                  Renew Products
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
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
                <p className="text-sm font-medium text-emerald-500">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl border p-5 mb-6 relative overflow-hidden"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none"
              style={{
                background: "radial-gradient(circle, #667eea 0%, transparent 70%)",
              }}
            />
            <div className="flex items-start gap-4 relative z-10">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center border border-[#667eea]/20">
                <Sparkles className="h-5 w-5 text-[#667eea]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
                  {translations[language].renewHeading}
                </h3>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {translations[language].renewBody}
                </p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center animate-pulse">
                  <RefreshCw className="h-6 w-6 text-white animate-spin" />
                </div>
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                  style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
                />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
                Loading your products...
              </p>
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20 rounded-3xl border"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 flex items-center justify-center border border-[#667eea]/10"
              >
                <Package className="h-10 w-10 text-[#667eea]" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--fg)" }}>
                No products yet
              </h3>
              <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "var(--fg-muted)" }}>
                Add some products first, then come back here to keep them fresh
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/shop/products/add")}
                className="px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-shadow"
              >
                Add Your First Product
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Actions Bar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl border p-4 mb-5 sticky top-20 z-20 backdrop-blur-xl"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="peer sr-only"
                        />
                        <div
                          className="w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center"
                          style={{
                            borderColor: allSelected ? "#667eea" : "var(--border)",
                            background: allSelected
                              ? "linear-gradient(135deg, #667eea, #764ba2)"
                              : "var(--bg-elevated)",
                          }}
                        >
                          {allSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </div>
                      <span
                        className="text-sm font-medium transition-colors"
                        style={{ color: "var(--fg)" }}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </span>
                    </label>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: selectedCount > 0 ? "rgba(102,126,234,0.1)" : "var(--bg-hover)",
                        color: selectedCount > 0 ? "#667eea" : "var(--fg-dim)",
                      }}
                    >
                      {selectedCount} of {totalCount} selected
                    </span>
                  </div>

                  <motion.button
                    whileHover={selectedCount > 0 && !renewing ? { scale: 1.03 } : {}}
                    whileTap={selectedCount > 0 && !renewing ? { scale: 0.97 } : {}}
                    onClick={handleRenew}
                    disabled={renewing || selectedCount === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    style={{
                      background:
                        selectedCount > 0 && !renewing
                          ? "linear-gradient(135deg, #667eea, #764ba2)"
                          : "var(--bg-hover)",
                      color: selectedCount > 0 && !renewing ? "white" : "var(--fg-dim)",
                    }}
                  >
                    {renewing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Renewing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Renew Selected</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Products List */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {products.map((product, index) => {
                  const isSelected = selectedProducts.has(product.product_id);
                  const dateStr = product.updated_at || product.created_at;
                  const lastUpdated = dateStr ? new Date(dateStr) : new Date();
                  const isValidDate = !isNaN(lastUpdated.getTime());
                  const daysSinceUpdate = isValidDate
                    ? Math.floor(
                        (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
                      )
                    : Infinity;
                  const isFresh = isValidDate && daysSinceUpdate <= 1;
                  const isRecent = isValidDate && daysSinceUpdate >= 2 && daysSinceUpdate <= 7;

                  const statusConfig = isFresh
                    ? {
                        label: "Fresh",
                        bg: "rgba(34,197,94,0.1)",
                        border: "rgba(34,197,94,0.2)",
                        text: "#22c55e",
                        icon: ShieldCheck,
                      }
                    : isRecent
                    ? {
                        label: "Recent",
                        bg: "rgba(245,158,11,0.1)",
                        border: "rgba(245,158,11,0.2)",
                        text: "#f59e0b",
                        icon: CalendarDays,
                      }
                    : {
                        label: "Needs Renew",
                        bg: "rgba(239,68,68,0.1)",
                        border: "rgba(239,68,68,0.2)",
                        text: "#ef4444",
                        icon: Clock,
                      };

                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={product.product_id}
                      variants={itemVariants}
                      layout
                      onClick={() => toggleProduct(product.product_id)}
                      className="group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200"
                      style={{
                        background: isSelected
                          ? "rgba(102,126,234,0.06)"
                          : "var(--bg-elevated)",
                        borderColor: isSelected
                          ? "rgba(102,126,234,0.3)"
                          : "var(--border)",
                      }}
                      whileHover={{
                        y: -2,
                        boxShadow:
                          theme === "dark"
                            ? "0 8px 30px rgba(0,0,0,0.3)"
                            : "0 8px 30px rgba(0,0,0,0.08)",
                      }}
                    >
                      {/* Selection indicator line */}
                      <div
                        className="absolute left-0 top-4 bottom-4 w-1 rounded-full transition-all duration-300"
                        style={{
                          background: isSelected
                            ? "linear-gradient(180deg, #667eea, #764ba2)"
                            : "transparent",
                          opacity: isSelected ? 1 : 0,
                        }}
                      />

                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProduct(product.product_id)}
                              onClick={(e) => e.stopPropagation()}
                              className="peer sr-only"
                            />
                            <div
                              className="w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center"
                              style={{
                                borderColor: isSelected
                                  ? "#667eea"
                                  : "var(--border)",
                                background: isSelected
                                  ? "linear-gradient(135deg, #667eea, #764ba2)"
                                  : "var(--bg-elevated)",
                              }}
                            >
                              {isSelected && (
                                <CheckCircle className="h-3.5 w-3.5 text-white" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border"
                          style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                          {product.image_urls?.[0] ? (
                            <img
                              src={product.image_urls[0]}
                              alt={product.product_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <Package className="h-7 w-7" style={{ color: "var(--fg-dim)" }} />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-medium text-sm truncate group-hover:text-[#667eea] transition-colors"
                            style={{ color: "var(--fg)" }}
                          >
                            {product.product_name}
                          </h3>
                          <p className="text-sm font-bold mt-0.5" style={{ color: "#667eea" }}>
                            {product.price?.toLocaleString() || "0"} MMK
                          </p>
                          <div className="flex items-center gap-1.5 text-xs mt-1.5">
                            <StatusIcon
                              className="h-3 w-3"
                              style={{ color: statusConfig.text }}
                            />
                            <span style={{ color: "var(--fg-dim)" }}>
                              {isValidDate ? (
                                <span style={{ color: statusConfig.text, fontWeight: 500 }}>
                                  Updated {getRelativeTime(lastUpdated.toISOString())}
                                </span>
                              ) : (
                                <span style={{ color: "var(--fg-dim)" }}>No update date</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0 hidden sm:block">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border"
                            style={{
                              background: statusConfig.bg,
                              borderColor: statusConfig.border,
                              color: statusConfig.text,
                            }}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronRight
                          className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                          style={{ color: "var(--fg-dim)" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Bottom summary */}
              {selectedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    <span className="font-semibold" style={{ color: "#667eea" }}>
                      {selectedCount}
                    </span>{" "}
                    product{selectedCount !== 1 ? "s" : ""} selected for renewal
                  </p>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}