import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase within the route handler for server-side reliability


interface UpdateShopRequest {
  name: string;
  name_mm?: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  category: string;
  delivery_available: boolean;
  description?: string;
  description_mm?: string;
  logo_url?: string;
  image_urls?: string[];
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

    
    // Update shop document
    const shopRef = adminDb.collection("shops").doc(shopId);
    const updateData: Record<string, unknown> = {
      name: body.name.trim(),
      name_mm: body.name_mm?.trim() || "",
      phone: body.phone.trim(),
      address: body.address.trim(),
      facebook: body.facebook?.trim() || "",
      tiktok: body.tiktok?.trim() || "",
      category: body.category,
      delivery_available: body.delivery_available,
      description: body.description?.trim() || "",
      description_mm: body.description_mm?.trim() || "",
      updated_at: FieldValue.serverTimestamp(),
    };
    
    // Only update logo_url if provided
    if (body.logo_url !== undefined) {
      updateData.logo_url = body.logo_url;
    }
    
    // Only update image_urls if provided
    if (body.image_urls !== undefined) {
      updateData.image_urls = body.image_urls;
    }

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
