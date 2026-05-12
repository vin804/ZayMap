import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, GeoPoint } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getFirestore();
}

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

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const data = shopSnap.data();
    if (data.owner_id !== "PENDING") {
      return NextResponse.json({ error: "Shop already claimed" }, { status: 409 });
    }

    await updateDoc(shopRef, {
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