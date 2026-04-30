"use client";

import { useState } from "react";
import { getDocs, collection, query, limit, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";

const SHOP_TEMPLATES = [
  { name: "Tech Galaxy", category: "electronics", phone: "+95 9 111 222 333", rating: 4.5 },
  { name: "Jade Palace", category: "jewelry", phone: "+95 9 222 333 444", rating: 4.8 },
  { name: "Mountain Restaurant", category: "food", phone: "+95 9 333 444 555", rating: 4.6 },
  { name: "Hpa Khant Mart", category: "general", phone: "+95 9 444 555 666", rating: 4.3 },
  { name: "Speed Motors", category: "automotive", phone: "+95 9 555 666 777", rating: 4.4 },
  { name: "Gemstone Shop", category: "jewelry", phone: "+95 9 666 777 888", rating: 4.7 },
  { name: "Highland Cafe", category: "cafe", phone: "+95 9 777 888 999", rating: 4.5 },
];

const LOCATIONS = [
  { lat: 25.6144, lng: 96.3170 },
  { lat: 25.5944, lng: 96.2970 },
  { lat: 25.6244, lng: 96.2970 },
  { lat: 25.5844, lng: 96.3070 },
  { lat: 25.6044, lng: 96.3270 },
  { lat: 25.6344, lng: 96.3370 },
  { lat: 25.5744, lng: 96.2870 },
];

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shops, setShops] = useState<any[]>([]);
  const router = useRouter();

  const listShops = async () => {
    if (!db) return;
    const snapshot = await getDocs(query(collection(db, "shops"), limit(100)));
    const list: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        lat: data.location?.latitude || data.latitude,
        lng: data.location?.longitude || data.longitude,
        logoUrl: data.logo_url,
        rating: data.rating,
        reviewCount: data.review_count,
        isDuplicate: data.name?.toLowerCase().includes("one star") && doc.id !== "3sPa1kDv6JcC2nEHeuJQOeL7Xl53",
      });
    });
    setShops(list);
  };

  const deleteDuplicates = async () => {
    if (!db) return;
    setLoading(true);
    setMessage("Deleting duplicates...");
    
    const snapshot = await getDocs(collection(db, "shops"));
    let deleted = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const isTest = docSnap.id.startsWith("hk-") || docSnap.id.startsWith("test-") || data.isTestShop;
      const isDuplicate = data.name?.toLowerCase().includes("one star") && docSnap.id !== "3sPa1kDv6JcC2nEHeuJQOeL7Xl53";
      
      if (isTest || isDuplicate) {
        await deleteDoc(doc(db, "shops", docSnap.id));
        deleted++;
      }
    }
    
    setMessage(`Deleted ${deleted} shops`);
    await listShops();
    setLoading(false);
  };

  // Product images by category
  const PRODUCT_IMAGES: Record<string, string[]> = {
    electronics: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
    ],
    jewelry: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220b?w=400",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400",
    ],
    food: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    ],
    general: [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
      "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=400",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
    ],
    automotive: [
      "https://images.unsplash.com/photo-1552519507-da3b1425c229?w=400",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
    ],
    cafe: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
    ],
  };

  const REVIEW_COMMENTS = [
    "Great products and friendly service!",
    "Fast delivery and good quality items.",
    "Reasonable prices compared to other shops.",
    "Will definitely come back again!",
    "The staff was very helpful and knowledgeable.",
    "Excellent selection of products.",
    "Best shop in Hpa Khant!",
    "Love the atmosphere and service.",
  ];

  const seedNewShops = async () => {
    if (!db) return;
    setLoading(true);
    setMessage("Creating new sample shops with full data...");
    
    const created: string[] = [];
    
    for (let i = 0; i < SHOP_TEMPLATES.length; i++) {
      const template = SHOP_TEMPLATES[i];
      const location = LOCATIONS[i];
      const shopId = `hk-${Date.now()}-${i}`;
      const reviewCount = 8 + Math.floor(Math.random() * 15);
      
      // Shop logo
      const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(template.name.replace(/\s+/g, '+'))}&background=667eea&color=fff&size=200`;
      
      // Shop images (logo + 2 more)
      const shopImages = [
        logoUrl,
        `https://source.unsplash.com/400x300/?${template.category},shop`,
        `https://source.unsplash.com/400x300/?${template.category},store`,
      ];
      
      // Create shop
      await setDoc(doc(db, "shops", shopId), {
        shop_id: shopId,
        name: template.name,
        name_mm: template.name,
        description: `A great ${template.category} shop in Hpa Khant. We offer quality products and excellent customer service.`,
        category: template.category,
        address: `Hpa Khant, Kachin State, Myanmar`,
        phone: template.phone,
        facebook: `https://facebook.com/${template.name.toLowerCase().replace(/\s+/g, '')}`,
        tiktok: `@${template.name.toLowerCase().replace(/\s+/g, '')}mm`,
        logo_url: logoUrl,
        image_urls: shopImages,
        location: { latitude: location.lat, longitude: location.lng },
        latitude: location.lat,
        longitude: location.lng,
        rating: template.rating,
        review_count: reviewCount,
        delivery_available: true,
        response_speed_score: 75 + Math.floor(Math.random() * 20),
        isTestShop: true,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      // Create reviews
      for (let r = 0; r < reviewCount; r++) {
        const reviewId = `review-${shopId}-${r}`;
        const rating = Math.max(3, Math.min(5, Math.round(template.rating + (Math.random() - 0.5))));
        await setDoc(doc(db, "shops", shopId, "reviews", reviewId), {
          review_id: reviewId,
          shop_id: shopId,
          reviewer_name: `Customer ${r + 1}`,
          rating: rating,
          review_text: REVIEW_COMMENTS[r % REVIEW_COMMENTS.length],
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      
      // Create products
      const productNames: Record<string, string[]> = {
        electronics: ["Smartphone", "Power Bank", "Headphones", "Phone Case", "Charger"],
        jewelry: ["Jade Bracelet", "Jade Ring", "Jade Pendant", "Gemstone Necklace", "Raw Jade"],
        food: ["Kachin Noodles", "Rice Curry", "Tea Salad", "Chicken Soup", "Fried Rice"],
        general: ["Water Bottle", "Snacks", "Batteries", "Soap", "Toothpaste"],
        automotive: ["Engine Oil", "Brake Pads", "Tire", "Chain", "Spark Plug"],
        cafe: ["Espresso", "Latte", "Cappuccino", "Croissant", "Cake"],
      };
      
      const products = productNames[template.category] || productNames.general;
      const images = PRODUCT_IMAGES[template.category] || PRODUCT_IMAGES.general;
      
      for (let p = 0; p < products.length; p++) {
        const productId = `product-${shopId}-${p}`;
        const price = 10000 + Math.floor(Math.random() * 90000);
        
        await setDoc(doc(db, "products", productId), {
          product_id: productId,
          shop_id: shopId,
          product_name: products[p],
          product_name_mm: products[p],
          description: `High quality ${products[p]} from ${template.name}. Best in Hpa Khant!`,
          price: price,
          currency: "MMK",
          booking_fee: Math.round(price * 0.1),
          image_urls: [images[p % images.length]],
          category: template.category,
          delivery_available: true,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      created.push(`${template.name} (${reviewCount} reviews, ${products.length} products)`);
    }
    
    setMessage(`Created ${created.length} shops:\n${created.join("\n")}`);
    await listShops();
    setLoading(false);
  };

  const doEverything = async () => {
    await deleteDuplicates();
    await seedNewShops();
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Shop Seeder</h1>
        
        {message && (
          <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800">
            {message}
          </div>
        )}
        
        <div className="mb-6 space-y-2">
          <button
            onClick={listShops}
            disabled={loading}
            className="w-full rounded-lg bg-gray-600 px-4 py-3 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            1. List Current Shops
          </button>
          
          <button
            onClick={deleteDuplicates}
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 disabled:opacity-50"
          >
            2. Delete Duplicates & Test Shops
          </button>
          
          <button
            onClick={seedNewShops}
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50"
          >
            3. Create 7 New Sample Shops
          </button>
          
          <button
            onClick={doEverything}
            disabled={loading}
            className="w-full rounded-lg bg-[#667eea] px-4 py-3 text-white hover:bg-[#5a6fd6] disabled:opacity-50"
          >
            ⚡ Do Everything (Delete + Create New)
          </button>
        </div>
        
        {shops.length > 0 && (
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 font-semibold">Current Shops ({shops.length})</h2>
            <div className="space-y-2">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className={`rounded border p-2 ${
                    shop.isDuplicate ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        No Logo
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {shop.name} {shop.isDuplicate && "(DUPLICATE - will be deleted)"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shop.category} • {shop.lat?.toFixed(4)}, {shop.lng?.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {shop.id} • Rating: {shop.rating?.toFixed(1) || "N/A"} • Reviews: {shop.reviewCount || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push("/map?radius=50")}
            className="rounded-lg border border-[#667eea] px-4 py-2 text-[#667eea] hover:bg-[#667eea] hover:text-white"
          >
            Go to Map
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
