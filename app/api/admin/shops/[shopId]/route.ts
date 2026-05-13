import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";



// GET /api/admin/shops/[shopId]
export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;
        const shopSnap = await adminDb.collection("shops").doc(shopId).get();

    if (!shopSnap.exists()) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const data = shopSnap.data();
    return NextResponse.json({
      data: {
        shop_id: shopId,
        name: data?.name,
        name_mm: data?.name_mm || "",
        category: data?.category,
        logo_url: data?.logo_url || "",
        owner_id: data?.owner_id,
        isClaimed: data?.owner_id !== "PENDING" && !!data?.owner_id,
      },
    });
  } catch (error: any) {
    console.error("Get single shop error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
