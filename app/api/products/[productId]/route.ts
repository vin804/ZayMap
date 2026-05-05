import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
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

interface Product {
  id: string;
  shop_id: string;
  name: string;
  name_mm?: string;
  description?: string;
  image_urls: string[];
  price: number;
  booking_fee: number;
  currency: string;
  delivery_available: boolean;
  freshness_status: "green" | "orange" | "red";
  created_at: string;
  updated_at: string;
  shop: {
    id: string;
    name: string;
    name_mm?: string;
    rating: number;
    phone?: string;
    address?: string;
    delivery_available: boolean;
    logo_url?: string;
  };
  reviews: Review[];
  reviews_count: number;
  average_rating: number;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

// Calculate freshness status based on created_at
function calculateFreshness(createdAt: string): "green" | "orange" | "red" {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  // Fresh: less than 2 days (48 hours)
  if (hoursDiff < 48) return "green";
  // Recent: 2-10 days (48-240 hours)
  if (hoursDiff < 240) return "orange";
  // Old: more than 10 days
  return "red";
}

// GET /api/products/[productId] - Get product details with shop info and reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const db = getDb();

    // Fetch product details
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productData = productSnap.data();
    const shopId = productData.shop_id || productData.shopId;

    // Fetch shop data if shop_id is available
    let shopData = null;
    if (shopId) {
      const shopRef = doc(db, "shops", shopId);
      const shopSnap = await getDoc(shopRef);
      if (shopSnap.exists()) {
        shopData = shopSnap.data();
      }
    }

    // Calculate shop rating from reviews (if shop_id available)
    let shopRating = shopData?.rating || 0;
    if (shopId) {
      const shopReviewsRef = collection(db, "reviews");
      const shopReviewsQuery = query(shopReviewsRef, where("shop_id", "==", shopId));
      const shopReviewsSnap = await getDocs(shopReviewsQuery);
      
      let totalShopRating = 0;
      let shopReviewCount = 0;
      shopReviewsSnap.forEach((reviewDoc) => {
        const reviewData = reviewDoc.data();
        if (reviewData.rating) {
          totalShopRating += reviewData.rating;
          shopReviewCount++;
        }
      });
      
      const calculatedShopRating = shopReviewCount > 0 ? totalShopRating / shopReviewCount : 0;
      shopRating = calculatedShopRating || shopData?.rating || 0;
    }

    // Fetch reviews for this product (simplified query to avoid index requirements)
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(
      reviewsRef,
      where("product_id", "==", productId)
    );
    const reviewsSnap = await getDocs(reviewsQuery);
    
    const reviews: Review[] = [];
    let totalRating = 0;
    
    reviewsSnap.forEach((doc) => {
      const data = doc.data();
      // Handle Firestore Timestamp or string
      let createdAt: string;
      if (data.created_at && typeof data.created_at === 'object' && 'toDate' in data.created_at) {
        // Firestore Timestamp object
        createdAt = data.created_at.toDate().toISOString();
      } else if (data.created_at) {
        createdAt = data.created_at;
      } else {
        createdAt = new Date().toISOString();
      }
      
      const review: Review = {
        id: doc.id,
        reviewer_name: data.reviewer_name || "Anonymous",
        rating: data.rating || 0,
        review_text: data.review_text || data.comment || "",
        created_at: createdAt,
      };
      reviews.push(review);
      totalRating += review.rating;
    });
    
    // Sort by created_at desc (newest first) - client side
    reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Calculate freshness using upload_timestamp (when product was listed)
    // Handle both Firestore Timestamp objects and ISO strings
    const uploadTimestamp = productData.upload_timestamp || productData.uploaded_at || productData.created_at;
    let createdAt: string;
    if (uploadTimestamp && typeof uploadTimestamp === 'object' && 'toDate' in uploadTimestamp) {
      // Firestore Timestamp object
      createdAt = uploadTimestamp.toDate().toISOString();
    } else {
      createdAt = uploadTimestamp || new Date().toISOString();
    }
    const freshnessStatus = calculateFreshness(createdAt);

    const product: Product = {
      id: productId,
      shop_id: shopId || "",
      name: productData.product_name || productData.name || "",
      name_mm: productData.product_name_mm || productData.name_mm,
      description: productData.description,
      image_urls: productData.image_urls || [productData.image_url].filter(Boolean) || [],
      price: productData.price || 0,
      booking_fee: productData.booking_fee || 0,
      currency: productData.currency || "MMK",
      delivery_available: productData.delivery_available || false,
      freshness_status: freshnessStatus,
      created_at: createdAt,
      updated_at: productData.updated_at || createdAt,
      shop: {
        id: shopId || "",
        name: shopData?.name || productData.shop_name || "Unknown Shop",
        name_mm: shopData?.name_mm || productData.shop_name_mm,
        rating: shopRating,
        phone: shopData?.phone,
        address: shopData?.address,
        delivery_available: shopData?.delivery_available || false,
        logo_url: shopData?.logo_url,
        // @ts-ignore - latitude/longitude may be in different locations
        latitude: (shopData as any)?.location?.latitude || (shopData as any)?.latitude || 0,
        // @ts-ignore
        longitude: (shopData as any)?.location?.longitude || (shopData as any)?.longitude || 0,
      },
      reviews,
      reviews_count: reviews.length,
      average_rating: averageRating,
    };

    return NextResponse.json({ data: product }, { status: 200 });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}
