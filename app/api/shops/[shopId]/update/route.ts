import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// Initialize Firebase within the route handler for server-side reliability
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

interface UpdateShopRequest {
  name: string;
  name_mm?: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  category: string;
  delivery_available: boolean;
}

// PUT /api/shops/[shopId]/update - Update shop details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const body: UpdateShopRequest = await request.json();

    // Validation
    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Shop name is required" },
        { status: 400 }
      );
    }

    if (!body.phone || body.phone.trim() === "") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!body.address || body.address.trim() === "") {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Update shop document
    const shopRef = doc(db, "shops", shopId);
    const updateData = {
      name: body.name.trim(),
      name_mm: body.name_mm?.trim() || "",
      phone: body.phone.trim(),
      address: body.address.trim(),
      facebook: body.facebook?.trim() || "",
      tiktok: body.tiktok?.trim() || "",
      category: body.category,
      delivery_available: body.delivery_available,
      updated_at: serverTimestamp(),
    };

    await updateDoc(shopRef, updateData);

    return NextResponse.json(
      {
        data: {
          shop_id: shopId,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update shop error:", error);
    return NextResponse.json(
      { error: "Failed to update shop" },
      { status: 500 }
    );
  }
}
