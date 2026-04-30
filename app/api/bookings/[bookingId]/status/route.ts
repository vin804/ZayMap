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

interface StatusUpdateRequest {
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
}

// PUT /api/bookings/[bookingId]/status - Update booking status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body: StatusUpdateRequest = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    if (!body.status || !["pending", "accepted", "declined", "completed", "cancelled"].includes(body.status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if booking exists
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Update booking status
    await updateDoc(bookingRef, {
      status: body.status,
      updated_at: serverTimestamp(),
    });

    return NextResponse.json(
      {
        data: {
          booking_id: bookingId,
          status: body.status,
          updated_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update booking status error:", error);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
