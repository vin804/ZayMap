import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase within the route handler for server-side reliability


// POST /api/products/[productId]/renew - Renew a product (update timestamp)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
        const { productId } = await params;

    // Get the product document
    const productRef = adminDb.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update the timestamps to now
    const now = new Date().toISOString();
    await productRef.update({
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
