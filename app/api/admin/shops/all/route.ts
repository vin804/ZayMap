import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
// Admin SDK uses native .collection().get()

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const snapshot = await adminDb.collection("shops").get();

    const rawShops = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        shop_id: doc.id,
        name: data.name || "Unnamed Shop",
        category: data.category || "Other",
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        address: data.address || "",
        phone: data.phone || "",
        logo_url: data.logo_url || "",
        image_urls: data.image_urls || [],
        rating: data.rating || 0,
        review_count: data.review_count || 0,
        delivery_available: data.delivery_available || false,
        distance_km: 0,
        response_speed_score: 0,
        sample: data.sample || data.isSample || data.is_test || data.test || false,
      };
    });

    // DEBUG: Print all shops to your terminal so you can copy the sample IDs
    console.log("\n=== ALL SHOPS ===");
    rawShops.forEach((s) => {
      console.log(`  "${s.shop_id}"  →  ${s.name}`);
    });
    console.log("=================\n");

    // PASTE SAMPLE SHOP IDs HERE (copy from your terminal)
    const EXCLUDED_SHOP_IDS: string[] = [
        "hk-1777344819672-0",
        "hk-1777344822489-1",
        "hk-1777344825173-2",
        "hk-1777344827502-3",
        "hk-1777344829757-4",
        "hk-1777344831862-5",
        "hk-1777344835371-6",
      // Example: "abc123xyz",
    ];

    const shops = rawShops.filter((shop) => {
      if (shop.latitude === null || shop.longitude === null) return false;
      if (EXCLUDED_SHOP_IDS.includes(shop.shop_id)) return false;

      const name = (shop.name || "").toLowerCase();
      const isSample =
        shop.sample === true ||
        name.includes("sample") ||
        name.includes("test") ||
        name.includes("demo") ||
        name.includes("dummy");

      return !isSample;
    });

    return NextResponse.json({ data: shops });
  } catch (error) {
    console.error("[Admin Shops All] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}