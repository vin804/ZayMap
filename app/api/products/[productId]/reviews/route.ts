import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

interface ReviewRequest {
  reviewer_name: string;
  rating: number;
  review_text?: string;
}

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

// POST /api/products/[productId]/reviews - Create a product review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body: ReviewRequest = await request.json();

    const db = getDb();

    // Validate required fields
    if (!body.reviewer_name || body.reviewer_name.trim() === "") {
      return NextResponse.json(
        { error: "Reviewer name is required" },
        { status: 400 }
      );
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate review text length
    if (body.review_text && body.review_text.length > 500) {
      return NextResponse.json(
        { error: "Review text exceeds 500 characters" },
        { status: 422 }
      );
    }

    // Create review
    const reviewsRef = collection(db, "reviews");
    const reviewData = {
      product_id: productId,
      reviewer_name: body.reviewer_name.trim(),
      rating: body.rating,
      review_text: body.review_text?.trim() || "",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(reviewsRef, reviewData);

    const review: Review = {
      id: docRef.id,
      product_id: productId,
      reviewer_name: reviewData.reviewer_name,
      rating: reviewData.rating,
      review_text: reviewData.review_text,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
