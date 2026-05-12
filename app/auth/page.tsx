"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertTriangle, Store, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

type AuthTab = "signin" | "signup";

function ClaimBanner({
  user,
  onClaim,
  claiming,
}: {
  user: { uid: string } | null;
  onClaim: () => void;
  claiming: boolean;
}) {
  const [claimShop, setClaimShop] = useState<any>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimShopId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("claim")
    : null;

  useEffect(() => {
    if (claimShopId) {
      fetch(`/api/admin/shops/${claimShopId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.data && !data.data.isClaimed) {
            setClaimShop(data.data);
          }
        });
    }
  }, [claimShopId]);

  const handleSwitchAccount = async () => {
    try {
      const { auth } = await import("@/lib/firebase");
      if (auth) {
        await auth.signOut();
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  if (!claimShop) return null;

  return (
    <div className="mb-5 rounded-xl bg-[#667eea]/10 border border-[#667eea]/20 p-4">
      <div className="flex items-start gap-3">
        <Store className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#667eea]" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-[#667eea]">Claim Shop: {claimShop.name}</h3>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            {user
              ? "Click the button below to claim ownership of this shop. Your GPS location will become the shop location."
              : "Sign up or sign in to claim ownership of this shop. Your GPS location will become the shop location."}
          </p>
          {claimError && (
            <p className="mt-2 text-xs text-red-500">{claimError}</p>
          )}
          {user && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={onClaim}
                disabled={claiming}
                className="bg-[#667eea] hover:bg-[#5a67d8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {claiming ? "Claiming..." : "Claim This Shop"}
              </button>
              <button
                onClick={handleSwitchAccount}
                className="text-xs text-[var(--fg-muted)] hover:text-red-500 transition-colors"
              >
                Use different account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const firebaseNotConfigured = !isFirebaseConfigured;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const hasAttemptedClaim = useRef(false);

  // Capture whether user was logged in when page FIRST loaded
  // useRef initial value is evaluated once on mount
  const wasLoggedInOnMount = useRef(!!user);

  const claimShopId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("claim")
    : null;

  // Auto-claim for FRESH logins (user was NOT logged in when page loaded)
  useEffect(() => {
    if (loading || !user || !claimShopId || hasAttemptedClaim.current) return;
    if (wasLoggedInOnMount.current) return; // Already logged in - manual claim only

    hasAttemptedClaim.current = true;
    setIsClaiming(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/admin/shops/${claimShopId}/claim`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
            body: JSON.stringify({
              user_lat: pos.coords.latitude,
              user_lng: pos.coords.longitude,
            }),
          });

          if (res.ok) {
            router.push("/shop/dashboard");
          } else {
            const err = await res.json();
            setClaimError(err.error || "Failed to claim shop");
            setIsClaiming(false);
          }
        } catch (e: any) {
          setClaimError(e.message || "Failed to claim shop");
          setIsClaiming(false);
        }
      },
      (err) => {
        setClaimError("Location access is required to claim a shop");
        setIsClaiming(false);
      },
      { timeout: 10000 }
    );
  }, [user, loading, claimShopId, router]);

  // Normal redirect when NO claim param
  useEffect(() => {
    if (loading) return;
    if (claimShopId) return; // Stay on page for claim flow
    if (user) {
      router.push("/map");
    }
  }, [user, loading, claimShopId, router]);

  // Manual claim handler for already-logged-in users
  const handleManualClaim = () => {
    if (!user || !claimShopId || isClaiming) return;
    setIsClaiming(true);
    setClaimError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/admin/shops/${claimShopId}/claim`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
            body: JSON.stringify({
              user_lat: pos.coords.latitude,
              user_lng: pos.coords.longitude,
            }),
          });

          if (res.ok) {
            router.push("/shop/dashboard");
          } else {
            const err = await res.json();
            setClaimError(err.error || "Failed to claim shop");
            setIsClaiming(false);
          }
        } catch (e: any) {
          setClaimError(e.message || "Failed to claim shop");
          setIsClaiming(false);
        }
      },
      (err) => {
        setClaimError("Location access is required to claim a shop");
        setIsClaiming(false);
      },
      { timeout: 10000 }
    );
  };

  if (isClaiming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#667eea] mx-auto mb-4" />
          <p className="text-[var(--fg)] font-medium">Claiming your shop...</p>
          <p className="text-xs text-[var(--fg-muted)] mt-2">Please allow location access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/10 blur-3xl" />
        <div className="orb-2 absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#764ba2]/15 to-[#667eea]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
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

        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[0_20px_48px_rgba(15,17,26,0.08)] p-6 sm:p-8">
          {claimError && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500">
              {claimError}
            </div>
          )}

          <Suspense fallback={null}>
            <ClaimBanner
              user={user}
              onClaim={handleManualClaim}
              claiming={isClaiming}
            />
          </Suspense>

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

          <div className="mb-5">
            <SocialLoginButtons mode={activeTab} />
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-elevated)] px-3 text-[var(--fg-muted)] uppercase tracking-wider">or continue with email</span>
            </div>
          </div>

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
