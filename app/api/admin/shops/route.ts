import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-server";
import { FieldValue, GeoPoint, Timestamp } from "firebase-admin/firestore";
import { ADMIN_UID } from "@/lib/admin-config";



function assertAdmin(request: NextRequest) {
  const uid = request.headers.get("x-user-id");
  if (uid !== ADMIN_UID) {
    throw new Error("Forbidden: admin only");
  }
}

// GET /api/admin/shops — list all shops with owner names
export async function GET() {
  try {
        const snapshot = await adminDb.collection("shops").get();
    const shops: any[] = [];
    const TEST_SHOP_ID_PREFIXES = ["test-", "sample-shop-"];
    const TEST_OWNER_ID_PREFIXES = ["test-owner-", "sample-owner-"];

    function isSampleShop(shopData: any, shopId: string) {
      const ownerId = typeof shopData.owner_id === "string" ? shopData.owner_id : "";
      const hasTestId = TEST_SHOP_ID_PREFIXES.some((prefix) => shopId.startsWith(prefix));
      const hasTestOwner = TEST_OWNER_ID_PREFIXES.some((prefix) => ownerId.startsWith(prefix));
      return hasTestId || hasTestOwner || shopData.isTestShop === true;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const shopId = docSnap.id;

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
        shop_id: docSnap.id,
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

    // Fetch owner names from users collection
    const ownerIds = [...new Set(
      shops.map((s) => s.owner_id).filter((id) => id && id !== "PENDING" && id !== "")
    )];

    const ownerMap = new Map<string, string>();
    await Promise.all(
      ownerIds.map(async (uid) => {
        try {
          const userSnap = await adminDb.collection("users").doc(uid).get();
          if (userSnap.exists()) {
            const u = userSnap.data();
            ownerMap.set(uid, u.displayName || u.name || u.email || "Unknown");
          }
        } catch {
          // silently skip users that fail to load
        }
      })
    );

    shops.forEach((shop) => {
      if (shop.owner_id && shop.owner_id !== "PENDING") {
        shop.owner_name = ownerMap.get(shop.owner_id) || "Unknown";
      }
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
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("shops").add(shopData);

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