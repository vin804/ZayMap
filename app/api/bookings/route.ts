import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
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

interface BookingRequest {
  product_id: string;
  pickup_time: string;
  payment_method: "pay" | "watch_ad";
}

interface Booking {
  id: string;
  product_id: string;
  user_id: string;
  pickup_time: string;
  payment_method: "pay" | "watch_ad";
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  booking_fee: number;
  product_name: string;
  shop_id: string;
  shop_name: string;
  created_at: string;
  updated_at: string;
}

// POST /api/bookings - Create a booking
export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();

    const db = getDb();

    // Validate required fields
    if (!body.product_id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!body.pickup_time) {
      return NextResponse.json(
        { error: "Pickup time is required" },
        { status: 400 }
      );
    }

    // Validate pickup time is in the future
    const pickupTime = new Date(body.pickup_time);
    const now = new Date();
    if (pickupTime <= now) {
      return NextResponse.json(
        { error: "Pickup time must be in the future" },
        { status: 400 }
      );
    }

    if (!body.payment_method || !["pay", "watch_ad"].includes(body.payment_method)) {
      return NextResponse.json(
        { error: "Valid payment method is required (pay or watch_ad)" },
        { status: 400 }
      );
    }

    // Fetch product details to validate booking fee
    const productRef = doc(db, "products", body.product_id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productData = productSnap.data();
    const bookingFee = productData.booking_fee || 0;

    // Validate payment method based on booking fee
    if (body.payment_method === "watch_ad" && bookingFee !== 500) {
      return NextResponse.json(
        { error: "Payment method 'watch_ad' only available for 500 MMK bookings" },
        { status: 422 }
      );
    }

    // Get user ID from request headers (set by client)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create booking
    const bookingsRef = collection(db, "bookings");
    const bookingData = {
      product_id: body.product_id,
      user_id: userId,
      pickup_time: body.pickup_time,
      payment_method: body.payment_method,
      status: "pending",
      booking_fee: bookingFee,
      product_name: productData.product_name || productData.name || "",
      shop_id: productData.shop_id || "",
      shop_name: productData.shop_name || "",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(bookingsRef, bookingData);

    const booking: Booking = {
      id: docRef.id,
      product_id: body.product_id,
      user_id: userId,
      pickup_time: body.pickup_time,
      payment_method: body.payment_method,
      status: "pending",
      booking_fee: bookingFee,
      product_name: bookingData.product_name,
      shop_id: bookingData.shop_id,
      shop_name: bookingData.shop_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// GET /api/bookings?user_id=xxx - Get all bookings for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Query bookings for this user (simplified query without orderBy to avoid index issues)
    const bookingsRef = collection(db, "bookings");
    const bookingsQuery = query(bookingsRef, where("user_id", "==", userId));
    const snapshot = await getDocs(bookingsQuery);

    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        product_id: data.product_id || "",
        user_id: data.user_id || "",
        pickup_time: data.pickup_time || "",
        payment_method: data.payment_method || "pay",
        status: data.status || "pending",
        booking_fee: data.booking_fee || 0,
        product_name: data.product_name || "",
        shop_id: data.shop_id || "",
        shop_name: data.shop_name || "",
        created_at: data.created_at?.toDate?.().toISOString() || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.().toISOString() || data.updated_at || new Date().toISOString(),
      });
    });

    // Sort by created_at desc (newest first) - client side
    bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: bookings }, { status: 200 });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
