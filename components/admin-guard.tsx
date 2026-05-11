"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ShieldAlert } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, initializing, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing) {
      if (!user) {
        router.push("/auth");
      } else if (!isAdmin) {
        router.push("/");
      }
    }
  }, [initializing, user, isAdmin, router]);

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-[var(--fg-muted)]">Access denied</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}