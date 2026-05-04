import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs, query as firestoreQuery, where } from "firebase/firestore";
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

// Shop category definitions with icons
export const SHOP_CATEGORIES = [
  { id: "clothes", name: "Clothes", icon: "👕" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "food", name: "Food", icon: "🍜" },
  { id: "cosmetics", name: "Cosmetics", icon: "💄" },
  { id: "second_hand", name: "Second-hand", icon: "♻️" },
  { id: "other", name: "Other", icon: "🏪" },
];

// Shop interface
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
}

// Search request interface
interface SearchRequest {
  query?: string;
  categories?: string[];
  radius_km: number;
  user_location: {
    latitude: number;
    longitude: number;
  };
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const maxRadius = 1800; // Maximum radius: 1,800 km (Myanmar coverage)
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

// Calculate composite score for ranking
function calculateScore(shop: Shop): number {
  // Score = (rating * 20) + response_speed_score
  // Rating is 0-5, so rating * 20 = 0-100
  // Response speed is 0-100
  // Total possible score: 0-200
  return shop.rating * 20 + shop.response_speed_score;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SearchRequest = await request.json();
    const { query, categories, radius_km, user_location } = body;

    // Validation - query is optional but has max length
    if (query && query.length > 100) {
      return NextResponse.json(
        { error: "Invalid query length. Must be 100 characters or less." },
        { status: 400 }
      );
    }

    // Default radius if not provided
    const effectiveRadius = radius_km || 20;
    if (effectiveRadius < 5 || effectiveRadius > 10000) {
      return NextResponse.json(
        { error: "Invalid radius_km. Must be between 5 and 10000." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Fetch all shops from Firestore
    const shopsRef = collection(db, "shops");
    let shopsQuery = firestoreQuery(shopsRef);

    // Apply category filter if categories are provided
    if (categories && categories.length > 0) {
      shopsQuery = firestoreQuery(shopsRef, where("category", "in", categories));
    }

    const snapshot = await getDocs(shopsQuery);
    console.log(`[Search API] Fetched ${snapshot.size} shops from Firestore`);
    
    // Fetch all reviews to calculate ratings
    const reviewsRef = collection(db, "reviews");
    const reviewsSnap = await getDocs(reviewsRef);
    
    // Group reviews by shop_id and calculate ratings
    const shopRatings: Record<string, { totalRating: number; count: number }> = {};
    reviewsSnap.forEach((reviewDoc) => {
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

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`[Search API] Processing shop: ${doc.id}, name: ${data.name}, location:`, data.location);
      
      // Handle both GeoPoint location field and separate lat/lng fields
      const latitude = data.location?.latitude ?? data.latitude ?? 0;
      const longitude = data.location?.longitude ?? data.longitude ?? 0;
      
      if (latitude === 0 || longitude === 0) {
        console.warn(`[Search API] Shop ${doc.id} has invalid coordinates: ${latitude}, ${longitude}`);
      }
      
      // Calculate rating from reviews
      const shopRating = shopRatings[doc.id];
      const calculatedRating = shopRating && shopRating.count > 0 
        ? shopRating.totalRating / shopRating.count 
        : 0;
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
      });
    });
    
    console.log(`[Search API] Processed ${shops.length} shops with valid coordinates`);

    // Filter by distance if user_location is provided
    if (user_location && typeof user_location.latitude === "number" && typeof user_location.longitude === "number") {
      console.log(`[Search API] Filtering by distance: user at (${user_location.latitude}, ${user_location.longitude}), radius: ${effectiveRadius}km`);
      
      const shopsWithDistance = shops.map((shop) => ({
        ...shop,
        distance_km: calculateDistance(
          user_location.latitude,
          user_location.longitude,
          shop.latitude,
          shop.longitude
        ),
      }));
      
      shops = shopsWithDistance.filter((shop) => {
        const withinRadius = shop.distance_km <= effectiveRadius;
        if (!withinRadius) {
          console.log(`[Search API] Shop ${shop.shop_id} excluded: ${shop.distance_km.toFixed(2)}km > ${effectiveRadius}km`);
        }
        return withinRadius;
      });
      
      console.log(`[Search API] After distance filter: ${shops.length} shops within ${effectiveRadius}km`);
    }

    // Filter by search query if provided
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      shops = shops.filter((shop) => {
        const nameMatch = shop.name.toLowerCase().includes(searchTerm);
        const nameMmMatch = shop.name_mm?.toLowerCase().includes(searchTerm) ?? false;
        return nameMatch || nameMmMatch;
      });
    }

    // Sort by score (descending) then by distance (ascending)
    shops.sort((a, b) => {
      const scoreA = calculateScore(a);
      const scoreB = calculateScore(b);
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Higher score first
      }
      
      return (a as Shop & { distance_km: number }).distance_km - (b as Shop & { distance_km: number }).distance_km;
    });

    // Limit results to 20
    const limitedShops = shops.slice(0, 20);

    // Format response
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
      })),
      total_count: shops.length,
      pagination: {
        page: 1,
        limit: 20,
        has_more: shops.length > 20,
      },
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

// Get categories endpoint
export async function GET() {
  return NextResponse.json({
    data: SHOP_CATEGORIES,
  }, { status: 200 });
}
