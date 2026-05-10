"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle, Mail, Lock, ShieldCheck } from "lucide-react";

export function SignUpForm() {
  const { signUpWithEmail, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pw: string) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 8;

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    if (!validateEmail(email)) errors.email = "Please enter a valid email address.";
    if (!validatePassword(password)) errors.password = "Password must be at least 8 characters with uppercase, lowercase, and numbers.";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const displayName = email.split("@")[0];
      await signUpWithEmail(email, password, displayName);
      setVerificationSent(true);
    } catch {
      // handled by context
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-[var(--fg)] mb-2">Check your email!</h3>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          We&apos;ve sent a verification email to <strong className="text-[var(--fg)]">{email}</strong>. Please click the link to verify your account before signing in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined }); }}
            className={`input-field !pl-10 ${fieldErrors.email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            placeholder="you@example.com"
            required
          />
        </div>
        {fieldErrors.email && <p className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined }); }}
            className={`input-field !pl-10 ${fieldErrors.password ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            placeholder="••••••••"
            required
          />
        </div>
        {fieldErrors.password && <p className="mt-1.5 text-xs text-red-500">{fieldErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)]" />
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined }); }}
            className={`input-field !pl-10 ${fieldErrors.confirmPassword ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            placeholder="••••••••"
            required
          />
        </div>
        {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-gradient w-full mt-2">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}