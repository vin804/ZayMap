import { Suspense } from "react";
import ClientPage from "./client-page";
import { Loader2 } from "lucide-react";

export default function AddProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    }>
      <ClientPage />
    </Suspense>
  );
}