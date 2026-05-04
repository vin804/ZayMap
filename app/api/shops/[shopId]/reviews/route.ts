import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs, query, orderBy, limit as limitDocs, addDoc } from "firebase/firestore";
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

interface Review {
  review_id: string;
  shop_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  review_type: "responsiveness" | "delivery_quality" | "product_review";
  created_at: string;
}

// GET /api/shops/[shopId]/reviews - Get shop reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get("limit") || "5", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getDb();

    // Fetch reviews for this shop
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(
      reviewsRef,
      orderBy("created_at", "desc"),
      limitDocs(limitCount)
    );
    
    const reviewsSnap = await getDocs(reviewsQuery);
    const reviews: Review[] = [];

    reviewsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.shop_id === shopId) {
        const review: Review = {
          review_id: doc.id,
          shop_id: data.shop_id,
          reviewer_name: data.reviewer_name || "Anonymous",
          rating: data.rating || 0,
          comment: data.comment || "",
          review_type: data.review_type || "product_review",
          created_at: data.created_at || new Date().toISOString(),
        };
        reviews.push(review);
      }
    });

    // Calculate rating breakdown
    const ratingBreakdown = {
      responsiveness: {
        avg: 0,
        count: 0,
      },
      delivery_quality: {
        avg: 0,
        count: 0,
      },
      product_review: {
        avg: 0,
        count: 0,
      },
    };

    reviews.forEach((review) => {
      if (review.review_type === "responsiveness") {
        ratingBreakdown.responsiveness.avg += review.rating;
        ratingBreakdown.responsiveness.count++;
      } else if (review.review_type === "delivery_quality") {
        ratingBreakdown.delivery_quality.avg += review.rating;
        ratingBreakdown.delivery_quality.count++;
      } else {
        ratingBreakdown.product_review.avg += review.rating;
        ratingBreakdown.product_review.count++;
      }
    });

    // Calculate averages
    if (ratingBreakdown.responsiveness.count > 0) {
      ratingBreakdown.responsiveness.avg /= ratingBreakdown.responsiveness.count;
    }
    if (ratingBreakdown.delivery_quality.count > 0) {
      ratingBreakdown.delivery_quality.avg /= ratingBreakdown.delivery_quality.count;
    }
    if (ratingBreakdown.product_review.count > 0) {
      ratingBreakdown.product_review.avg /= ratingBreakdown.product_review.count;
    }

    return NextResponse.json({ 
      data: { 
        reviews,
        rating_breakdown: ratingBreakdown,
        total_count: reviews.length,
      } 
    }, { status: 200 });
  } catch (error) {
    console.error("Shop reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop reviews" },
      { status: 500 }
    );
  }
}

// POST /api/shops/[shopId]/reviews - Create a new shop review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const body = await request.json();
    
    // Validation
    if (!body.reviewer_name || !body.rating) {
      return NextResponse.json(
        { error: "Reviewer name and rating are required" },
        { status: 400 }
      );
    }
    
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Create review document
    const reviewData = {
      shop_id: shopId,
      reviewer_name: body.reviewer_name.trim(),
      rating: body.rating,
      comment: body.comment?.trim() || "",
      review_type: body.review_type || "product_review",
      created_at: new Date().toISOString(),
    };
    
    const reviewsRef = collection(db, "reviews");
    const docRef = await addDoc(reviewsRef, reviewData);
    
    return NextResponse.json({
      data: {
        review_id: docRef.id,
        ...reviewData,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
