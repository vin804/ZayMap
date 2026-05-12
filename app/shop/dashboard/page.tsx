import { Suspense } from "react";
import ShopDashboardPage from "./dashboard-client";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex h-screen items-center justify-center"
          style={{ background: "var(--background)" }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] animate-pulse" />
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            />
          </div>
        </div>
      }
    >
      <ShopDashboardPage />
    </Suspense>
  );
}