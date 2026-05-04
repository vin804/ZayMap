"use client";

import { useState } from "react";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertTriangle } from "lucide-react";

type AuthTab = "signin" | "signup";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const firebaseNotConfigured = !isFirebaseConfigured;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="card w-full max-w-[600px] p-8">
        {/* Configuration Error Banner */}
        {firebaseNotConfigured && (
          <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
              <div>
                <h3 className="font-semibold text-amber-500">Firebase Not Configured</h3>
                <p className="mt-1 text-sm text-amber-400">
                  Authentication is not available. Please add your Firebase credentials to{" "}
                  <code className="rounded bg-amber-500/20 px-1">.env.local</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex border-b border-gray-200/20">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 pb-3 text-center text-sm font-medium transition-colors ${
              activeTab === "signin"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : "text-[var(--text-gray)] hover:text-[var(--text-dark)]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 pb-3 text-center text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : "text-[var(--text-gray)] hover:text-[var(--text-dark)]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Social Login */}
        <div className="mb-6">
          <SocialLoginButtons mode={activeTab} />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[var(--card-bg)] px-3 text-[var(--text-gray)]">OR</span>
          </div>
        </div>

        {/* Form */}
        {activeTab === "signin" ? <SignInForm /> : <SignUpForm />}

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          {activeTab === "signin" ? (
            <p className="text-[var(--text-gray)]">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setActiveTab("signup")}
                className="font-medium text-[#667eea] hover:underline"
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p className="text-[var(--text-gray)]">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("signin")}
                className="font-medium text-[#667eea] hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
