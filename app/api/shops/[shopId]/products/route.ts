import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";

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
  updated_at?: string;
  freshness_status: "green" | "orange" | "red";
  average_rating: number;
  review_count: number;
  category_id?: string | null;
}

function calculateFreshness(uploadTimestamp: string): "green" | "orange" | "red" {
  const upload = new Date(uploadTimestamp);
  const now = new Date();
  const hoursDiff = (now.getTime() - upload.getTime()) / (1000 * 60 * 60);
  if (hoursDiff < 48) return "green";
  if (hoursDiff < 240) return "orange";
  return "red";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);

    const productsSnap = await adminDb.collection("products")
      .where("shop_id", "==", shopId)
      .limit(limitCount)
      .get();

    const products: Product[] = [];

    for (const doc of productsSnap.docs) {
      const data = doc.data();

      const reviewsSnap = await adminDb.collection("reviews").where("product_id", "==", doc.id).get();
      const reviews: number[] = [];
      reviewsSnap.forEach((reviewDoc) => {
        const reviewData = reviewDoc.data();
        if (reviewData.rating) reviews.push(reviewData.rating);
      });

      const average_rating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r, 0) / reviews.length
        : 0;

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
        category_id: data.category_id || null,
        upload_timestamp: data.upload_timestamp || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at,
        freshness_status: calculateFreshness(data.upload_timestamp || data.created_at || new Date().toISOString()),
        average_rating,
        review_count: reviews.length,
      };
      products.push(product);
    }

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