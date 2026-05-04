import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
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

interface CreateProductRequest {
  shop_id: string;
  product_name: string;
  product_name_mm?: string;
  description?: string;
  price: number;
  image_urls: string[];
  category_id?: string;
}

// POST /api/products/create - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body: CreateProductRequest = await request.json();

    const db = getDb();

    // Validation
    if (!body.shop_id || body.shop_id.trim() === "") {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    if (!body.product_name || body.product_name.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!body.price || body.price <= 0) {
      return NextResponse.json(
        { error: "Price is required and must be greater than 0" },
        { status: 400 }
      );
    }

    // Calculate freshness based on upload time (now)
    const now = new Date();
    const uploadTimestamp = now.toISOString(); // Use ISO string instead of Firestore Timestamp
    
    // Freshness: green (< 24h), orange (1-3 days), red (> 3 days)
    const freshnessStatus = "green"; // New products are always fresh

    // Create product document
    const productData: Record<string, unknown> = {
      shop_id: body.shop_id,
      product_name: body.product_name.trim(),
      product_name_mm: body.product_name_mm?.trim() || "",
      description: body.description?.trim() || "",
      price: body.price,
      image_urls: body.image_urls || [],
      freshness_status: freshnessStatus,
      upload_timestamp: uploadTimestamp, // Use upload_timestamp consistently
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    
    // Only add category_id if provided
    if (body.category_id) {
      productData.category_id = body.category_id;
    }

    const productsRef = collection(db, "products");
    const docRef = await addDoc(productsRef, productData);

    return NextResponse.json(
      {
        data: {
          product_id: docRef.id,
          ...productData,
          uploaded_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
