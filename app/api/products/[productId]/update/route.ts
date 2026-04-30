import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
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

interface UpdateProductRequest {
  product_name: string;
  product_name_mm?: string;
  description?: string;
  price: number;
  booking_fee: number;
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

    if (typeof body.booking_fee !== "number" || body.booking_fee < 500) {
      return NextResponse.json(
        { error: "Valid booking fee is required (minimum 500 MMK)" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if product exists
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
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
      booking_fee: body.booking_fee,
      image_urls: body.image_urls || [],
      updated_at: serverTimestamp(),
    };

    await updateDoc(productRef, updateData);

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
