"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ArrowLeft, CheckCircle, Info } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch {
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="card w-full max-w-[420px]">
        <Link
          href="/auth"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-gray)] hover:text-[var(--text-dark)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <h1 className="mb-2 text-2xl font-semibold text-[var(--text-dark)]">
          Forgot Password?
        </h1>
        <p className="mb-6 text-sm text-[var(--text-gray)]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-center text-lg font-semibold text-[var(--text-dark)]">
              Check your email!
            </h3>
            <p className="text-center text-sm text-[var(--text-gray)]">
              We&apos;ve sent password reset instructions to <strong>{email}</strong>.
            </p>
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <p className="text-sm text-blue-700">
                  The reset link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
                </p>
              </div>
            </div>
            <Link
              href="/auth"
              className="block w-full rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[var(--gradient-primary-from)] focus:outline-none focus:ring-1 focus:ring-[var(--gradient-primary-from)]"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
