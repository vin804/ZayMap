/**
 * API endpoint to seed/delete shops using existing Firebase connection
 * GET /api/seed-shops?action=reset - Delete test shops and create new ones
 * GET /api/seed-shops?action=delete - Just delete test shops
 * GET /api/seed-shops?action=list - List all shops
 */

import { NextResponse } from "next/server";
import { getDocs, collection, query, limit, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Hpa Khant coordinates
const HPA_KHANT = { lat: 25.6044, lng: 96.3070 };

const LOCATIONS = [
  { lat: 25.6144, lng: 96.3170 },
  { lat: 25.5944, lng: 96.2970 },
  { lat: 25.6244, lng: 96.2970 },
  { lat: 25.5844, lng: 96.3070 },
  { lat: 25.6044, lng: 96.3270 },
  { lat: 25.6344, lng: 96.3370 },
  { lat: 25.5744, lng: 96.2870 },
];

const SHOP_TEMPLATES = [
  { name: "Tech Galaxy", category: "electronics", phone: "+95 9 111 222 333", rating: 4.5 },
  { name: "Jade Palace", category: "jewelry", phone: "+95 9 222 333 444", rating: 4.8 },
  { name: "Mountain Restaurant", category: "food", phone: "+95 9 333 444 555", rating: 4.6 },
  { name: "Hpa Khant Mart", category: "general", phone: "+95 9 444 555 666", rating: 4.3 },
  { name: "Speed Motors", category: "automotive", phone: "+95 9 555 666 777", rating: 4.4 },
  { name: "Gemstone Shop", category: "jewelry", phone: "+95 9 666 777 888", rating: 4.7 },
  { name: "Highland Cafe", category: "cafe", phone: "+95 9 777 888 999", rating: 4.5 },
];

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";

    const shopsRef = collection(db, "shops");
    const snapshot = await getDocs(query(shopsRef, limit(100)));

    if (action === "list") {
      const shops: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        shops.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          lat: data.location?.latitude || data.latitude,
          lng: data.location?.longitude || data.longitude,
          isTest: doc.id.startsWith("hk-") || data.isTestShop,
        });
      });
      return NextResponse.json({ count: shops.length, shops });
    }

    if (action === "delete" || action === "reset") {
      // Delete test shops
      let deleted = 0;
      const batch = writeBatch(db!);
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const isTest = docSnap.id.startsWith("hk-") || docSnap.id.startsWith("test-") || data.isTestShop;
        const isDuplicate = data.name?.toLowerCase().includes("one star") && docSnap.id !== "3sPa1kDv6JcC2nEHeuJQOeL7Xl53";
        
        if (isTest || isDuplicate) {
          batch.delete(doc(db!, "shops", docSnap.id));
          deleted++;
        }
      });
      
      await batch.commit();

      if (action === "delete") {
        return NextResponse.json({ 
          success: true, 
          deleted,
          message: `Deleted ${deleted} test/duplicate shops` 
        });
      }
    }

    if (action === "reset") {
      // Create new shops
      const created: string[] = [];
      
      for (let i = 0; i < SHOP_TEMPLATES.length; i++) {
        const template = SHOP_TEMPLATES[i];
        const location = LOCATIONS[i];
        const shopId = `hk-${Date.now()}-${i}`;
        
        await setDoc(doc(db, "shops", shopId), {
          shop_id: shopId,
          name: template.name,
          name_mm: template.name,
          description: `A great ${template.category} shop in Hpa Khant`,
          category: template.category,
          address: "Hpa Khant, Kachin State, Myanmar",
          phone: template.phone,
          logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`,
          image_urls: [`https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`],
          location: { latitude: location.lat, longitude: location.lng },
          latitude: location.lat,
          longitude: location.lng,
          rating: template.rating,
          review_count: 10 + Math.floor(Math.random() * 20),
          delivery_available: true,
          response_speed_score: 80,
          isTestShop: true,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        created.push(template.name);
      }

      return NextResponse.json({ 
        success: true, 
        deleted: action === "reset" ? "see above" : 0,
        created: created.length,
        shopNames: created,
        message: `Reset complete! Created ${created.length} new sample shops.`
      });
    }

    return NextResponse.json({ error: "Invalid action. Use: list, delete, or reset" }, { status: 400 });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ 
      error: "Failed to seed shops", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
