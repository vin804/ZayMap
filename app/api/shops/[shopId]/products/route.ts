import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs, query, where, limit } from "firebase/firestore";
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
  product_id: string;
  shop_id: string;
  product_name: string;
  product_name_mm?: string;
  description?: string;
  image_urls: string[];
  price: number;
  booking_fee: number;
  currency: string;
  upload_timestamp: string;
  freshness_badge: "green" | "orange" | "red";
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

// GET /api/shops/[shopId]/products - Get shop products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "freshness";
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);

    const db = getDb();

    // Fetch products for this shop (simplified query to avoid index requirements)
    const productsRef = collection(db, "products");
    const productsQuery = query(
      productsRef,
      where("shop_id", "==", shopId),
      limit(limitCount)
    );
    
    const productsSnap = await getDocs(productsQuery);
    const products: Product[] = [];

    productsSnap.forEach((doc) => {
      const data = doc.data();
      const product: Product = {
        product_id: doc.id,
        shop_id: data.shop_id || shopId,
        product_name: data.product_name || data.name || "",
        product_name_mm: data.product_name_mm || data.name_mm,
        description: data.description || "",
        image_urls: data.image_urls || [data.image_url].filter(Boolean) || [],
        price: data.price || 0,
        booking_fee: data.booking_fee || 0,
        currency: data.currency || "MMK",
        upload_timestamp: data.upload_timestamp || data.created_at || new Date().toISOString(),
        freshness_badge: calculateFreshness(data.upload_timestamp || data.created_at || new Date().toISOString()),
      };
      products.push(product);
    });

    // Sort by upload timestamp desc (newest first)
    products.sort((a, b) => new Date(b.upload_timestamp).getTime() - new Date(a.upload_timestamp).getTime());

    return NextResponse.json({ data: { products } }, { status: 200 });
  } catch (error) {
    console.error("Shop products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop products" },
      { status: 500 }
    );
  }
}
