"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle } from "lucide-react";

export function SignUpForm() {
  const { signUpWithEmail, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string; confirmPassword?: string } = {};

    if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!validatePassword(password)) {
      errors.password = "Password must be at least 8 characters with uppercase, lowercase, and numbers.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const displayName = email.split("@")[0];
      await signUpWithEmail(email, password, displayName);
      setVerificationSent(true);
    } catch (err) {
      console.error("Sign up error:", err);
      // Error is handled by auth context and displayed below
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-dark)]">
          Check your email!
        </h3>
        <p className="text-sm text-[var(--text-gray)]">
          We&apos;ve sent a verification email to <strong>{email}</strong>. Please click the link in the email to verify your account before signing in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="signup-email"
          className="mb-1 block text-sm font-medium text-[var(--text-dark)]"
        >
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
          }}
          className={`w-full rounded-lg border bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:ring-1 ${
            fieldErrors.email
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
              : "border-gray-200/20 focus:border-[var(--gradient-primary-from)] focus:ring-[var(--gradient-primary-from)]"
          }`}
          placeholder="Enter your email"
          required
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium text-[var(--text-dark)]"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
          }}
          className={`w-full rounded-lg border bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:ring-1 ${
            fieldErrors.password
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
              : "border-gray-200/20 focus:border-[var(--gradient-primary-from)] focus:ring-[var(--gradient-primary-from)]"
          }`}
          placeholder="Create a password"
          required
        />
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1 block text-sm font-medium text-[var(--text-dark)]"
        >
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
          }}
          className={`w-full rounded-lg border bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-dark)] placeholder:text-[var(--text-gray)] focus:outline-none focus:ring-1 ${
            fieldErrors.confirmPassword
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
              : "border-gray-200/20 focus:border-[var(--gradient-primary-from)] focus:ring-[var(--gradient-primary-from)]"
          }`}
          placeholder="Confirm your password"
          required
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Sign Up</span>
        )}
      </button>
    </form>
  );
}
