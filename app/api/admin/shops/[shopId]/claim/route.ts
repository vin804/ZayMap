import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { GeoPoint } from "firebase-admin/firestore";



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const uid = request.headers.get("x-user-id");
    if (!uid || uid === "PENDING") {
      return NextResponse.json({ error: "Valid user ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { user_lat, user_lng } = body;
    if (typeof user_lat !== "number" || typeof user_lng !== "number") {
      return NextResponse.json({ error: "user_lat and user_lng are required" }, { status: 400 });
    }

        const shopRef = adminDb.collection("shops").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const data = shopSnap.data();
    if (data?.owner_id !== "PENDING") {
      return NextResponse.json({ error: "Shop already claimed" }, { status: 409 });
    }

    await shopRef.update({
      owner_id: uid,
      location: new GeoPoint(user_lat, user_lng),
      latitude: user_lat,
      longitude: user_lng,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, shop_id: shopId });
  } catch (error) {
    console.error("[Claim Shop] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to claim shop.", details: errorMessage },
      { status: 500 }
    );
  }
}