import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase within the route handler for server-side reliability


interface UpdateProductRequest {
  product_name: string;
  product_name_mm?: string;
  description?: string;
  price: number;
  image_urls?: string[];
}

// PUT /api/products/[productId]/update - Update product details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body: UpdateProductRequest = await request.json();

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!body.product_name || body.product_name.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (typeof body.price !== "number" || body.price <= 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    
    // Check if product exists
    const productRef = adminDb.collection("products").doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update product document
    const updateData = {
      product_name: body.product_name.trim(),
      product_name_mm: body.product_name_mm?.trim() || "",
      description: body.description?.trim() || "",
      price: body.price,
      image_urls: body.image_urls || [],
      updated_at: FieldValue.serverTimestamp(),
    };

    await productRef.update(updateData);

    return NextResponse.json(
      {
        data: {
          product_id: productId,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
