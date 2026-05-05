"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, User, LogIn } from "lucide-react";

interface AuthGuardProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function AuthGuardModal({ isOpen, onClose, featureName }: AuthGuardProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200/20">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-500/10 transition-colors"
        >
          <X className="h-5 w-5 text-[var(--text-gray)]" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-[#667eea]/10 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-[#667eea]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[var(--text-dark)] text-center mb-2">
          Sign in Required
        </h2>

        {/* Description */}
        <p className="text-[var(--text-gray)] text-center mb-6">
          You need to sign in to {featureName}. Create an account to access all features.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/auth")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#667eea] text-white px-4 py-3 font-medium hover:bg-[#5a67d8] transition-all"
          >
            <User className="h-5 w-5" />
            Sign up
          </button>

          <button
            onClick={() => router.push("/auth")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-dark)] px-4 py-3 font-medium hover:bg-gray-500/10 transition-all"
          >
            <LogIn className="h-5 w-5" />
            Log in
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-4 text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors text-sm"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

// Hook to use auth guard
export function useAuthGuard() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState("");

  const checkAuth = (user: unknown, feature: string): boolean => {
    if (!user) {
      setFeatureName(feature);
      setIsOpen(true);
      return false;
    }
    return true;
  };

  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    featureName,
    checkAuth,
    closeModal,
    AuthGuardModal: () => (
      <AuthGuardModal
        isOpen={isOpen}
        onClose={closeModal}
        featureName={featureName}
      />
    ),
  };
}
