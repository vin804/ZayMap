import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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
  pickup_time: string;
  payment_method: "pay" | "watch_ad";
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  booking_fee: number;
  currency: string;
  shop: {
    id: string;
    name: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

// GET /api/bookings/[bookingId] - Get booking status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const db = getDb();

    // Fetch booking
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingSnap.data();

    // Fetch shop details
    let shopData = null;
    if (bookingData.shop_id) {
      const shopRef = doc(db, "shops", bookingData.shop_id);
      const shopSnap = await getDoc(shopRef);
      if (shopSnap.exists()) {
        shopData = shopSnap.data();
      }
    }

    const booking: Booking = {
      id: bookingId,
      product_id: bookingData.product_id,
      product_name: bookingData.product_name || "",
      user_id: bookingData.user_id,
      pickup_time: bookingData.pickup_time,
      payment_method: bookingData.payment_method,
      status: bookingData.status,
      booking_fee: bookingData.booking_fee || 0,
      currency: bookingData.currency || "MMK",
      shop: {
        id: bookingData.shop_id || "",
        name: shopData?.name || bookingData.shop_name || "Unknown Shop",
        phone: shopData?.phone,
      },
      created_at: bookingData.created_at?.toDate?.()?.toISOString() || bookingData.created_at || new Date().toISOString(),
      updated_at: bookingData.updated_at?.toDate?.()?.toISOString() || bookingData.updated_at || new Date().toISOString(),
    };

    return NextResponse.json({ data: booking }, { status: 200 });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking status" },
      { status: 500 }
    );
  }
}
