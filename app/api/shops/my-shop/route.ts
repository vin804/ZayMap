import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
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

// GET /api/shops/my-shop?owner_id=xxx - Get shop by owner
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

    const db = getDb();

    // Query shops by owner_id
    const shopsRef = collection(db, "shops");
    const q = query(shopsRef, where("owner_id", "==", ownerId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "No shop found for this owner" },
        { status: 404 }
      );
    }

    // Get the first (and should be only) shop
    const shopDoc = snapshot.docs[0];
    const shopData = shopDoc.data();
    const shopId = shopDoc.id;

    // Calculate rating from actual reviews (like public shop API)
    const reviewsRef = collection(db, "reviews");
    const shopReviewsQuery = query(reviewsRef, where("shop_id", "==", shopId));
    const reviewsSnap = await getDocs(shopReviewsQuery);
    
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
