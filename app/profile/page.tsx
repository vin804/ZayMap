"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  Sparkles,
  ShieldAlert,
  Mail,
  Type,
} from "lucide-react";
import { updateProfile, deleteUser } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImages } from "@/lib/upload";

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
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
} as const;

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, firebaseUser, refreshUser } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [language, setLanguage] = useState<"en" | "my">("en");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setPhotoUrl(user.photoUrl || "");
    }
  }, [user]);

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as "en" | "my";
    if (savedLang && (savedLang === "en" || savedLang === "my")) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "my" : "en";
    setLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    if (!file.type.startsWith("image/")) {
      setMessageType("error");
      setMessage("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessageType("error");
      setMessage("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const uploadResult = await uploadImages([file], "user-profiles");

      if (uploadResult.error || uploadResult.urls.length === 0) {
        throw new Error(uploadResult.error || "Failed to upload image");
      }

      const downloadURL = uploadResult.urls[0];

      await updateProfile(firebaseUser, { photoURL: downloadURL });

      if (db) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          photoUrl: downloadURL,
        });
      }

      setPhotoUrl(downloadURL);
      await refreshUser();
      setMessageType("success");
      setMessage("Profile photo updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to upload photo";
      setMessageType("error");
      setMessage(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;

    setDeleting(true);
    try {
      if (db) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, { deleted: true, deletedAt: new Date() });
      }

      await deleteUser(firebaseUser);
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessageType("error");
      setMessage("Failed to delete account. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;

    setSaving(true);
    setMessage("");

    try {
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      if (db) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          displayName: displayName,
        });
      }

      await refreshUser();
      setMessageType("success");
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setMessageType("error");
      setMessage("Failed to update profile");
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
  const helperStyle = { color: "var(--fg-dim)" };

  const hasChanges = displayName !== (user?.displayName || "");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
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
              <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                My Profile
              </h1>
            </div>

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
              {language === "en" ? "EN" : "MY"}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Photo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="relative inline-block">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePhotoClick}
              disabled={uploading}
              className="relative h-28 w-28 overflow-hidden rounded-full border-4 shadow-xl transition-shadow group"
              style={{ borderColor: "var(--bg-elevated)" }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
                  <User className="h-14 w-14 text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </motion.button>

            {/* Camera badge */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePhotoClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </motion.button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <p className="mt-3 text-sm" style={{ color: "var(--fg-dim)" }}>
            {photoUrl ? "Tap to change photo" : "Tap to upload photo"}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border p-6 sm:p-8"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Type className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
              Personal Information
            </h2>
          </div>

          {/* Message Toast */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message}
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mb-5 rounded-2xl border p-4 flex items-start gap-3"
                style={{
                  background:
                    messageType === "success"
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(239,68,68,0.08)",
                  borderColor:
                    messageType === "success"
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(239,68,68,0.2)",
                }}
              >
                {messageType === "success" ? (
                  <Sparkles className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <p
                  className="text-sm font-medium"
                  style={{ color: messageType === "success" ? "#22c55e" : "#ef4444" }}
                >
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            {/* Display Name */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Display Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`${inputBaseClasses} pl-12`}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`${inputBaseClasses} pl-12 cursor-not-allowed`}
                  style={{
                    ...inputStyle,
                    background: "var(--bg-hover)",
                    color: "var(--fg-dim)",
                  }}
                />
              </div>
              <p className="text-xs mt-1.5" style={helperStyle}>
                Email cannot be changed
              </p>
            </motion.div>
          </div>

          {/* Save Button */}
          <motion.div
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            custom={2}
            className="pt-2"
          >
            <motion.button
              whileHover={hasChanges && !saving ? { scale: 1.01 } : {}}
              whileTap={hasChanges && !saving ? { scale: 0.99 } : {}}
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full py-3.5 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5"
              style={{
                background:
                  hasChanges && !saving
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : "var(--bg-hover)",
                color: hasChanges && !saving ? "white" : "var(--fg-dim)",
              }}
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
            </motion.button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-8 pt-8"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-red-500">Danger Zone</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>
              Deleting your account will permanently remove all your data. This action cannot be
              undone.
            </p>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3.5 rounded-xl font-semibold border-2 transition-all flex items-center justify-center gap-2"
              style={{
                borderColor: "rgba(239,68,68,0.3)",
                color: "#ef4444",
                background: "rgba(239,68,68,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)";
              }}
            >
              <Trash2 className="h-5 w-5" />
              Delete Account
            </motion.button>
          </motion.div>
        </motion.div>
      </main>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)" }}
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-red-500">Delete Account?</h3>
                </div>
                <button
                  onClick={() => !deleting && setShowDeleteConfirm(false)}
                  className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                  disabled={deleting}
                >
                  <X className="h-5 w-5 text-red-500" />
                </button>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <p style={{ color: "var(--fg-muted)" }}>
                  This will permanently delete:
                </p>
                <ul className="space-y-2">
                  {[
                    "Your profile and account",
                    "Your saved products",
                    "Your followed shops",
                    "Any reviews you've written",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2" style={{ color: "var(--fg)" }}>
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--fg-dim)" }}
                      />
                      {item}
                    </li>
                  ))}
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-red-500 font-semibold">
                      Your shop and all its products
                    </span>
                  </li>
                </ul>

                <div
                  className="rounded-xl border p-3 mt-4"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    borderColor: "rgba(245,158,11,0.2)",
                  }}
                >
                  <p className="text-xs text-amber-500">
                    <strong>Important:</strong> If you have a shop, all your products and shop data
                    will be permanently deleted. Consider transferring ownership first.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={!deleting ? { scale: 1.01 } : {}}
                  whileTap={!deleting ? { scale: 0.99 } : {}}
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full py-3.5 bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>Yes, Delete Everything</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={!deleting ? { scale: 1.01 } : {}}
                  whileTap={!deleting ? { scale: 0.99 } : {}}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="w-full py-3.5 rounded-xl font-medium border transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--fg)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}