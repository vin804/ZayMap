import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner_id");

    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 }
      );
    }

    const snapshot = await adminDb.collection("shops").where("owner_id", "==", ownerId).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "No shop found for this owner" },
        { status: 404 }
      );
    }

    const shopDoc = snapshot.docs[0];
    const shopData = shopDoc.data();
    const shopId = shopDoc.id;

    const reviewsSnap = await adminDb.collection("reviews").where("shop_id", "==", shopId).get();

    let totalRating = 0;
    let reviewCount = 0;
    reviewsSnap.forEach((reviewDoc) => {
      const reviewData = reviewDoc.data();
      if (reviewData.rating) {
        totalRating += reviewData.rating;
        reviewCount++;
      }
    });

    const calculatedRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    const avgRating = calculatedRating || shopData.rating || 0;
    const totalReviewCount = reviewCount || shopData.review_count || 0;

    return NextResponse.json({
      data: {
        shop_id: shopDoc.id,
        name: shopData.name,
        name_mm: shopData.name_mm || "",
        category: shopData.category,
        phone: shopData.phone,
        address: shopData.address,
        facebook: shopData.facebook || "",
        tiktok: shopData.tiktok || "",
        logo_url: shopData.logo_url || "",
        image_urls: shopData.image_urls || [],
        description: shopData.description || "",
        description_mm: shopData.description_mm || "",
        delivery_available: shopData.delivery_available || false,
        rating: avgRating,
        review_count: totalReviewCount,
        categories: shopData.categories || [],
        latitude: shopData.location?.latitude || 0,
        longitude: shopData.location?.longitude || 0,
        created_at: shopData.created_at?.toDate?.()
          ? shopData.created_at.toDate().toISOString()
          : new Date().toISOString(),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Get my shop error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}