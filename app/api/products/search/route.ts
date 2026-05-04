import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs, query as firestoreQuery, where, doc, getDoc } from "firebase/firestore";
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

// Product freshness status
type FreshnessStatus = "green" | "orange" | "red";

// Product interface
interface Product {
  product_id: string;
  product_name: string;
  product_name_mm?: string;
  shop_id: string;
  shop_name: string;
  shop_name_mm?: string;
  image_url?: string;
  price: number;
  booking_fee: number;
  currency: string;
  freshness_status: FreshnessStatus;
  uploaded_at: string;
  shop_rating: number;
  product_rating: number;
  latitude: number;
  longitude: number;
}

// Search request interface
interface ProductSearchRequest {
  query: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  language?: "en" | "my";
}

// Haversine formula to calculate distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
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

// Freshness priority for sorting (green > orange > red)
const FRESHNESS_PRIORITY: Record<FreshnessStatus, number> = {
  green: 3,
  orange: 2,
  red: 1,
};

// Calculate freshness based on upload timestamp
function calculateFreshness(uploadTimestamp: string): FreshnessStatus {
  const upload = new Date(uploadTimestamp);
  const now = new Date();
  const hoursDiff = (now.getTime() - upload.getTime()) / (1000 * 60 * 60);
  
  // Fresh: less than 2 days (48 hours)
  if (hoursDiff < 48) return "green";
  // Recent: 2-10 days (48-240 hours)
  if (hoursDiff < 240) return "orange";
  // Old: more than 10 days
  return "red";
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ProductSearchRequest = await request.json();
    const { query, latitude, longitude, radius_km, language = "en" } = body;

    // Validation
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Invalid location coordinates" },
        { status: 400 }
      );
    }

    if (!radius_km || radius_km < 1 || radius_km > 10000) {
      return NextResponse.json(
        { error: "Invalid radius. Must be between 1 and 10000 km." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Fetch all products from Firestore
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    
    let products: (Product & { distance_km: number })[] = [];

    // Fetch shop locations and calculate distances
    const shopCache = new Map<string, { latitude: number; longitude: number; name: string; name_mm?: string; rating: number }>();
    
    for (const productDoc of snapshot.docs) {
      const data = productDoc.data();
      const shopId = data.shop_id as string;
      
      // Get shop location (with caching)
      let shopData = shopCache.get(shopId);
      if (!shopData) {
        const shopRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          const shop = shopSnap.data();
          // Handle both GeoPoint location field and separate lat/lng fields
          const latitude_val = shop.location?.latitude ?? shop.latitude ?? 0;
          const longitude_val = shop.location?.longitude ?? shop.longitude ?? 0;
          shopData = {
            latitude: latitude_val,
            longitude: longitude_val,
            name: shop.name || "Unknown Shop",
            name_mm: shop.name_mm,
            rating: shop.rating || 0,
          };
          shopCache.set(shopId, shopData);
        }
      }
      
      if (!shopData || shopData.latitude === 0) {
        continue; // Skip products without valid shop location
      }
      
      // Calculate distance to shop
      const distance = calculateDistance(
        latitude,
        longitude,
        shopData.latitude,
        shopData.longitude
      );
      
      // Only include products within radius
      if (distance <= radius_km) {
        const uploadedAt = data.upload_timestamp || data.created_at || new Date().toISOString();
        
        // Fetch product reviews to calculate product rating
        let productRating = 0;
        try {
          const reviewsRef = collection(db, "reviews");
          const reviewsQuery = firestoreQuery(
            reviewsRef,
            where("product_id", "==", productDoc.id)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          let totalRating = 0;
          let reviewCount = 0;
          reviewsSnapshot.forEach((reviewDoc) => {
            const reviewData = reviewDoc.data();
            if (reviewData.rating) {
              totalRating += reviewData.rating;
              reviewCount++;
            }
          });
          productRating = reviewCount > 0 ? totalRating / reviewCount : 0;
        } catch (err) {
          console.error(`Error fetching reviews for product ${productDoc.id}:`, err);
          // Use 0 rating on error
        }
        
        const product: Product = {
          product_id: productDoc.id,
          product_name: data.product_name || data.name || "",
          product_name_mm: data.product_name_mm || data.name_mm || "",
          shop_id: shopId,
          shop_name: shopData.name,
          shop_name_mm: shopData.name_mm,
          image_url: data.image_urls?.[0] || data.image_url || "",
          price: data.price || 0,
          booking_fee: data.booking_fee || 0,
          currency: data.currency || "MMK",
          freshness_status: calculateFreshness(uploadedAt),
          uploaded_at: uploadedAt,
          shop_rating: shopData.rating || 0,
          product_rating: productRating,
          latitude: shopData.latitude,
          longitude: shopData.longitude,
        };
        products.push({ ...product, distance_km: distance });
      }
    }

    // Filter by search query
    const searchTerm = query.toLowerCase().trim();
    products = products.filter((product) => {
      const nameMatch = product.product_name.toLowerCase().includes(searchTerm);
      const nameMmMatch = product.product_name_mm?.toLowerCase().includes(searchTerm) ?? false;
      const shopNameMatch = product.shop_name.toLowerCase().includes(searchTerm);
      const shopNameMmMatch = product.shop_name_mm?.toLowerCase().includes(searchTerm) ?? false;
      return nameMatch || nameMmMatch || shopNameMatch || shopNameMmMatch;
    });

    // Sort by freshness (desc), shop rating (desc), distance (asc)
    products.sort((a, b) => {
      // Freshness priority (green > orange > red)
      const freshnessDiff = FRESHNESS_PRIORITY[b.freshness_status] - FRESHNESS_PRIORITY[a.freshness_status];
      if (freshnessDiff !== 0) return freshnessDiff;
      
      // Shop rating (highest first)
      const ratingDiff = b.shop_rating - a.shop_rating;
      if (ratingDiff !== 0) return ratingDiff;
      
      // Distance (closest first)
      return a.distance_km - b.distance_km;
    });

    // Format response
    const response = {
      data: products.map((product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        product_name_mm: product.product_name_mm,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        shop_name_mm: product.shop_name_mm,
        image_url: product.image_url,
        price: product.price,
        currency: product.currency,
        freshness_status: product.freshness_status,
        uploaded_at: product.uploaded_at,
        shop_rating: product.shop_rating,
        product_rating: product.product_rating,
        distance_km: product.distance_km,
      })),
      meta: {
        total_count: products.length,
        query: query,
        radius_km: radius_km,
        sorted_by: "freshness_desc, shop_rating_desc, distance_asc",
      },
    };

    // Return 404 if no results found
    if (products.length === 0) {
      return NextResponse.json(
        {
          error: "No products found matching your search",
          data: [],
          meta: {
            total_count: 0,
            query: query,
            radius_km: radius_km,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Product search error:", error);
    return NextResponse.json(
      { error: "Search service unavailable. Please try again." },
      { status: 500 }
    );
  }
}
