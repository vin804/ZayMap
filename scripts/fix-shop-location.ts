/**
 * Fix shop location - Move to Yangon area for testing
 * 
 * Run with: npx tsx scripts/fix-shop-location.ts
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

// Yangon coordinates (app default location)
const YANGON = {
  lat: 16.8661,
  lng: 96.1951,
};

// Sample locations near Yangon (within 5-15 km)
const LOCATIONS_NEAR_YANGON = [
  { lat: 16.8800, lng: 96.2100 }, // ~2km NE
  { lat: 16.8500, lng: 96.1800 }, // ~3km SW
  { lat: 16.8900, lng: 96.1800 }, // ~4km NW
  { lat: 16.8400, lng: 96.2000 }, // ~3km S
  { lat: 16.8700, lng: 96.2200 }, // ~3km E
];

async function fixExistingShop(shopId: string) {
  console.log(`\n=== Fixing shop: ${shopId} ===`);
  
  const shopRef = db.collection('shops').doc(shopId);
  const shopSnap = await shopRef.get();
  
  if (!shopSnap.exists) {
    console.log('❌ Shop not found!');
    return false;
  }
  
  const data = shopSnap.data()!;
  console.log(`Current: ${data.name}`);
  console.log(`Old location: ${data.location?.latitude}°N, ${data.location?.longitude}°E`);
  
  // Move to Yangon area (use first location)
  const newLocation = LOCATIONS_NEAR_YANGON[0];
  
  await shopRef.update({
    location: new GeoPoint(newLocation.lat, newLocation.lng),
    latitude: newLocation.lat,
    longitude: newLocation.lng,
    updated_at: FieldValue.serverTimestamp(),
  });
  
  console.log(`✅ New location: ${newLocation.lat}°N, ${newLocation.lng}°E`);
  console.log(`   Distance from Yangon center: ~2km`);
  
  return true;
}

async function createAdditionalShops(ownerId: string) {
  console.log('\n=== Creating 4 more test shops ===');
  
  const shopTemplates = [
    { name: 'Fashion Corner', category: 'clothing', phone: '+95 9 111 222 333' },
    { name: 'Food Paradise', category: 'food', phone: '+95 9 444 555 666' },
    { name: 'Beauty Studio', category: 'beauty', phone: '+95 9 777 888 999' },
    { name: 'Home Essentials', category: 'home', phone: '+95 9 000 111 222' },
  ];
  
  for (let i = 0; i < shopTemplates.length; i++) {
    const template = shopTemplates[i];
    const location = LOCATIONS_NEAR_YANGON[i + 1]; // Skip first one (used by main shop)
    const shopId = `test-shop-${Date.now()}-${i}`;
    
    const shopData = {
      shop_id: shopId,
      name: template.name,
      name_mm: template.name,
      description: `A great ${template.category} shop in Yangon`,
      category: template.category,
      address: `Test Address ${i + 1}, Yangon`,
      phone: template.phone,
      facebook: `https://facebook.com/${template.name.toLowerCase().replace(' ', '')}`,
      tiktok: `@${template.name.toLowerCase().replace(' ', '')}mm`,
      logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`,
      image_urls: [`https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`],
      location: new GeoPoint(location.lat, location.lng),
      latitude: location.lat,
      longitude: location.lng,
      rating: 4.0 + Math.random() * 0.9, // 4.0 - 4.9
      review_count: Math.floor(Math.random() * 20) + 5,
      delivery_available: true,
      response_speed_score: 80 + Math.floor(Math.random() * 15),
      owner_id: ownerId,
      status: 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };
    
    await db.collection('shops').doc(shopId).set(shopData);
    
    // Add sample products
    for (let p = 0; p < 3; p++) {
      const productId = `product-${shopId}-${p}`;
      await db.collection('shops').doc(shopId).collection('products').doc(productId).set({
        product_id: productId,
        shop_id: shopId,
        name: `${template.category} Item ${p + 1}`,
        name_mm: `${template.category} ပစ္စည်း ${p + 1}`,
        description: `High quality ${template.category} product`,
        price: 10000 + Math.floor(Math.random() * 50000),
        currency: 'MMK',
        booking_fee: 1000,
        image_urls: ['https://via.placeholder.com/400'],
        category: template.category,
        delivery_available: true,
        status: 'active',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`✅ Created: ${template.name} at ${location.lat}°N, ${location.lng}°E`);
  }
}

async function listAllShops() {
  const snapshot = await db.collection('shops').get();
  console.log('\n=== Current Shops ===');
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const loc = data.location;
    const distance = calculateDistance(YANGON.lat, YANGON.lng, loc.latitude, loc.longitude);
    console.log(`- ${doc.id}: ${data.name} (${data.category})`);
    console.log(`  Location: ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E`);
    console.log(`  Distance from Yangon: ${distance.toFixed(1)} km`);
    console.log(`  Rating: ${data.rating?.toFixed(1) || 'N/A'} (${data.review_count || 0} reviews)`);
    console.log('');
  });
  
  console.log(`Total: ${snapshot.size} shops\n`);
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

async function main() {
  try {
    console.log('========================================');
    console.log('Shop Location Fix Script');
    console.log('========================================\n');
    
    // List current state
    await listAllShops();
    
    // Fix the main shop location
    const shopId = '3sPa1kDv6JcC2nEHeuJQOeL7Xl53';
    const success = await fixExistingShop(shopId);
    
    if (success) {
      // Create more test shops
      await createAdditionalShops(shopId);
      
      // Show final state
      await listAllShops();
      
      console.log('========================================');
      console.log('✅ DONE! All shops now near Yangon');
      console.log('========================================');
      console.log('\nTest the map:');
      console.log('1. Go to: http://localhost:3000/map?radius=20');
      console.log('2. You should see 5 shops within 20km');
      console.log('3. Shops are located ~2-4km from Yangon center');
    } else {
      console.log('❌ Could not find the shop to fix');
      console.log('Make sure the shop ID is correct in Firestore');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
