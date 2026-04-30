/**
 * Debug endpoint to check shop data
 * GET /api/debug/shops
 */

import { NextResponse } from "next/server";
import { getDocs, collection, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Haversine formula to calculate distance between two points
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

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firebase not initialized" },
        { status: 500 }
      );
    }

    // Fetch all shops
    const shopsRef = collection(db, "shops");
    const q = query(shopsRef, limit(100));
    const snapshot = await getDocs(q);

    const shops: any[] = [];
    const rawData: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Get coordinates from both possible locations
      const latFromLocation = data.location?.latitude;
      const lngFromLocation = data.location?.longitude;
      const latDirect = data.latitude;
      const lngDirect = data.longitude;
      
      // Use whichever is available
      const latitude = latFromLocation ?? latDirect ?? 0;
      const longitude = lngFromLocation ?? lngDirect ?? 0;
      
      const shopInfo = {
        id: doc.id,
        shop_id: data.shop_id,
        name: data.name,
        category: data.category,
        hasLocationField: !!data.location,
        locationLat: latFromLocation,
        locationLng: lngFromLocation,
        hasDirectLatLng: !!(latDirect || lngDirect),
        directLat: latDirect,
        directLng: lngDirect,
        finalLat: latitude,
        finalLng: longitude,
        validCoordinates: latitude !== 0 && longitude !== 0,
        distanceFromHpaKhant: calculateDistance(25.6044, 96.3070, latitude, longitude),
        distanceFromYangon: calculateDistance(16.8661, 96.1951, latitude, longitude),
        rating: data.rating,
        review_count: data.review_count,
        status: data.status,
      };
      
      shops.push(shopInfo);
      rawData.push({ id: doc.id, ...data });
    });

    // Summary
    const summary = {
      totalShops: shops.length,
      shopsWithValidCoords: shops.filter(s => s.validCoordinates).length,
      shopsWithLocationField: shops.filter(s => s.hasLocationField).length,
      shopsWithDirectLatLng: shops.filter(s => s.hasDirectLatLng).length,
      nearHpaKhant_50km: shops.filter(s => s.distanceFromHpaKhant <= 50).length,
      nearYangon_50km: shops.filter(s => s.distanceFromYangon <= 50).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      shops,
    });

  } catch (error) {
    console.error("Debug shops error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch shops",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
    
  }
}
