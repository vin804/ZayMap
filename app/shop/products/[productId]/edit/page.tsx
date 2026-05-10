"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { uploadImages } from "@/lib/upload";
import { ProtectedRoute } from "@/components/protected-route";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ImagePlus,
  X,
  Save,
  Pencil,
  Sparkles,
  Trash2,
  Camera,
} from "lucide-react";

const CATEGORIES = [
  { value: "clothes", label: "👕 Clothes", label_mm: "👕 အဝတ်အစား" },
  { value: "electronics", label: "📱 Electronics", label_mm: "📱 အီလက်ထရွန်နစ်" },
  { value: "food", label: "🍜 Food", label_mm: "🍜 အစားအသောက်" },
  { value: "cosmetics", label: "💄 Cosmetics", label_mm: "💄 အလှကုန်" },
  { value: "second_hand", label: "♻️ Second-hand", label_mm: "♻️ ရောင်းချမှု" },
  { value: "other", label: "🏪 Other", label_mm: "🏪 အခြား" },
];

interface ProductFormData {
  name: string;
  name_mm: string;
  description: string;
  price: number;
  category: string;
  images: File[];
  existingImages: string[];
}

const toastVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.2 } },
} as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
} as const;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const { user } = useAuth();
  const { theme } = useTheme();
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
    category: "other",
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
            category: product.category || "other",
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

    return () => {
      isMounted = false;
    };
     }, [user?.uid, productId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Validate file count (max 5 total)
    const totalImages = formData.existingImages.length + formData.images.length + files.length;
    if (totalImages > 5) {
      setError("Maximum 5 images allowed");
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

    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
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
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index),
      }));
    } else {
      // Remove from new images
      const newIndex = index - formData.existingImages.length;
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== newIndex),
      }));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
          category: formData.category,
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
              <Pencil className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            Loading product...
          </p>
        </motion.div>
      </div>
    );
  }

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
            Product Updated!
          </h1>
          <p className="mb-8" style={{ color: "var(--fg-muted)" }}>
            Your product changes have been saved successfully.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/shop/dashboard")}
              className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-shadow"
            >
              Back to Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSuccess(false)}
              className="px-6 py-3 rounded-xl font-semibold border-2 transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--fg)",
                background: "var(--bg-elevated)",
              }}
            >
              Edit Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const inputBaseClasses =
    "w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea]";
  const inputStyle = {
    background: "var(--bg-elevated)",
    borderColor: "var(--border)",
    color: "var(--fg)",
  };
  const labelStyle = { color: "var(--fg)" };
  const helperStyle = { color: "var(--fg-dim)" };
  const optionalStyle = { color: "var(--fg-muted)" };

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
          <div className="max-w-3xl mx-auto px-4 py-3.5">
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
                  <Pencil className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                  Edit Product
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
          </AnimatePresence>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border p-6 sm:p-8 space-y-6"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            {/* Product Name */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                className={inputBaseClasses}
                style={inputStyle}
                required
              />
            </motion.div>

            {/* Product Name (Myanmar) */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Product Name (Myanmar){" "}
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

{/* Description - Auto-expanding editable textarea */}
<motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
  <label className="block text-sm font-semibold mb-2" style={labelStyle}>
    Description{" "}
    <span className="font-normal" style={optionalStyle}>
      (Optional)
    </span>
  </label>
  <AutoExpandingTextarea
    value={formData.description}
    onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
    placeholder="Describe your product..."
    className={`${inputBaseClasses} resize-none overflow-hidden`}
    style={inputStyle}
  />
</motion.div>
            {/* Price */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={3}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Product Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === "" ? 0 : parseInt(value.replace(/^0+/, ""), 10) || 0;
                    setFormData((prev) => ({ ...prev, price: numValue }));
                  }}
                  min={1}
                  className={`${inputBaseClasses} pl-12 pr-16`}
                  style={inputStyle}
                  required
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: "var(--fg-dim)" }}
                >
                  MMK
                </span>
              </div>
              <p className="text-xs mt-1.5" style={helperStyle}>
                Actual price of the product
              </p>
            </motion.div>

            {/* Category */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={4}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className={`${inputBaseClasses} appearance-none cursor-pointer`}
                  style={inputStyle}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Images */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={5}>
              <label className="block text-sm font-semibold mb-1" style={labelStyle}>
                Product Images <span className="text-red-500">*</span>
              </label>
              <p className="text-xs mb-4" style={helperStyle}>
                Upload up to 5 images (max 5MB each)
              </p>

              {/* Image Grid */}
              <AnimatePresence>
                {imagePreviews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-3 mb-4"
                  >
                    {imagePreviews.map((preview, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                        className="relative w-24 h-24 rounded-2xl overflow-hidden border group"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <Trash2 className="h-3 w-3" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Image Button */}
              <AnimatePresence>
                {imagePreviews.length < 5 && (
                  <motion.label
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-2 w-28 h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 hover:border-[#667eea] hover:bg-[#667eea]/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="text-center">
                      <Camera className="h-5 w-5 mx-auto mb-1" style={{ color: "var(--fg-dim)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--fg)" }}>
                        Add Image
                      </span>
                      <span className="text-[10px] block mt-0.5" style={{ color: "var(--fg-dim)" }}>
                        {imagePreviews.length}/5
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </motion.label>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              custom={6}
              className="pt-2"
            >
              <motion.button
                whileHover={!saving ? { scale: 1.01 } : {}}
                whileTap={!saving ? { scale: 0.99 } : {}}
                type="submit"
                disabled={saving}
                className="w-full py-3.5 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                }}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Uploading images...</span>
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving changes...</span>
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

function AutoExpandingTextarea({
  value,
  onChange,
  placeholder,
  className,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
  style: React.CSSProperties;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on mount and whenever value changes
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
      className={className}
      style={{ ...style, minHeight: "52px" }}
    />
  );
}