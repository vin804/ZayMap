/**
 * Seed sample shops in Hpa Khant, Myanmar
 * Hpa Khant coordinates: ~25.6°N, 96.3°E
 * 
 * Run with: npx tsx scripts/seed-hpakant.ts
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

// Hpa Khant center coordinates (based on user's shop location)
const HPA_KHANT = {
  lat: 25.6044,
  lng: 96.3070,
};

// Sample locations near Hpa Khant (within 2-10 km)
const LOCATIONS_NEAR_HPAKHANT = [
  { lat: 25.6144, lng: 96.3170 }, // ~2km NE
  { lat: 25.5944, lng: 96.2970 }, // ~2km SW
  { lat: 25.6244, lng: 96.2970 }, // ~3km NW
  { lat: 25.5844, lng: 96.3070 }, // ~2km S
  { lat: 25.6044, lng: 96.3270 }, // ~2km E
  { lat: 25.6344, lng: 96.3370 }, // ~5km NE
  { lat: 25.5744, lng: 96.2870 }, // ~5km SW
];

// Shop templates
const SHOP_TEMPLATES = [
  {
    name: "Hpa Khant Electronics",
    name_mm: "ဖားကန်အီလက်ထရောနစ်",
    category: "electronics",
    description: "Mobile phones, accessories, and electronic gadgets in Hpa Khant",
    phone: "+95 9 123 456 789",
    baseRating: 4.5,
  },
  {
    name: "Jade Market Store",
    name_mm: "ကျောက်စိမ်းဈေး",
    category: "jewelry",
    description: "Authentic jade and gemstones from Hpa Khant mines",
    phone: "+95 9 234 567 890",
    baseRating: 4.7,
  },
  {
    name: "Hpa Khant Restaurant",
    name_mm: "ဖားကန်စားသောက်ဆိုင်",
    category: "food",
    description: "Traditional Kachin and Myanmar cuisine",
    phone: "+95 9 345 678 901",
    baseRating: 4.3,
  },
  {
    name: "Mountain View Mart",
    name_mm: "တောင်တန်းမြင်ကွင်း",
    category: "general",
    description: "Daily necessities and groceries",
    phone: "+95 9 456 789 012",
    baseRating: 4.2,
  },
  {
    name: "Hpa Khant Motors",
    name_mm: "ဖားကန်မော်တာ",
    category: "automotive",
    description: "Motorcycles, spare parts, and repair services",
    phone: "+95 9 567 890 123",
    baseRating: 4.4,
  },
  {
    name: "Golden Jade Shop",
    name_mm: "ရွှေကျောက်စိမ်း",
    category: "jewelry",
    description: "Premium jade jewelry and raw stones",
    phone: "+95 9 678 901 234",
    baseRating: 4.6,
  },
  {
    name: "Hpa Khant Cafe",
    name_mm: "ဖားကန်ကဖေး",
    category: "cafe",
    description: "Coffee, tea, and snacks with local charm",
    phone: "+95 9 789 012 345",
    baseRating: 4.1,
  },
];

async function seedHpaKhantShops() {
  console.log('========================================');
  console.log('Seeding Hpa Khant Shops');
  console.log(`Center: ${HPA_KHANT.lat}°N, ${HPA_KHANT.lng}°E`);
  console.log('========================================\n');

  // Delete existing test shops first
  console.log('Cleaning up existing test shops...');
  const existingShops = await db.collection('shops').get();
  let deletedCount = 0;
  
  for (const doc of existingShops.docs) {
    const data = doc.data();
    // Delete shops that are test shops (not the main user shop)
    if (doc.id.startsWith('test-') || doc.id.startsWith('shop-') || data.isTestShop) {
      await db.collection('shops').doc(doc.id).delete();
      deletedCount++;
    }
  }
  console.log(`Deleted ${deletedCount} existing test shops\n`);

  // Create new shops
  const createdShops = [];
  
  for (let i = 0; i < SHOP_TEMPLATES.length; i++) {
    const template = SHOP_TEMPLATES[i];
    const location = LOCATIONS_NEAR_HPAKHANT[i % LOCATIONS_NEAR_HPAKHANT.length];
    const shopId = `test-hpakant-${Date.now()}-${i}`;
    
    const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`;
    
    const shopData = {
      shop_id: shopId,
      name: template.name,
      name_mm: template.name_mm,
      description: template.description,
      category: template.category,
      address: `Hpa Khant, Kachin State, Myanmar`,
      phone: template.phone,
      facebook: `https://facebook.com/${template.name.toLowerCase().replace(/\s+/g, '')}`,
      tiktok: `@${template.name.toLowerCase().replace(/\s+/g, '')}mm`,
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
      electronics: ['Phone Case', 'Charger', 'Headphones', 'Screen Protector'],
      jewelry: ['Jade Bracelet', 'Jade Pendant', 'Jade Ring', 'Raw Jade Stone'],
      food: ['Kachin Noodles', 'Rice Bowl', 'Tea Salad', 'Soup'],
      general: ['Water', 'Snacks', 'Batteries', 'Soap'],
      automotive: ['Oil', 'Brake Pads', 'Tire', 'Chain'],
      cafe: ['Coffee', 'Tea', 'Cake', 'Sandwich'],
    };
    
    const products = productCategories[template.category] || productCategories.general;
    for (let p = 0; p < products.length; p++) {
      const productId = `product-${shopId}-${p}`;
      await db.collection('shops').doc(shopId).collection('products').doc(productId).set({
        product_id: productId,
        shop_id: shopId,
        name: products[p],
        name_mm: products[p],
        description: `Quality ${products[p]} from ${template.name}`,
        price: 5000 + Math.floor(Math.random() * 50000),
        currency: 'MMK',
        booking_fee: 500,
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
    console.log(`   Location: ${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`);
    console.log(`   Distance from center: ${distance.toFixed(1)} km`);
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
  console.log('\n========================================');
  console.log('All Shops in Database');
  console.log('========================================');
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const loc = data.location;
    const distanceFromHpaKhant = calculateDistance(HPA_KHANT.lat, HPA_KHANT.lng, loc.latitude, loc.longitude);
    console.log(`- ${doc.id}: ${data.name}`);
    console.log(`  Location: ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E`);
    console.log(`  Distance from Hpa Khant: ${distanceFromHpaKhant.toFixed(1)} km`);
    console.log(`  Category: ${data.category}`);
    console.log('');
  });
  
  console.log(`Total: ${snapshot.size} shops\n`);
}

async function main() {
  try {
    const shops = await seedHpaKhantShops();
    await listAllShops();
    
    console.log('========================================');
    console.log('✅ SEEDING COMPLETE!');
    console.log('========================================');
    console.log(`\nCreated ${shops.length} test shops in Hpa Khant area`);
    console.log(`\nTest the map:`);
    console.log(`1. Go to: http://localhost:3000/map?radius=50`);
    console.log(`2. Or with larger radius: http://localhost:3000/map?radius=200`);
    console.log(`3. All shops are within 10km of Hpa Khant center`);
    console.log(`\nNote: Make sure your app location is set to Hpa Khant area`);
    console.log(`or increase radius to 1000km+ to see from Yangon`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
