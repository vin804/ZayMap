import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { FieldValue, GeoPoint } from "firebase-admin/firestore";

interface CreateShopRequest {
  name: string;
  name_mm?: string;
  category: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  logo_url?: string;
  image_urls?: string[];
  location: {
    lat: number;
    lng: number;
  };
  owner_id: string;
}

// POST /api/shops/create - Create a new shop
export async function POST(request: NextRequest) {
  try {
    const body: CreateShopRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Shop name is required" },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { error: "Category is required" },
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

    if (!body.location || !body.location.lat || !body.location.lng) {
      return NextResponse.json(
        { error: "Location coordinates are required" },
        { status: 400 }
      );
    }

    if (!body.owner_id) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Create shop document
    const shopData = {
      name: body.name.trim(),
      name_mm: body.name_mm?.trim() || "",
      category: body.category,
      phone: body.phone.trim(),
      address: body.address.trim(),
      facebook: body.facebook?.trim() || "",
      tiktok: body.tiktok?.trim() || "",
      logo_url: body.logo_url || "",
      image_urls: body.image_urls || [],
      location: new GeoPoint(body.location.lat, body.location.lng),
      rating: 0,
      review_count: 0,
      avg_freshness_rating: 0,
      avg_responsiveness_rating: 0,
      avg_product_quality_rating: 0,
      delivery_available: false,
      owner_id: body.owner_id,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("shops").add(shopData);

    return NextResponse.json(
      {
        data: {
          shop_id: docRef.id,
          ...shopData,
          location: {
            lat: body.location.lat,
            lng: body.location.lng,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create shop error:", error);
    return NextResponse.json(
      { error: "Failed to create shop" },
      { status: 500 }
    );
  }
}