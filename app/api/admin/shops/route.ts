import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint, getDocs } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { ADMIN_UID } from "@/lib/admin-config";

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

function assertAdmin(request: NextRequest) {
  const uid = request.headers.get("x-user-id");
  if (uid !== ADMIN_UID) {
    throw new Error("Forbidden: admin only");
  }
}

// GET /api/admin/shops — list all shops (readable by any admin page, mutation is protected)
export async function GET() {
  try {
    const db = getDb();
    const snapshot = await getDocs(collection(db, "shops"));
    const shops: any[] = [];
    const TEST_SHOP_ID_PREFIXES = ["test-", "sample-shop-"];
    const TEST_OWNER_ID_PREFIXES = ["test-owner-", "sample-owner-"];

    function isSampleShop(shopData: any, shopId: string) {
      const ownerId = typeof shopData.owner_id === "string" ? shopData.owner_id : "";
      const hasTestId = TEST_SHOP_ID_PREFIXES.some((prefix) => shopId.startsWith(prefix));
      const hasTestOwner = TEST_OWNER_ID_PREFIXES.some((prefix) => ownerId.startsWith(prefix));
      return hasTestId || hasTestOwner || shopData.isTestShop === true;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const shopId = doc.id;

      if (isSampleShop(data, shopId)) {
        console.log(`[Admin API] Skipping sample/test shop: ${shopId}`);
        return;
      }

      // Parse location from various formats
      let lat = 0;
      let lng = 0;
      if (data.location && typeof data.location === "object") {
        lat = data.location.latitude ?? data.latitude ?? 0;
        lng = data.location.longitude ?? data.longitude ?? 0;
      } else if (typeof data.location === "string") {
        const match = data.location.match(/\[?([\d.]+)°?\s*([NS]),?\s*([\d.]+)°?\s*([EW])\]?/i);
        if (match) {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[3]);
          if (match[2].toUpperCase() === "S") lat = -lat;
          if (match[4].toUpperCase() === "W") lng = -lng;
        }
      } else {
        lat = data.latitude ?? 0;
        lng = data.longitude ?? 0;
      }

      shops.push({
        shop_id: doc.id,
        name: data.name,
        name_mm: data.name_mm || "",
        category: data.category,
        phone: data.phone,
        address: data.address,
        logo_url: data.logo_url || "",
        image_urls: data.image_urls || [],
        latitude: lat,
        longitude: lng,
        owner_id: data.owner_id,
        isClaimed: data.owner_id !== "PENDING" && data.owner_id !== "" && !!data.owner_id,
        created_by: data.created_by || "",
        status: data.status || "active",
        created_at: data.created_at?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      });
    });
    return NextResponse.json({ shops, data: shops });
  } catch (error: any) {
    console.error("Admin shops GET error:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Server error" }, { status });
  }
}

interface CreateShopBody {
  name: string;
  name_mm?: string;
  category: string;
  phone: string;
  address: string;
  facebook?: string;
  tiktok?: string;
  logo_url?: string;
  image_urls?: string[];
  location: { lat: number; lng: number };
}

// POST /api/admin/shops — create ownerless shop
export async function POST(request: NextRequest) {
  try {
    assertAdmin(request);
    const body: CreateShopBody = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }
    if (!body.address?.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }
    if (!body.location || typeof body.location.lat !== "number" || typeof body.location.lng !== "number") {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const db = getDb();
    const shopData = {
      name: body.name.trim(),
      name_mm: body.name_mm?.trim() || "",
      category: body.category,
      phone: body.phone.trim(),
      address: body.address.trim(),
      facebook: body.facebook?.trim() || "",
      tiktok: body.tiktok?.trim() || "",
      logo_url: body.logo_url || "",
      image_urls: body.image_urls || [],
      location: new GeoPoint(body.location.lat, body.location.lng),
      latitude: body.location.lat,
      longitude: body.location.lng,
      rating: 0,
      review_count: 0,
      avg_freshness_rating: 0,
      avg_responsiveness_rating: 0,
      avg_product_quality_rating: 0,
      delivery_available: false,
      owner_id: "PENDING",
      created_by: ADMIN_UID,
      status: "active",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "shops"), shopData);

    return NextResponse.json({
      data: {
        shop_id: docRef.id,
        ...shopData,
        location: body.location,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Admin shops POST error:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Server error" }, { status });
  }
}
