import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const TEST_SHOP_ID_PREFIXES = ["hk-", "test-", "sample-shop-", "shop-"];
const TEST_OWNER_ID_PREFIXES = ["test-owner-", "sample-owner-"];

function isSampleShop(shopData: any, shopId: string) {
  const ownerId = typeof shopData.owner_id === "string" ? shopData.owner_id : "";
  return TEST_SHOP_ID_PREFIXES.some((p) => shopId.startsWith(p)) ||
    TEST_OWNER_ID_PREFIXES.some((p) => ownerId.startsWith(p)) ||
    shopData.isTestShop === true;
}

const CATEGORIES: Record<string, string> = {
  clothes: "👕 Clothes", electronics: "📱 Electronics", food: "🍜 Food",
  cosmetics: "💄 Cosmetics", second_hand: "♻️ Second-hand", other: "🏪 Other",
};

export async function GET() {
  try {
    const shopsSnap = await adminDb.collection("shops").get();
    const shops: any[] = [];

    for (const shopDoc of shopsSnap.docs) {
      const data = shopDoc.data();
      if (isSampleShop(data, shopDoc.id)) continue;

      const productsSnap = await adminDb.collection("shops").doc(shopDoc.id).collection("products").get();
      const reviewsSnap = await adminDb.collection("reviews").get();
      let reviewCount = 0, totalRating = 0;
      reviewsSnap.forEach((r: QueryDocumentSnapshot) => {
        const rd = r.data();
        if (rd.shop_id === shopDoc.id && rd.rating) { reviewCount++; totalRating += rd.rating; }
      });
      const rating = reviewCount > 0 ? totalRating / reviewCount : data.rating || 0;

      shops.push({
        shop_id: shopDoc.id,
        name: data.name || "",
        name_mm: data.name_mm || "",
        category: data.category || "other",
        category_label: CATEGORIES[data.category] || CATEGORIES.other,
        rating: Number(rating.toFixed(1)),
        review_count: reviewCount,
        delivery_available: data.delivery_available || false,
        logo_url: data.logo_url || "",
        phone: data.phone || "",
        address: data.address || "",
        facebook: data.facebook || "",
        tiktok: data.tiktok || "",
        created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || "",
        product_count: productsSnap.size,
        owner_id: data.owner_id || "",
        claim_token: data.claim_token || "",
        status: data.status || (data.owner_id ? "claimed" : "unclaimed"),
      });
    }

    shops.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: shops, count: shops.length });
  } catch (error) {
    console.error("[Admin Shops] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}