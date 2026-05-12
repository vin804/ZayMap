import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const ADMIN_UID = "3sPa1kDv6JcC2nEHeuJQOeL7Xl53";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const userId = request.headers.get("x-user-id");

    console.log(`[Delete Shop] Attempting to delete shop: ${shopId}, user: ${userId}`);

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    
    console.log(`[Delete Shop] Fetching shop doc...`);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      console.log(`[Delete Shop] Shop not found: ${shopId}`);
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data();
    console.log(`[Delete Shop] Shop owner_id: ${shopData.owner_id}`);

    const isOwner = shopData.owner_id === userId;
    const isAdmin = userId === ADMIN_UID;

    console.log(`[Delete Shop] isOwner: ${isOwner}, isAdmin: ${isAdmin}`);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "You can only delete your own shop" }, { status: 403 });
    }

    console.log(`[Delete Shop] Deleting shop...`);
    await deleteDoc(shopRef);
    console.log(`[Delete Shop] Shop deleted successfully`);

    return NextResponse.json({ success: true, message: "Shop deleted successfully" });
  } catch (error) {
    console.error("[Delete Shop] CRITICAL ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to delete shop", details: errorMessage },
      { status: 500 }
    );
  }
}
