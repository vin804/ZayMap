import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-server";
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

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
    const shopsSnap = await getDocs(collection(db, "shops"));
    const realShopIds = new Set<string>();
    shopsSnap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (!isSampleShop(doc.data(), doc.id)) realShopIds.add(doc.id);
    });

    const productsSnap = await getDocs(collection(db, "products"));
    let productCount = 0;
    productsSnap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      if (realShopIds.has(data.shop_id) && !isSampleProductId(doc.id)) productCount++;
    });

    const usersSnap = await getDocs(collection(db, "users"));

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