"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function SignInForm() {
  const { signInWithEmail, error, clearError, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect when user is authenticated
  useEffect(() => {
    if (user) {
      console.log("User detected, redirecting to /map");
      window.location.href = "/map";
    }
  }, [user]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateEmail(email)) {
      return;
    }

    if (password.length < 1) {
      return;
    }

    setLoading(true);
    console.log("Attempting sign in...");
    try {
      await signInWithEmail(email, password);
      console.log("Sign in successful, waiting for auth state...");
      // Redirect is handled by useEffect when user state updates
    } catch (err) {
      console.error("Sign in error in component:", err);
      setLoading(false);
      // Error is handled by auth context and displayed below
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-[var(--text-dark)]"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200/20 bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:border-[var(--gradient-primary-from)] focus:outline-none focus:ring-1 focus:ring-[var(--gradient-primary-from)]"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-[var(--text-dark)]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200/20 bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:border-[var(--gradient-primary-from)] focus:outline-none focus:ring-1 focus:ring-[var(--gradient-primary-from)]"
          placeholder="Enter your password"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-500/30 bg-[var(--card-bg)] text-[var(--gradient-primary-from)] focus:ring-[var(--gradient-primary-from)]"
          />
          <span className="text-sm text-[var(--text-gray)]">Remember me</span>
        </label>
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-[var(--gradient-primary-from)] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>
    </form>
  );
}
