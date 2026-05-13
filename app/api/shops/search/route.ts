import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";







const TEST_SHOP_ID_PREFIXES = ["test-", "sample-shop-"];
const TEST_OWNER_ID_PREFIXES = ["test-owner-", "sample-owner-"];

function isSampleShop(shopData: any, shopId: string) {
  const ownerId = typeof shopData.owner_id === "string" ? shopData.owner_id : "";
  const hasTestId = TEST_SHOP_ID_PREFIXES.some((prefix) => shopId.startsWith(prefix));
  const hasTestOwner = TEST_OWNER_ID_PREFIXES.some((prefix) => ownerId.startsWith(prefix));
  return hasTestId || hasTestOwner || shopData.isTestShop === true;
}

export const SHOP_CATEGORIES = [
  { id: "clothes", name: "Clothes", icon: "👕" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "food", name: "Food", icon: "🍜" },
  { id: "cosmetics", name: "Cosmetics", icon: "💄" },
  { id: "second_hand", name: "Second-hand", icon: "♻️" },
  { id: "other", name: "Other", icon: "🏪" },
];

interface Shop {
  shop_id: string;
  name: string;
  name_mm?: string;
  category: string;
  rating: number;
  review_count: number;
  response_speed_score: number;
  latitude: number;
  longitude: number;
  delivery_available: boolean;
  logo_url?: string;
  image_urls?: string[];
}

interface SearchRequest {
  query?: string;
  categories?: string[];
  radius_km: number;
  user_location: {
    latitude: number;
    longitude: number;
  };
}

function parseLocation(data: any): { latitude: number; longitude: number } {
  if (data.location && typeof data.location === "object" && data.location.latitude != null && !isNaN(data.location.latitude)) {
    return { latitude: data.location.latitude, longitude: data.location.longitude };
  }
  if (data.latitude != null && data.longitude != null && !isNaN(data.latitude) && !isNaN(data.longitude)) {
    return { latitude: data.latitude, longitude: data.longitude };
  }
  if (typeof data.location === "string") {
    const match = data.location.match(/\[?([\d.]+)°?\s*([NS]),?\s*([\d.]+)°?\s*([EW])\]?/i);
    if (match) {
      let lat = parseFloat(match[1]);
      let lng = parseFloat(match[3]);
      if (match[2].toUpperCase() === "S") lat = -lat;
      if (match[4].toUpperCase() === "W") lng = -lng;
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }
  return { latitude: 0, longitude: 0 };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateScore(shop: Shop): number {
  return shop.rating * 20 + shop.response_speed_score;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, categories, radius_km, user_location } = body;

    if (query && query.length > 100) {
      return NextResponse.json({ error: "Invalid query length. Must be 100 characters or less." }, { status: 400 });
    }

    const effectiveRadius = radius_km || 20;
    

    const shopsRef = adminDb.collection("shops");
    let shopsQuery: FirebaseFirestore.Query = shopsRef;

    if (categories && categories.length > 0) {
      shopsQuery = shopsRef.where("category", "in", categories);
    }

    const snapshot = await shopsQuery.get();
    console.log(`[Search API] Fetched ${snapshot.size} shops from Firestore`);

    const reviewsRef = adminDb.collection("reviews");
    const reviewsSnap = await reviewsRef.get();

    const shopRatings: Record<string, { totalRating: number; count: number }> = {};
    reviewsSnap.forEach((reviewDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const reviewData = reviewDoc.data();
      if (reviewData.shop_id && reviewData.rating) {
        if (!shopRatings[reviewData.shop_id]) {
          shopRatings[reviewData.shop_id] = { totalRating: 0, count: 0 };
        }
        shopRatings[reviewData.shop_id].totalRating += reviewData.rating;
        shopRatings[reviewData.shop_id].count++;
      }
    });

    let shops: Shop[] = [];

    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const shopId = doc.id;

      if (isSampleShop(data, shopId)) {
        console.log(`[Search API] Skipping sample/test shop: ${shopId}`);
        return;
      }

      const { latitude, longitude } = parseLocation(data);

      if (latitude === 0 && longitude === 0) {
        console.warn(`[Search API] Shop ${shopId} has invalid coordinates, skipping`);
        return;
      }

      const shopRating = shopRatings[doc.id];
      const calculatedRating = shopRating && shopRating.count > 0 ? shopRating.totalRating / shopRating.count : 0;
      const rating = calculatedRating || data.rating || 0;
      const reviewCount = shopRating?.count || data.review_count || 0;

      shops.push({
        shop_id: doc.id,
        name: data.name || "",
        name_mm: data.name_mm || "",
        category: data.category || "",
        latitude,
        longitude,
        rating,
        review_count: reviewCount,
        response_speed_score: data.response_speed_score || 0,
        delivery_available: data.delivery_available || false,
        logo_url: data.logo_url || "",
        image_urls: data.image_urls || [],
      });
    });

    console.log(`[Search API] Processed ${shops.length} shops with valid coordinates`);

    // Calculate distance for sorting, but DO NOT filter by distance
    if (user_location && typeof user_location.latitude === "number" && typeof user_location.longitude === "number") {
      shops = shops.map((shop) => ({
        ...shop,
        distance_km: calculateDistance(
          user_location.latitude,
          user_location.longitude,
          shop.latitude,
          shop.longitude
        ),
      }));
    }

    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      shops = shops.filter((shop) => {
        const nameMatch = shop.name.toLowerCase().includes(searchTerm);
        const nameMmMatch = shop.name_mm?.toLowerCase().includes(searchTerm) ?? false;
        return nameMatch || nameMmMatch;
      });
    }

    shops.sort((a, b) => {
      const scoreA = calculateScore(a);
      const scoreB = calculateScore(b);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a as Shop & { distance_km: number }).distance_km - (b as Shop & { distance_km: number }).distance_km;
    });

    const limitedShops = shops.slice(0, 50);

    const response = {
      data: limitedShops.map((shop) => ({
        shop_id: shop.shop_id,
        name: shop.name,
        name_mm: shop.name_mm,
        category: shop.category,
        distance_km: (shop as Shop & { distance_km: number }).distance_km,
        rating: shop.rating,
        review_count: shop.review_count,
        response_speed_score: shop.response_speed_score,
        delivery_available: shop.delivery_available,
        latitude: shop.latitude,
        longitude: shop.longitude,
        logo_url: shop.logo_url,
        image_urls: shop.image_urls,
      })),
      total_count: shops.length,
      pagination: { page: 1, limit: 50, has_more: shops.length > 50 },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Search error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Unable to search. Please try again.", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ data: SHOP_CATEGORIES }, { status: 200 });
}