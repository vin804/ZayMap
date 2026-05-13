import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";



// Initialize Firebase within the route handler for server-side reliability




interface Review {
  review_id: string;
  shop_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  review_text?: string;
  helpful_count?: number;
  unhelpful_count?: number;
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

    

    // Fetch reviews for this shop
    const reviewsRef = adminDb.collection("reviews");
    const reviewsQuery = reviewsRef
      .where("shop_id", "==", shopId)
      .orderBy("created_at", "desc")
      .limit(limitCount);
    
    let reviewsSnap;
    try {
      reviewsSnap = await reviewsQuery.get();
    } catch (queryError: any) {
      console.error("[Reviews GET] Firestore query failed:", queryError.message || queryError);
      // If it's an index error, return a helpful message
      if (queryError.message?.includes("index")) {
        return NextResponse.json(
          { error: "Database index required. Please create the composite index for reviews collection.", details: queryError.message },
          { status: 500 }
        );
      }
      throw queryError;
    }
    const reviews: Review[] = [];

    reviewsSnap.forEach((doc: any) => {
      const data = doc.data();
      if (data.shop_id === shopId) {
        const review: Review = {
          review_id: doc.id,
          shop_id: data.shop_id,
          reviewer_name: data.reviewer_name || "Anonymous",
          rating: data.rating || 0,
          comment: data.comment || "",
          review_text: data.comment || "",
          helpful_count: data.helpful_count || 0,
          unhelpful_count: data.unhelpful_count || 0,
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

    
    
    // Create review document
    const reviewData = {
      shop_id: shopId,
      reviewer_name: body.reviewer_name.trim(),
      rating: body.rating,
      comment: body.comment?.trim() || "",
      review_type: body.review_type || "product_review",
      created_at: new Date().toISOString(),
    };
    
    const reviewsRef = adminDb.collection("reviews");
    const docRef = await reviewsRef.add(reviewData);
    
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
