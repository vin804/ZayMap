import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
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

interface CreateShopRequest {
  name: string;
  name_mm?: string;
  category: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  logo_url?: string;
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

    const db = getDb();

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
      location: new GeoPoint(body.location.lat, body.location.lng),
      rating: 0,
      review_count: 0,
      avg_freshness_rating: 0,
      avg_responsiveness_rating: 0,
      avg_product_quality_rating: 0,
      delivery_available: false,
      owner_id: body.owner_id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const shopsRef = collection(db, "shops");
    const docRef = await addDoc(shopsRef, shopData);

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
