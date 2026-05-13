import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { FieldValue } from "firebase-admin/firestore";



// Initialize Firebase within the route handler for server-side reliability




// POST /api/reviews/[reviewId]/vote - Vote helpful or unhelpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { vote } = body; // 'helpful' or 'unhelpful'

    if (!vote || (vote !== 'helpful' && vote !== 'unhelpful')) {
      return NextResponse.json(
        { error: "Vote must be 'helpful' or 'unhelpful'" },
        { status: 400 }
      );
    }

    
    const reviewRef = adminDb.collection("reviews").doc(reviewId);
    
    // Check if review exists
    const reviewSnap = await reviewRef.get();
    if (!reviewSnap.exists) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const reviewData = reviewSnap.data() || {};
    // Update vote count
    const updateData = vote === 'helpful' 
      ? { helpful_count: FieldValue.increment(1) }
      : { unhelpful_count: FieldValue.increment(1) };

    await reviewRef.update(updateData);

    return NextResponse.json({ 
      data: { 
        message: vote === 'helpful' ? 'Marked as helpful' : 'Marked as unhelpful',
        vote 
      } 
    }, { status: 200 });
  } catch (error) {
    console.error("Review vote error:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[reviewId]/vote - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { vote } = body; // 'helpful' or 'unhelpful'

    if (!vote || (vote !== 'helpful' && vote !== 'unhelpful')) {
      return NextResponse.json(
        { error: "Vote must be 'helpful' or 'unhelpful'" },
        { status: 400 }
      );
    }

    
    const reviewRef = adminDb.collection("reviews").doc(reviewId);
    
    // Check if review exists
    const reviewSnap = await reviewRef.get();
    if (!reviewSnap.exists) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const reviewData = reviewSnap.data() || {};
    // Decrement vote count (but not below 0)
    const currentCount = vote === 'helpful' 
      ? (reviewData.helpful_count || 0)
      : (reviewData.unhelpful_count || 0);
    
    if (currentCount > 0) {
      const updateData = vote === 'helpful' 
        ? { helpful_count: FieldValue.increment(-1) }
        : { unhelpful_count: FieldValue.increment(-1) };

      await reviewRef.update(updateData);
    }

    return NextResponse.json({ 
      data: { 
        message: vote === 'helpful' ? 'Removed helpful vote' : 'Removed unhelpful vote',
        vote 
      } 
    }, { status: 200 });
  } catch (error) {
    console.error("Review vote removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
