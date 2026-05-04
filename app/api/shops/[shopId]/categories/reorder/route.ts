import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
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

// PUT - Reorder categories
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { categoryIds, userId } = await request.json();

    if (!categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: "Category IDs array is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data();

    // Verify ownership
    const ownerId = shopData.owner_id || shopData.owner_uid || shopData.user_id;
    if (userId !== ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const categories = shopData.categories || [];

    // Reorder categories based on provided IDs
    const reorderedCategories = categoryIds
      .map((id: string) => categories.find((cat: any) => cat.id === id))
      .filter(Boolean)
      .map((cat: any, idx: number) => ({
        ...cat,
        order_index: idx,
      }));

    await updateDoc(shopRef, { categories: reorderedCategories });

    return NextResponse.json({
      success: true,
      data: reorderedCategories,
    });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
