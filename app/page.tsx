"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/map");
      } else {
        router.push("/auth");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--gradient-primary-from)]" />
    </div>
  );
}
