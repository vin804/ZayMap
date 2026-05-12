# Admin Shop Creation & Claim System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only `/admin` page where the admin can create ownerless shops (with map-based location picker, logo/banner upload via Cloudinary), view all shops with status, copy invite links, and open dashboards — plus a `/auth?claim=SHOP_ID` flow that transfers shop ownership to a newly signed-up user.

**Architecture:** Admin-only Next.js app routes protected by `useAdminGuard` hook + `ADMIN_UID` constant. Three new API endpoints (`/api/admin/shops` GET/POST, `/api/admin/shops/[shopId]/claim` POST). Auth page enhanced to detect `claim` param and auto-claim after signup.

**Tech Stack:** Next.js App Router, Firebase Firestore (server SDK), Cloudinary unsigned uploads, Leaflet (reuses existing config), TailwindCSS with existing dark mode CSS variables.

---

## File Structure

| File | Responsibility |
|------|---------------|
| `hooks/use-admin-guard.ts` | Returns `isAdmin` boolean by checking `user?.uid === ADMIN_UID` |
| `app/api/admin/shops/route.ts` | `GET` — returns all shops; `POST` — creates shop with `owner_id: "PENDING"` |
| `app/api/admin/shops/[shopId]/claim/route.ts` | `POST` — validates `owner_id === "PENDING"`, updates to caller's UID + new location |
| `app/api/admin/shops/[shopId]/route.ts` | `GET` — returns single shop doc (for auth page claim banner) |
| `components/admin/location-picker.tsx` | Leaflet map component for admin to click-to-place a pin (returns lat/lng) |
| `app/admin/page.tsx` | Main admin page: create form + shop grid + copy link buttons |
| `app/auth/page.tsx` | Modified: detect `?claim=SHOP_ID`, show banner, auto-claim after signup |

---

## Existing Code Patterns to Follow

- **Firebase client:** `lib/firebase.ts` exports `db`, `auth`. Admin APIs use server-side Firebase init with `firebaseConfig` inline (see `app/api/shops/create/route.ts` pattern).
- **Cloudinary upload:** `lib/upload.ts` — client-side `uploadImages(files, folder)` returns `{ urls: string[], error?: string }`.
- **Auth context:** `lib/auth-context.tsx` exports `useAuth()` → `{ user, signUpWithEmail, signInWithEmail, ... }`.
- **Admin UID:** `lib/admin-config.ts` exports `ADMIN_UID = "3sPa1kDv6JcC2nEHeuJQOeL7Xl53"`.
- **Map config:** `lib/leaflet-config.ts` exports `YANGON_COORDINATES`, `TILE_LAYER_URL`, etc.
- **Dark mode styling:** Use `bg-[var(--background)]`, `text-[var(--text-dark)]`, `bg-[var(--card-bg)]`, `border-gray-200/20` (see existing pages).

---

### Task 1: `hooks/use-admin-guard.ts`

**Files:**
- Create: `hooks/use-admin-guard.ts`

- [ ] **Step 1: Write the hook**

```typescript
"use client";

import { useAuth } from "@/lib/auth-context";
import { ADMIN_UID } from "@/lib/admin-config";

export function useAdminGuard() {
  const { user, loading } = useAuth();

  const isAdmin = user?.uid === ADMIN_UID;

  return { isAdmin, user, loading };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-admin-guard.ts
git commit -m "feat(admin): add useAdminGuard hook for admin route protection"
```

---

### Task 2: `app/api/admin/shops/route.ts` (GET + POST)

**Files:**
- Create: `app/api/admin/shops/route.ts`

- [ ] **Step 1: Write the admin shops API**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint, getDocs } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { ADMIN_UID } from "@/lib/admin-config";

function getAdminDb() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON || "{}");
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

function assertAdmin(request: NextRequest) {
  const uid = request.headers.get("x-user-id");
  if (uid !== ADMIN_UID) {
    throw new Error("Forbidden: admin only");
  }
}

// GET /api/admin/shops — list all shops
export async function GET(request: NextRequest) {
  try {
    assertAdmin(request);
    const db = getAdminDb();
    const snapshot = await getDocs(collection(db, "shops"));
    const shops: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      shops.push({
        shop_id: doc.id,
        name: data.name,
        name_mm: data.name_mm || "",
        category: data.category,
        phone: data.phone,
        address: data.address,
        logo_url: data.logo_url || "",
        image_urls: data.image_urls || [],
        location: {
          lat: data.location?.latitude ?? data.latitude ?? 0,
          lng: data.location?.longitude ?? data.longitude ?? 0,
        },
        owner_id: data.owner_id,
        isClaimed: data.owner_id !== "PENDING" && data.owner_id !== "" && !!data.owner_id,
        created_by: data.created_by || "",
        status: data.status || "active",
        created_at: data.created_at?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      });
    });
    return NextResponse.json({ shops });
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

    const db = getAdminDb();
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
```

- [ ] **Step 2: Test with curl**

```bash
curl -X GET "http://localhost:3000/api/admin/shops" \
  -H "x-user-id: 3sPa1kDv6JcC2nEHeuJQOeL7Xl53"
```

Expected: JSON with `{ shops: [...] }`

```bash
curl -X GET "http://localhost:3000/api/admin/shops" \
  -H "x-user-id: WRONG_UID"
```

Expected: `{ error: "Forbidden: admin only" }` with status 403

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/shops/route.ts
git commit -m "feat(admin): add admin shops API (GET list, POST create)"
```

---

### Task 3: `app/api/admin/shops/[shopId]/claim/route.ts`

**Files:**
- Create: `app/api/admin/shops/[shopId]/claim/route.ts`

- [ ] **Step 1: Write the claim API**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, GeoPoint } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";

function getAdminDb() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON || "{}");
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

// POST /api/admin/shops/[shopId]/claim
// Body: { user_lat: number, user_lng: number }
// Headers: x-user-id (the new owner's UID)
export async function POST(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;
    const uid = request.headers.get("x-user-id");
    if (!uid || uid === "PENDING") {
      return NextResponse.json({ error: "Valid user ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { user_lat, user_lng } = body;
    if (typeof user_lat !== "number" || typeof user_lng !== "number") {
      return NextResponse.json({ error: "user_lat and user_lng are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data();
    if (shopData?.owner_id !== "PENDING") {
      return NextResponse.json({ error: "Shop already claimed" }, { status: 409 });
    }

    await updateDoc(shopRef, {
      owner_id: uid,
      location: new GeoPoint(user_lat, user_lng),
      latitude: user_lat,
      longitude: user_lng,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, shop_id: shopId });
  } catch (error: any) {
    console.error("Claim shop error:", error);
    return NextResponse.json({ error: error.message || "Failed to claim shop" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/admin/shops/[shopId]/claim/route.ts"
git commit -m "feat(admin): add shop claim API endpoint"
```

---

### Task 4: `app/api/admin/shops/[shopId]/route.ts` (GET single shop)

**Files:**
- Create: `app/api/admin/shops/[shopId]/route.ts`

- [ ] **Step 1: Write the single shop GET API**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";

function getAdminDb() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON || "{}");
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

// GET /api/admin/shops/[shopId]
export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;
    const db = getAdminDb();
    const shopSnap = await getDoc(doc(db, "shops", shopId));

    if (!shopSnap.exists) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const data = shopSnap.data();
    return NextResponse.json({
      data: {
        shop_id: shopId,
        name: data?.name,
        name_mm: data?.name_mm || "",
        category: data?.category,
        logo_url: data?.logo_url || "",
        owner_id: data?.owner_id,
        isClaimed: data?.owner_id !== "PENDING" && !!data?.owner_id,
      },
    });
  } catch (error: any) {
    console.error("Get single shop error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/admin/shops/[shopId]/route.ts"
git commit -m "feat(admin): add GET single shop endpoint for claim banner lookup"
```

---

### Task 5: `components/admin/location-picker.tsx`

**Files:**
- Create: `components/admin/location-picker.tsx`

- [ ] **Step 1: Write the location picker component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { YANGON_COORDINATES, TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION } from "@/lib/leaflet-config";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

export function LocationPicker({ onLocationChange, initialLocation }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then(() => import("leaflet/dist/leaflet.css")).then(() => setLeafletLoaded(true));
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L || require("leaflet");
    const startLat = initialLocation?.lat ?? YANGON_COORDINATES[0];
    const startLng = initialLocation?.lng ?? YANGON_COORDINATES[1];

    const map = L.map(mapRef.current).setView([startLat, startLng], 14);
    mapInstanceRef.current = map;

    L.tileLayer(TILE_LAYER_URL, {
      attribution: TILE_LAYER_ATTRIBUTION,
      maxZoom: 18,
      minZoom: 5,
    }).addTo(map);

    // Add initial marker if provided
    if (initialLocation) {
      const marker = L.marker([initialLocation.lat, initialLocation.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange({ lat: pos.lat, lng: pos.lng });
      });
    }

    // Click to place marker
    map.on("click", (e: any) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
        markerRef.current = marker;
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange({ lat: pos.lat, lng: pos.lng });
        });
      }
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  return (
    <div className="relative rounded-xl border border-gray-200/20 overflow-hidden">
      {!leafletLoaded && (
        <div className="h-64 bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-gray)]">
          Loading map...
        </div>
      )}
      <div ref={mapRef} className="h-64 w-full" />
      <div className="absolute bottom-2 left-2 bg-[var(--card-bg)]/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-[var(--text-gray)] border border-gray-200/20 flex items-center gap-1">
        <MapPin className="h-3 w-3 text-[#667eea]" />
        Click map to place pin
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/location-picker.tsx
git commit -m "feat(admin): add LocationPicker component for map-based pin placement"
```

---

### Task 6: `app/admin/page.tsx`

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Write the admin page**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { uploadImages } from "@/lib/upload";
import { LocationPicker } from "@/components/admin/location-picker";
import { Store, Copy, ExternalLink, MapPin, Phone, UserCheck, UserX, Loader2, Upload, ImageIcon, X } from "lucide-react";

interface ShopFormData {
  name: string;
  name_mm: string;
  category: string;
  phone: string;
  address: string;
  facebook: string;
  tiktok: string;
  logo: File | null;
  banners: File[];
  location: { lat: number; lng: number } | null;
}

const CATEGORIES = ["Clothing", "Electronics", "Food", "Cosmetics", "Second-hand", "Other"];

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAdminGuard();
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState<ShopFormData>({
    name: "",
    name_mm: "",
    category: "",
    phone: "",
    address: "",
    facebook: "",
    tiktok: "",
    logo: null,
    banners: [],
    location: null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);

  const fetchShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      const res = await fetch("/api/admin/shops", {
        headers: { "x-user-id": "3sPa1kDv6JcC2nEHeuJQOeL7Xl53" },
      });
      const data = await res.json();
      if (data.shops) setShops(data.shops);
    } catch (e) {
      console.error(e);
    } finally {
      setShopsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchShops();
  }, [isAdmin, fetchShops]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--text-dark)]">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-[var(--text-gray)]">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((f) => ({ ...f, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setForm((f) => ({ ...f, banners: [...f.banners, ...files] }));
      setBannerPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    }
  };

  const removeBanner = (index: number) => {
    setForm((f) => ({ ...f, banners: f.banners.filter((_, i) => i !== index) }));
    setBannerPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category || !form.phone.trim() || !form.address.trim() || !form.location) {
      alert("Please fill all required fields and place a pin on the map.");
      return;
    }

    setCreating(true);
    try {
      const logoUrls = form.logo ? await uploadImages([form.logo], "shop-logos") : { urls: [] };
      const bannerUrls = form.banners.length ? await uploadImages(form.banners, "shop-banners") : { urls: [] };

      if (logoUrls.error) throw new Error(logoUrls.error);
      if (bannerUrls.error) throw new Error(bannerUrls.error);

      const res = await fetch("/api/admin/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "3sPa1kDv6JcC2nEHeuJQOeL7Xl53",
        },
        body: JSON.stringify({
          name: form.name,
          name_mm: form.name_mm,
          category: form.category,
          phone: form.phone,
          address: form.address,
          facebook: form.facebook,
          tiktok: form.tiktok,
          logo_url: logoUrls.urls[0] || "",
          image_urls: bannerUrls.urls,
          location: form.location,
        }),
      });

      if (!res.ok) throw new Error("Failed to create shop");

      // Reset form
      setForm({
        name: "", name_mm: "", category: "", phone: "", address: "",
        facebook: "", tiktok: "", logo: null, banners: [], location: null,
      });
      setLogoPreview(null);
      setBannerPreviews([]);
      fetchShops();
    } catch (e: any) {
      alert(e.message || "Error creating shop");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (shopId: string) => {
    const url = `${window.location.origin}/auth?claim=${shopId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shopId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDashboard = (shopId: string) => {
    router.push("/shop/dashboard");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-6 flex items-center gap-2">
          <Store className="h-6 w-6 text-[#667eea]" />
          Admin — Shop Management
        </h1>

        {/* Create Shop Form */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-gray-200/20 p-6 mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-dark)] mb-4">Create New Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-[var(--text-gray)] mb-1">Shop Name (EN) *</label>
              <input
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-gray)] mb-1">Shop Name (MM)</label>
              <input
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.name_mm}
                onChange={(e) => setForm((f) => ({ ...f, name_mm: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-gray)] mb-1">Category *</label>
              <select
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-gray)] mb-1">Phone *</label>
              <input
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+959..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--text-gray)] mb-1">Address *</label>
              <input
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-gray)] mb-1">Facebook (Optional)</label>
              <input
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.facebook}
                onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-gray)] mb-1">TikTok (Optional)</label>
              <input
                className="w-full bg-[var(--background)] border border-gray-200/20 rounded-lg px-3 py-2 text-[var(--text-dark)] focus:outline-none focus:border-[#667eea]"
                value={form.tiktok}
                onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--text-gray)] mb-2">Shop Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img src={logoPreview} alt="logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200/20" />
              )}
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20 cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">{form.logo ? form.logo.name : "Upload Logo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--text-gray)] mb-2">Shop Banners</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {bannerPreviews.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="banner" className="w-20 h-14 rounded-lg object-cover border border-gray-200/20" />
                  <button onClick={() => removeBanner(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20 cursor-pointer transition-colors">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">Add Banner</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleBannerChange} />
              </label>
            </div>
          </div>

          {/* Map Location */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--text-gray)] mb-2">Place Temporary Location *</label>
            <LocationPicker
              onLocationChange={(loc) => setForm((f) => ({ ...f, location: loc }))}
              initialLocation={form.location || undefined}
            />
            {form.location && (
              <div className="mt-2 text-xs text-[var(--text-gray)] flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#667eea]" />
                {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={creating}
            className="bg-[#667eea] hover:bg-[#5a67d8] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
            {creating ? "Creating..." : "Create Shop"}
          </button>
        </div>

        {/* All Shops Grid */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-dark)] mb-4">
            All Shops ({shops.length})
          </h2>
          {shopsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#667eea]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <div key={shop.shop_id} className="bg-[var(--card-bg)] rounded-xl border border-gray-200/20 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {shop.logo_url && (
                      <img src={shop.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200/20" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-dark)] truncate">{shop.name}</h3>
                      <p className="text-xs text-[var(--text-gray)]">{shop.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {shop.isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-md">
                        <UserCheck className="h-3 w-3" /> Claimed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-md">
                        <UserX className="h-3 w-3" /> Ownerless
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(shop.shop_id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-500/10 text-[var(--text-gray)] hover:bg-gray-500/20 transition-colors text-xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedId === shop.shop_id ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      onClick={() => openDashboard(shop.shop_id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#667eea] text-white hover:bg-[#5a67d8] transition-colors text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Dashboard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): add admin page with create form, location picker, and shop grid"
```

---

### Task 7: Modify `app/auth/page.tsx` for claim flow

**Files:**
- Modify: `app/auth/page.tsx`

- [ ] **Step 1: Add claim detection and post-signup flow**

At the top of `app/auth/page.tsx`, add imports:
```typescript
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
```

Add these new state variables after existing state declarations (around line 16-17):
```typescript
const searchParams = useSearchParams();
const claimShopId = searchParams.get("claim");
const [claimShop, setClaimShop] = useState<any>(null);
const [claiming, setClaiming] = useState(false);
```

Add this useEffect after the existing useEffect that redirects logged-in users (after line 25):
```typescript
useEffect(() => {
  if (claimShopId) {
    fetch(`/api/admin/shops/${claimShopId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data && !data.data.isClaimed) {
          setClaimShop(data.data);
        }
      });
  }
}, [claimShopId]);
```

Add a `handleClaim` function inside the component (before return):
```typescript
const handleClaim = async () => {
  if (!claimShopId || !user) return;
  setClaiming(true);
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });

    const res = await fetch(`/api/admin/shops/${claimShopId}/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      },
      body: JSON.stringify({
        user_lat: pos.coords.latitude,
        user_lng: pos.coords.longitude,
      }),
    });

    if (res.ok) {
      router.push("/shop/dashboard");
    } else {
      const err = await res.json();
      alert(err.error || "Failed to claim shop");
    }
  } catch (e: any) {
    alert(e.message || "Failed to get location");
  } finally {
    setClaiming(false);
  }
};
```

Add this claim banner inside the card, right after the `<div className="bg-[var(--bg-elevated)] ...">` opening (around line 49, before the Firebase error block):

```tsx
          {claimShop && (
            <div className="mb-5 rounded-xl bg-[#667eea]/10 border border-[#667eea]/20 p-4">
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#667eea]" />
                <div>
                  <h3 className="font-semibold text-sm text-[#667eea]">Claim Shop: {claimShop.name}</h3>
                  <p className="mt-1 text-xs text-[var(--text-gray)]">
                    Sign up or sign in to claim ownership of this shop. Your GPS location will become the shop location.
                  </p>
                  {user && (
                    <button
                      onClick={handleClaim}
                      disabled={claiming}
                      className="mt-3 bg-[#667eea] hover:bg-[#5a67d8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {claiming ? "Claiming..." : "Claim This Shop"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
```

- [ ] **Step 2: Test the claim flow**

1. Create a shop via admin page
2. Copy invite link
3. Open in incognito → should show claim banner
4. Sign up → after successful signup, click "Claim This Shop" → redirects to `/shop/dashboard`

- [ ] **Step 3: Commit**

```bash
git add app/auth/page.tsx
git commit -m "feat(auth): add shop claim flow via /auth?claim=SHOP_ID"
```

---

### Task 8: Build Verification

- [ ] **Step 1: Run dev build**

```bash
npm run dev
```

- [ ] **Step 2: Manual test checklist**

| Test | Expected |
|------|----------|
| Visit `/admin` as non-admin | "Access Denied" page |
| Visit `/admin` as admin | Shows create form + shop grid |
| Create shop with all fields + map pin + uploads | Success, appears in grid |
| Click "Copy Link" on ownerless shop | Clipboard has `/auth?claim=SHOP_ID` |
| Open copied link in incognito | Shows claim banner with shop name |
| Sign up from claim link | Account created, shows "Claim This Shop" button |
| Click "Claim This Shop" | Shop owner_id updates to new UID, location moves to GPS coords, redirects to `/shop/dashboard` |
| Admin grid updates | Shop now shows "Claimed" badge |

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: admin shop creation and claim system complete"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Plan Task |
|-----------------|-----------|
| Admin-only page | Task 6 (isAdmin guard) |
| Create shop form with all fields | Task 6 |
| Map location picker | Task 5 + Task 6 integration |
| Logo/banner upload via Cloudinary | Task 6 (reuses `lib/upload.ts`) |
| Shop created with `owner_id: "PENDING"` | Task 2 POST endpoint |
| View all shops with status | Task 2 GET endpoint + Task 6 grid |
| Copy invite link | Task 6 `copyLink` function |
| Open existing dashboard | Task 6 `openDashboard` button |
| `/auth?claim=SHOP_ID` detection | Task 7 |
| Post-signup claim with GPS location | Task 7 `handleClaim` |
| Transfer ownership + update location | Task 3 claim API |

### Placeholder Scan
- No TBDs, TODOs, or vague steps. Every step has actual code.

### Type Consistency
- `owner_id: "PENDING"` sentinel used consistently across API and auth flow.
- `x-user-id` header pattern used consistently for server-side auth verification.
