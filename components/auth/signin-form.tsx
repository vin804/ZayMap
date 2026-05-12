"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";

export function SignInForm() {
  const { signInWithEmail, error, clearError, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (user) {
      // Don't redirect if we're in a claim flow — let AuthPage handle it
      const hasClaim = typeof window !== "undefined" && 
        new URLSearchParams(window.location.search).get("claim");
      if (!hasClaim) {
        window.location.href = "/map";
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field !pl-10"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field !pl-10"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--accent)] focus:ring-[var(--accent)]/20"
          />
          <span className="text-sm text-[var(--fg-muted)]">Remember me</span>
        </label>
        <Link href="/auth/forgot-password" className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors">
          Forgot password?
        </Link>
      </div>

      <button type="submit" disabled={loading} className="btn-gradient w-full mt-2">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}