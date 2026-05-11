"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Store,
  Package,
  Users,
  Activity,
  Shield,
  MessageSquare,
  BarChart3,
  Settings,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface StatsData {
  shops: number;
  products: number;
  users: number;
  health: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    shops: 0,
    products: 0,
    users: 0,
    health: "checking",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          console.error("[Dashboard] Stats API error:", r.status, text);
          throw new Error(`HTTP ${r.status}: ${text}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("[Dashboard] Stats response:", data);
        if (data && !data.error) {
          setStats({
            shops: data.shops ?? 0,
            products: data.products ?? 0,
            users: data.users ?? 0,
            health: data.health ?? "unknown",
          });
        } else {
          console.error("[Dashboard] Stats returned error:", data.error);
          setStats((prev) => ({ ...prev, health: "error" }));
        }
      })
      .catch((err) => {
        console.error("[Dashboard] Failed to load stats:", err);
        setStats((prev) => ({ ...prev, health: "error" }));
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Shops",
      value: loading ? "—" : stats.shops,
      icon: Store,
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Products",
      value: loading ? "—" : stats.products,
      icon: Package,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Users",
      value: loading ? "—" : stats.users,
      icon: Users,
      color: "from-[#667eea] to-[#764ba2]",
    },
    {
      label: "System",
      value: loading ? "..." : stats.health,
      icon: Activity,
      color: "from-orange-500 to-amber-600",
    },
  ];

  const modules = [
    {
      title: "Shop Management",
      desc: "View, verify, and manage all shops on the platform",
      icon: Store,
      href: "/admin/shops",
      color: "from-blue-500 to-cyan-600",
      badge: null,
    },
    {
      title: "Product Catalog",
      desc: "Browse and moderate products across all shops",
      icon: Package,
      href: "/admin/products",
      color: "from-green-500 to-emerald-600",
      badge: null,
    },
    {
      title: "Review Moderation",
      desc: "Moderate reviews and handle user reports",
      icon: MessageSquare,
      href: "/admin/reviews",
      color: "from-purple-500 to-indigo-600",
      badge: null,
    },
    {
      title: "User Directory",
      desc: "View registered users and their activity",
      icon: Users,
      href: "/admin/users",
      color: "from-[#667eea] to-[#764ba2]",
      badge: "Soon",
    },
    {
      title: "Analytics",
      desc: "Platform growth, traffic, and conversion stats",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "from-pink-500 to-rose-600",
      badge: "Soon",
    },
    {
      title: "Settings",
      desc: "Admin configuration and platform preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "from-slate-500 to-slate-600",
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-elevated)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--fg)]">Admin Dashboard</h1>
                <p className="text-xs text-[var(--fg-muted)]">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Admin
              </span>
              <button
                onClick={() => router.push("/map")}
                className="btn-outline text-sm px-4 py-2"
              >
                Back to App
              </button>
              <button
                onClick={logout}
                className="btn-ghost w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-500/10"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-5 shadow-[0_4px_16px_rgba(15,17,26,0.05)] hover:border-[var(--border-hover)] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-[var(--fg)] capitalize">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Admin Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.title}
              onClick={() => router.push(mod.href)}
              className="text-left bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-6 shadow-[0_4px_16px_rgba(15,17,26,0.05)] hover:shadow-[0_12px_32px_rgba(15,17,26,0.08)] hover:border-[var(--border-hover)] transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}
                >
                  <mod.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  {mod.badge && (
                    <span className="badge badge-blue text-[10px]">{mod.badge}</span>
                  )}
                  <ArrowRight className="h-5 w-5 text-[var(--fg-muted)] group-hover:text-[var(--fg)] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[var(--fg)] mb-1">{mod.title}</h3>
              <p className="text-sm text-[var(--fg-muted)]">{mod.desc}</p>
            </button>
          ))}
        </div>

        {/* Quick Info */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] p-5 shadow-[0_4px_16px_rgba(15,17,26,0.05)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">Admin Access</h3>
              <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                You are logged in as the platform administrator. Changes you make here affect the entire ZayMap platform.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}