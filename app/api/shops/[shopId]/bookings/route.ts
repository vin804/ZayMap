import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";

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

    const snapshot = await adminDb.collection("bookings").where("shop_id", "==", shopId).get();

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