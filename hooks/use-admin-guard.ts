"use client";

import { useAuth } from "@/lib/auth-context";
import { ADMIN_UID } from "@/lib/admin-config";

export function useAdminGuard() {
  const { user, loading } = useAuth();

  const isAdmin = user?.uid === ADMIN_UID;

  return { isAdmin, user, loading };
}
