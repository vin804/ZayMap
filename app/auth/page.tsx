"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

type AuthTab = "signin" | "signup";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const firebaseNotConfigured = !isFirebaseConfigured;
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/map");
    }
  }, [user, loading, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 overflow-hidden">
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/10 blur-3xl" />
        <div className="orb-2 absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#764ba2]/15 to-[#667eea]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/logo.png"
            alt="ZayMap"
            className="h-10 w-10 object-contain rounded-xl"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            ZayMap
          </span>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[0_20px_48px_rgba(15,17,26,0.08)] p-6 sm:p-8">
          {/* Firebase Error */}
          {firebaseNotConfigured && (
            <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-sm text-amber-500">Firebase Not Configured</h3>
                  <p className="mt-1 text-xs text-amber-400 leading-relaxed">
                    Authentication is not available. Please add your Firebase credentials to{" "}
                    <code className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px]">.env.local</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="relative mb-6 flex">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
                activeTab === "signin" ? "text-[var(--fg)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
                activeTab === "signup" ? "text-[var(--fg)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Sign Up
            </button>
            <motion.div
              className="absolute bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              initial={false}
              animate={{ left: activeTab === "signin" ? "0%" : "50%", width: "50%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border)]" />
          </div>

          {/* Social Login */}
          <div className="mb-5">
            <SocialLoginButtons mode={activeTab} />
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-elevated)] px-3 text-[var(--fg-muted)] uppercase tracking-wider">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "signin" ? <SignInForm /> : <SignUpForm />}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            {activeTab === "signin" ? (
              <p className="text-[var(--fg-muted)]">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setActiveTab("signup")}
                  className="font-semibold text-[#667eea] hover:text-[#5a67d8] transition-colors"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-[var(--fg-muted)]">
                Already have an account?{" "}
                <button
                  onClick={() => setActiveTab("signin")}
                  className="font-semibold text-[#667eea] hover:text-[#5a67d8] transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}