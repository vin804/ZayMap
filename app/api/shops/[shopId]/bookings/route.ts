import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
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

interface Booking {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  user_name?: string;
  pickup_time: string;
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  booking_fee: number;
  payment_method: "pay" | "watch_ad";
  created_at: string;
}

// GET /api/shops/[shopId]/bookings - Get all bookings for products in this shop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;

    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get all bookings
    const bookingsRef = collection(db, "bookings");
    const bookingsQuery = query(bookingsRef, where("shop_id", "==", shopId));
    const snapshot = await getDocs(bookingsQuery);

    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        product_id: data.product_id || "",
        product_name: data.product_name || "",
        user_id: data.user_id || "",
        user_name: data.user_name || "Customer",
        pickup_time: data.pickup_time || "",
        status: data.status || "pending",
        booking_fee: data.booking_fee || 0,
        payment_method: data.payment_method || "pay",
        created_at: data.created_at?.toDate?.().toISOString() || data.created_at || new Date().toISOString(),
      });
    });

    // Sort by created_at desc (newest first) - client side
    bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: bookings }, { status: 200 });
  } catch (error) {
    console.error("Get shop bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
