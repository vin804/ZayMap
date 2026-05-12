import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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

// GET /api/admin/shops/[shopId]
export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;
    const db = getDb();
    const shopSnap = await getDoc(doc(db, "shops", shopId));

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
