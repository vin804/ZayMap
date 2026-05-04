"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { User, Camera, ArrowLeft, Save, Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImages } from "@/lib/upload";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setPhotoUrl(user.photoUrl || "");
    }
  }, [user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadImages([file], "user-profiles");
      
      if (uploadResult.error || uploadResult.urls.length === 0) {
        throw new Error(uploadResult.error || "Failed to upload image");
      }

      const downloadURL = uploadResult.urls[0];

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { photoURL: downloadURL });

      // Also update Firestore to keep data in sync
      if (db) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          photoUrl: downloadURL,
        });
      }

      setPhotoUrl(downloadURL);
      await refreshUser();
      setMessage("Profile photo updated successfully!");
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to upload photo";
      setMessage(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;

    setSaving(true);
    setMessage("");

    try {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      // Also update Firestore to keep data in sync
      if (db) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          displayName: displayName,
        });
      }

      await refreshUser();
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--card-bg)] shadow-sm border-b border-gray-200/20">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-lg p-2 text-[var(--text-gray)] hover:bg-gray-500/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-[var(--text-dark)]">My Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Profile Photo Section */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <button
              onClick={handlePhotoClick}
              disabled={uploading}
              className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[var(--card-bg)] shadow-lg hover:shadow-xl transition-all group"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
                  <User className="h-16 w-16 text-white" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
            </button>
            {/* Camera button badge */}
            <button
              onClick={handlePhotoClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#667eea] text-white shadow-lg hover:bg-[#764ba2] transition-colors disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="mt-3 text-sm text-[var(--text-gray)]">
            Click to {photoUrl ? "change" : "upload"} profile photo
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-[var(--card-bg)] p-6 shadow-sm border border-gray-200/20">
          <h2 className="mb-6 text-lg font-semibold text-[var(--text-dark)]">
            Personal Information
          </h2>

          {message && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                message.toLowerCase().includes("success")
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-gray)]">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-gray-200/20 bg-[var(--card-bg)] px-4 py-2.5 text-[var(--text-dark)] focus:border-[#667eea] focus:outline-none focus:ring-2 focus:ring-[#667eea]/20"
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-gray)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-gray-200/20 bg-gray-500/10 px-4 py-2.5 text-[var(--text-gray)]"
              />
              <p className="mt-1 text-xs text-[var(--text-gray)]">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || displayName === (user?.displayName || "")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-6 py-3 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
