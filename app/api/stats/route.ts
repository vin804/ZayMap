import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const TEST_SHOP_ID_PREFIXES = ["hk-", "test-", "sample-shop-", "shop-"];
const TEST_OWNER_ID_PREFIXES = ["test-owner-", "sample-owner-"];
const TEST_PRODUCT_PREFIXES = ["hk-", "test-", "sample-", "gemstone-hk-"];

function isSampleShop(shopData: any, shopId: string) {
  const ownerId = typeof shopData.owner_id === "string" ? shopData.owner_id : "";
  return TEST_SHOP_ID_PREFIXES.some((p) => shopId.startsWith(p)) ||
    TEST_OWNER_ID_PREFIXES.some((p) => ownerId.startsWith(p)) ||
    shopData.isTestShop === true;
}

function isSampleProductId(id: string): boolean {
  return TEST_PRODUCT_PREFIXES.some((p) => id.startsWith(p));
}

export async function GET() {
  try {
    const shopsSnap = await adminDb.collection("shops").get();
    const realShopIds = new Set<string>();
    shopsSnap.forEach((doc: QueryDocumentSnapshot) => {
      if (!isSampleShop(doc.data(), doc.id)) realShopIds.add(doc.id);
    });

    const productsSnap = await adminDb.collection("products").get();
    let productCount = 0;
    productsSnap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      if (realShopIds.has(data.shop_id) && !isSampleProductId(doc.id)) productCount++;
    });

    const usersSnap = await adminDb.collection("users").get();

    return NextResponse.json({
      shops: realShopIds.size,
      products: productCount,
      users: usersSnap.size,
      health: "healthy",
    });
  } catch (error) {
    console.error("[Stats] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}