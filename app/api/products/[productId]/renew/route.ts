import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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

// POST /api/products/[productId]/renew - Renew a product (update timestamp)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const db = getDb();
    const { productId } = await params;

    // Get the product document
    const productRef = doc(db, "products", productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update the timestamps to now
    const now = new Date().toISOString();
    await updateDoc(productRef, {
      upload_timestamp: now, // Update this so product detail page shows correct time
      updated_at: now,
      renewed_at: now, // Track when it was specifically renewed
    });

    return NextResponse.json({
      success: true,
      message: "Product renewed successfully",
      data: {
        product_id: productId,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error("Error renewing product:", error);
    return NextResponse.json(
      { error: "Failed to renew product" },
      { status: 500 }
    );
  }
}
