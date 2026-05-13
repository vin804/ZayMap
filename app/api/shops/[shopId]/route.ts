import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { Timestamp } from "firebase-admin/firestore";



const TEST_SHOP_ID_PREFIXES = ["hk-", "test-", "sample-shop-", "shop-"];
const TEST_OWNER_ID_PREFIXES = ["test-owner-", "sample-owner-"];

function isSampleShop(shopData: any, shopId: string) {
  const ownerId = typeof shopData.owner_id === "string" ? shopData.owner_id : "";
  const hasTestId = TEST_SHOP_ID_PREFIXES.some((prefix) => shopId.startsWith(prefix));
  const hasTestOwner = TEST_OWNER_ID_PREFIXES.some((prefix) => ownerId.startsWith(prefix));
  return hasTestId || hasTestOwner || shopData.isTestShop === true;
}

// Initialize Firebase within the route handler for server-side reliability




interface Category {
  id: string;
  name?: string;
  name_mm?: string;
  icon?: string;
  order_index: number;
}

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  phone: string;
  address: string;
  logo_url?: string;
  image_urls?: string[];
  description?: string;
  description_mm?: string;
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
  categories: Category[];
  owner_id?: string;
  facebook?: string;
  tiktok?: string;
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

    

    // Fetch shop details
    const shopRef = adminDb.collection("shops").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    const shopData = shopSnap.data() || {};
    if (isSampleShop(shopData, shopId)) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }
    
    // Fetch ALL shop reviews and calculate rating (any review_type)
    const reviewsRef = adminDb.collection("reviews");
    const shopReviewsQuery = reviewsRef.where("shop_id", "==", shopId);
    const reviewsSnap = await shopReviewsQuery.get();
    
    let totalRating = 0;
    let reviewCount = 0;
    reviewsSnap.forEach((reviewDoc: any) => {
      const reviewData = reviewDoc.data();
      if (reviewData.rating) {
        totalRating += reviewData.rating;
        reviewCount++;
      }
    });
    
    const calculatedRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    
    // Use calculated rating from actual reviews, fallback to stored metrics
    const avgRating = calculatedRating || shopData.rating || 0;

    const totalReviewCount = reviewCount || shopData.review_count || 0;

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
      categories: shopData.categories || [],
      owner_id: shopData.owner_id || shopData.owner_uid || shopData.user_id,
      facebook: shopData.facebook || "",
      tiktok: shopData.tiktok || "",
      image_urls: shopData.image_urls || [],
      description: shopData.description || "",
      description_mm: shopData.description_mm || "",
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
