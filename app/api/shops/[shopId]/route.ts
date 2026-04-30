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

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  phone: string;
  address: string;
  logo_url?: string;
  latitude: number;
  longitude: number;
  delivery_available: boolean;
  avg_responsiveness_rating: number;
  avg_delivery_quality_rating: number;
  avg_product_review_rating: number;
  responsiveness_review_count: number;
  delivery_quality_review_count: number;
  product_review_count: number;
  response_time_hours: number;
  rating: number;
  review_count: number;
  owner_id?: string;
}

interface Product {
  product_id: string;
  shop_id: string;
  name: string;
  name_mm?: string;
  image_url?: string;
  price: number;
  booking_fee: number;
  currency: string;
  upload_timestamp: string;
  freshness_badge: "green" | "orange" | "red";
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

// Calculate freshness badge based on upload timestamp
function calculateFreshness(uploadTimestamp: string): "green" | "orange" | "red" {
  const upload = new Date(uploadTimestamp);
  const now = new Date();
  const hoursDiff = (now.getTime() - upload.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) return "green";
  if (hoursDiff < 72) return "orange"; // 3 days
  return "red";
}

// GET /api/shops/[shopId] - Get shop details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;

    const db = getDb();

    // Fetch shop details
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    const shopData = shopSnap.data();
    
    // Calculate overall rating from the three metrics
    const avgRating = (
      (shopData.avg_responsiveness_rating || 0) +
      (shopData.avg_delivery_quality_rating || 0) +
      (shopData.avg_product_review_rating || 0)
    ) / 3;

    const totalReviewCount = 
      (shopData.responsiveness_review_count || 0) +
      (shopData.delivery_quality_review_count || 0) +
      (shopData.product_review_count || 0);

    const shop: Shop = {
      shop_id: shopId,
      name: shopData.name || "",
      name_mm: shopData.name_mm,
      category: shopData.category || "other",
      phone: shopData.phone || "",
      address: shopData.address || "",
      logo_url: shopData.logo_url || "",
      latitude: shopData.location?.latitude || shopData.latitude || 0,
      longitude: shopData.location?.longitude || shopData.longitude || 0,
      delivery_available: shopData.delivery_available || false,
      avg_responsiveness_rating: shopData.avg_responsiveness_rating || 0,
      avg_delivery_quality_rating: shopData.avg_delivery_quality_rating || 0,
      avg_product_review_rating: shopData.avg_product_review_rating || 0,
      responsiveness_review_count: shopData.responsiveness_review_count || 0,
      delivery_quality_review_count: shopData.delivery_quality_review_count || 0,
      product_review_count: shopData.product_review_count || 0,
      response_time_hours: shopData.response_time_hours || 24,
      rating: avgRating,
      review_count: totalReviewCount,
      owner_id: shopData.owner_id || shopData.owner_uid || shopData.user_id,
    };

    return NextResponse.json({ data: shop }, { status: 200 });
  } catch (error) {
    console.error("Shop detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop details" },
      { status: 500 }
    );
  }
}
