import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore";
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

// DELETE /api/shops/[shopId]/delete - Delete a shop
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    
    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    
    // Check if shop exists
    const shopSnap = await getDoc(shopRef);
    if (!shopSnap.exists()) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }
    
    // Delete the shop
    await deleteDoc(shopRef);
    
    return NextResponse.json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Shop API] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete shop" },
      { status: 500 }
    );
  }
}
