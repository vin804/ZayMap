"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GemstoneSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shopId, setShopId] = useState("hk-1777344831862-5");

  const createProducts = async () => {
    setLoading(true);
    setMessage("Creating 30 gemstone products...");

    try {
      const res = await fetch("/api/seed-gemstone-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}\n${data.products.slice(0, 5).join(", ")}... and more!`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ Failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const updateLogo = async () => {
    setLoading(true);
    setMessage("Updating shop logo...");

    try {
      const res = await fetch("/api/update-shop-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ Failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const doEverything = async () => {
    await updateLogo();
    await createProducts();
    setMessage("✅ All done! Refresh the Gemstone Shop page to see the changes.");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Gemstone Shop Setup</h1>
        
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop ID (from URL: /shop/hk-1777344831862-5)
          </label>
          <input
            type="text"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800 whitespace-pre-wrap">
            {message}
          </div>
        )}
        
        <div className="mb-6 space-y-2">
          <button
            onClick={updateLogo}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            1. Update Shop Logo & Description
          </button>
          
          <button
            onClick={createProducts}
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50"
          >
            2. Create 30 Gemstone Products
          </button>
          
          <button
            onClick={doEverything}
            disabled={loading}
            className="w-full rounded-lg bg-[#667eea] px-4 py-3 text-white hover:bg-[#5a6fd6] disabled:opacity-50"
          >
            ⚡ Do Everything (Logo + 30 Products)
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/shop/${shopId}`)}
            className="rounded-lg border border-[#667eea] px-4 py-2 text-[#667eea] hover:bg-[#667eea] hover:text-white"
          >
            View Shop
          </button>
          
          <button
            onClick={() => router.push("/map")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Go to Map
          </button>
        </div>

        <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">What will be created:</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            <li>Gemstone logo and professional description</li>
            <li>30 gemstone/jewelry products including:</li>
            <li>Myanmar Imperial Jade Bangle (2.5M MMK)</li>
            <li>Burmese Ruby Ring (1.8M MMK)</li>
            <li>Jadeite Pendant (3.2M MMK)</li>
            <li>Blue Sapphire Necklace (1.5M MMK)</li>
            <li>And 26 more products...</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
