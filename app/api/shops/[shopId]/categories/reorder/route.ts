import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";

// Initialize Firebase within the route handler for server-side reliability


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

        const shopRef = adminDb.collection("shops").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data() || {};

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

    await shopRef.update({ categories: reorderedCategories });

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
