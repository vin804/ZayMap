"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { FacebookAuthProvider, signInWithPopup, linkWithCredential, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface SocialLoginButtonsProps {
  mode: "signin" | "signup";
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading("google");
    try {
      await signInWithGoogle();
    } catch {
      // Error is handled by auth context
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading("facebook");
    try {
      if (!auth) throw new Error("Auth not initialized");
      // Create fresh provider instance with ONLY public_profile
      // Must use custom OAuth flow to avoid Firebase's default email scope
      const fbProvider = new FacebookAuthProvider();
      // Set ONLY public_profile - no email
      fbProvider.setCustomParameters({
        scope: "public_profile"
      });
      // Use popup for better reliability
      const result = await signInWithPopup(auth, fbProvider);
      console.log("[Facebook Login] Success:", result.user.uid);
      // Redirect to map on success
      router.push("/map");
    } catch (error: any) {
      console.error("[Facebook Login] Error:", error);
      
      // Handle account exists with different credential
      if (error?.code === "auth/account-exists-with-different-credential") {
        const email = error?.customData?.email;
        const pendingCred = FacebookAuthProvider.credentialFromError(error);
        
        if (email && pendingCred) {
          // Check what methods are available for this email
          const methods = await fetchSignInMethodsForEmail(auth, email);
          console.log("[Facebook Login] Existing methods for", email, ":", methods);
          
          // For now, show an alert - user should login with existing method
          alert(`An account already exists with ${email}. Please sign in with ${methods[0] || "your existing method"} first, then link Facebook in your profile settings.`);
        } else {
          alert("An account already exists with this email. Please sign in with your existing method.");
        }
      } else if (error?.code === "auth/popup-closed-by-user") {
        // User closed popup, no error needed
        console.log("[Facebook Login] Popup closed by user");
      } else {
        alert("Facebook login failed. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  const buttonText = mode === "signin" ? "Sign In" : "Sign Up";

  return (
    <div className="space-y-3">
      <button
        onClick={handleGoogleSignIn}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200/20 bg-[var(--card-bg)] px-4 py-3 text-sm font-medium text-[var(--text-dark)] transition-colors hover:bg-gray-500/10 disabled:opacity-50 sm:flex-row"
      >
        {loading === "google" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{buttonText} with Google</span>
      </button>

          </div>
  );
}
