/**
 * Delete all test/duplicate shops and create fresh sample shops in Hpa Khant
 * 
 * Run with: npx tsx scripts/delete-and-seed.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, GeoPoint } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = getFirestore();

// Hpa Khant center coordinates
const HPA_KHANT = {
  lat: 25.6044,
  lng: 96.3070,
};

// Sample locations near Hpa Khant (within 2-15 km)
const LOCATIONS_NEAR_HPAKHANT = [
  { lat: 25.6144, lng: 96.3170 }, // ~2km NE
  { lat: 25.5944, lng: 96.2970 }, // ~2km SW
  { lat: 25.6244, lng: 96.2970 }, // ~3km NW
  { lat: 25.5844, lng: 96.3070 }, // ~2km S
  { lat: 25.6044, lng: 96.3270 }, // ~2km E
  { lat: 25.6344, lng: 96.3370 }, // ~5km NE
  { lat: 25.5744, lng: 96.2870 }, // ~5km SW
];

// NEW Shop templates - Different names, not "One Star"
const SHOP_TEMPLATES = [
  {
    name: "Tech Galaxy Hpa Khant",
    name_mm: "တက်ခ် ဂလက်ဆီ ဘားကန်",
    category: "electronics",
    description: "Latest smartphones, laptops, and accessories in Hpa Khant",
    phone: "+95 9 111 222 333",
    baseRating: 4.5,
  },
  {
    name: "Golden Jade Emporium",
    name_mm: "ရွှေကျောက်စိမ်းဈေး",
    category: "jewelry",
    description: "Premium jade, gemstones, and traditional jewelry from Kachin",
    phone: "+95 9 222 333 444",
    baseRating: 4.8,
  },
  {
    name: "Mountain View Restaurant",
    name_mm: "တောင်တန်းမြင်ကွင်းစားသောက်ဆိုင်",
    category: "food",
    description: "Authentic Kachin cuisine with mountain views",
    phone: "+95 9 333 444 555",
    baseRating: 4.6,
  },
  {
    name: "Hpa Khant Mart",
    name_mm: "ဖားကန်စျေးဆိုင်",
    category: "general",
    description: "Your one-stop shop for daily necessities",
    phone: "+95 9 444 555 666",
    baseRating: 4.3,
  },
  {
    name: "Speed Motors",
    name_mm: "မြန်နှုန်းမော်တာ",
    category: "automotive",
    description: "Motorcycles, spare parts, and professional repair services",
    phone: "+95 9 555 666 777",
    baseRating: 4.4,
  },
  {
    name: "Jade Palace",
    name_mm: "ကျောက်စိမ်းနန်းတော်",
    category: "jewelry",
    description: "Exquisite jade collections and custom jewelry design",
    phone: "+95 9 666 777 888",
    baseRating: 4.7,
  },
  {
    name: "Highland Coffee",
    name_mm: "မြေချောကဖေး",
    category: "cafe",
    description: "Fresh coffee, pastries, and cozy atmosphere",
    phone: "+95 9 777 888 999",
    baseRating: 4.5,
  },
];

async function deleteAllTestShops() {
  console.log('========================================');
  console.log('DELETING ALL TEST/DUPLICATE SHOPS');
  console.log('========================================\n');
  
  const existingShops = await db.collection('shops').get();
  let deletedCount = 0;
  const keptShops: string[] = [];
  
  for (const doc of existingShops.docs) {
    const data = doc.data();
    const shopName = data.name || 'Unnamed';
    
    // Delete if:
    // 1. ID starts with test-
    // 2. ID starts with shop-
    // 3. Has isTestShop flag
    // 4. Is a duplicate "One Star" (not the main one)
    const isTestShop = doc.id.startsWith('test-') || 
                       doc.id.startsWith('shop-') || 
                       data.isTestShop === true;
    
    const isDuplicateOneStar = shopName.toLowerCase().includes('one star') && 
                               doc.id !== '3sPa1kDv6JcC2nEHeuJQOeL7Xl53';
    
    if (isTestShop || isDuplicateOneStar) {
      // Delete subcollections first
      const productsSnap = await db.collection('shops').doc(doc.id).collection('products').get();
      for (const prod of productsSnap.docs) {
        await prod.ref.delete();
      }
      
      const reviewsSnap = await db.collection('shops').doc(doc.id).collection('reviews').get();
      for (const rev of reviewsSnap.docs) {
        await rev.ref.delete();
      }
      
      // Delete shop
      await doc.ref.delete();
      console.log(`❌ Deleted: ${shopName} (${doc.id})`);
      deletedCount++;
    } else {
      keptShops.push(`${shopName} (${doc.id})`);
    }
  }
  
  console.log(`\n✓ Deleted ${deletedCount} shops`);
  console.log(`✓ Kept ${keptShops.length} shop(s):`);
  keptShops.forEach(s => console.log(`  - ${s}`));
  console.log('');
  
  return deletedCount;
}

async function createSampleShops() {
  console.log('========================================');
  console.log('CREATING NEW SAMPLE SHOPS');
  console.log('========================================\n');
  
  const createdShops = [];
  
  for (let i = 0; i < SHOP_TEMPLATES.length; i++) {
    const template = SHOP_TEMPLATES[i];
    const location = LOCATIONS_NEAR_HPAKHANT[i % LOCATIONS_NEAR_HPAKHANT.length];
    const shopId = `hk-${Date.now()}-${i}`;
    
    const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`;
    
    const shopData = {
      shop_id: shopId,
      name: template.name,
      name_mm: template.name_mm,
      description: template.description,
      category: template.category,
      address: `Hpa Khant, Kachin State, Myanmar`,
      phone: template.phone,
      facebook: `https://facebook.com/${template.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`,
      tiktok: `@${template.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}mm`,
      logo_url: logoUrl,
      image_urls: [logoUrl],
      location: new GeoPoint(location.lat, location.lng),
      latitude: location.lat,
      longitude: location.lng,
      rating: template.baseRating,
      review_count: Math.floor(Math.random() * 30) + 5,
      delivery_available: true,
      response_speed_score: 75 + Math.floor(Math.random() * 20),
      isTestShop: true,
      status: 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };
    
    await db.collection('shops').doc(shopId).set(shopData);
    
    // Add sample reviews
    for (let r = 0; r < 5; r++) {
      const reviewId = `review-${shopId}-${r}`;
      await db.collection('shops').doc(shopId).collection('reviews').doc(reviewId).set({
        review_id: reviewId,
        shop_id: shopId,
        reviewer_name: `Customer ${r + 1}`,
        rating: Math.max(3, Math.min(5, Math.round(template.baseRating + (Math.random() - 0.5)))),
        review_text: `Great ${template.category} shop in Hpa Khant!`,
        created_at: FieldValue.serverTimestamp(),
      });
    }
    
    // Add sample products
    const productCategories: Record<string, string[]> = {
      electronics: ['iPhone Case', 'Samsung Charger', 'Bluetooth Headphones', 'Power Bank', 'Screen Protector'],
      jewelry: ['Jade Bracelet', 'Jade Pendant', 'Jade Ring', 'Gemstone Necklace', 'Raw Jade Stone'],
      food: ['Kachin Noodles', 'Rice Bowl with Curry', 'Tea Leaf Salad', 'Chicken Soup', 'Fried Rice'],
      general: ['Mineral Water', 'Potato Chips', 'AA Batteries', 'Hand Soap', 'Toothpaste'],
      automotive: ['Engine Oil', 'Brake Pads', 'Motorcycle Tire', 'Drive Chain', 'Spark Plug'],
      cafe: ['Espresso Coffee', 'Latte', 'Chocolate Cake', 'Croissant', 'Iced Tea'],
    };
    
    const products = productCategories[template.category] || productCategories.general;
    for (let p = 0; p < products.length; p++) {
      const productId = `product-${shopId}-${p}`;
      const price = 5000 + Math.floor(Math.random() * 50000);
      await db.collection('shops').doc(shopId).collection('products').doc(productId).set({
        product_id: productId,
        shop_id: shopId,
        name: products[p],
        name_mm: products[p],
        description: `Quality ${products[p]} from ${template.name}`,
        price: price,
        currency: 'MMK',
        booking_fee: Math.round(price * 0.1),
        image_urls: ['https://via.placeholder.com/400'],
        category: template.category,
        delivery_available: true,
        status: 'active',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
    
    const distance = calculateDistance(HPA_KHANT.lat, HPA_KHANT.lng, location.lat, location.lng);
    console.log(`✅ Created: ${template.name}`);
    console.log(`   ID: ${shopId}`);
    console.log(`   Location: ${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`);
    console.log(`   Distance from center: ${distance.toFixed(1)} km`);
    console.log(`   Category: ${template.category}`);
    console.log(`   Rating: ${template.baseRating} (${shopData.review_count} reviews)`);
    console.log('');
    
    createdShops.push({ id: shopId, name: template.name, distance });
  }
  
  return createdShops;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

async function listAllShops() {
  const snapshot = await db.collection('shops').get();
  console.log('========================================');
  console.log('FINAL SHOP LIST');
  console.log('========================================');
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const loc = data.location;
    const distanceFromHpaKhant = calculateDistance(HPA_KHANT.lat, HPA_KHANT.lng, loc.latitude, loc.longitude);
    console.log(`- ${data.name} (${doc.id})`);
    console.log(`  Location: ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E`);
    console.log(`  Distance from Hpa Khant: ${distanceFromHpaKhant.toFixed(1)} km`);
    console.log(`  Category: ${data.category}, Rating: ${data.rating}`);
    console.log('');
  });
  
  console.log(`Total: ${snapshot.size} shop(s)\n`);
}

async function main() {
  try {
    console.log('========================================');
    console.log('SHOP RESET - Delete & Seed');
    console.log('========================================\n');
    
    // Step 1: Delete all test/duplicate shops
    const deleted = await deleteAllTestShops();
    
    // Step 2: Create new sample shops
    const created = await createSampleShops();
    
    // Step 3: Show final list
    await listAllShops();
    
    console.log('========================================');
    console.log('✅ COMPLETE!');
    console.log('========================================');
    console.log(`\nDeleted: ${deleted} old/duplicate shops`);
    console.log(`Created: ${created.length} new sample shops`);
    console.log(`\nTest the map:`);
    console.log(`1. Refresh: http://localhost:3000/map?radius=50`);
    console.log(`2. You should see 7 NEW shops with different names`);
    console.log(`3. Your original "One Star" shop is preserved`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
