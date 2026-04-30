/**
 * Fix existing shop data and add complete test data
 * 
 * Run with: npx tsx scripts/fix-shop-data.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = getFirestore();

// Sample review texts
const REVIEW_COMMENTS = [
  "Great shop with excellent products!",
  "Fast delivery and friendly service.",
  "High quality items, will buy again.",
  "Reasonable prices compared to others.",
  "Quick response to my questions.",
  "Items arrived in perfect condition.",
  "Trustworthy seller, authentic products.",
  "Convenient location and helpful staff.",
  "Love the variety of products here!",
  "Best shop in the area, highly recommended!",
];

// Sample product images by category
const PRODUCT_IMAGES: Record<string, string[]> = {
  electronics: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    "https://images.unsplash.com/photo-1572569028738-411a1973d274?w=600",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600",
  ],
  clothing: [
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600",
  ],
  food: [
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
    "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600",
  ],
  home: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600",
    "https://images.unsplash.com/photo-1583847661860-f81fc727d98c?w=600",
  ],
};

// Sample shop templates
const SHOP_TEMPLATES = [
  {
    name: "Tech Galaxy",
    name_mm: "တက်ခ် ဂလက်ဆီ",
    description: "Premium electronics and gadgets store",
    category: "electronics",
    address: "123 Tech Street, Yangon",
    phone: "+95 9 123 456 789",
    facebook: "https://facebook.com/techgalaxy",
    tiktok: "@techgalaxymm",
    baseRating: 4.5,
  },
  {
    name: "Fashion Hub",
    name_mm: "ဖက်ရှင်ဟဗ်",
    description: "Trendy clothing and accessories",
    category: "clothing",
    address: "456 Fashion Ave, Yangon",
    phone: "+95 9 234 567 890",
    facebook: "https://facebook.com/fashionhub",
    tiktok: "@fashionhubmm",
    baseRating: 4.3,
  },
  {
    name: "Golden Spoon",
    name_mm: "ရွှင်နိဒါန်း",
    description: "Delicious Myanmar cuisine and snacks",
    category: "food",
    address: "789 Food Street, Yangon",
    phone: "+95 9 345 678 901",
    facebook: "https://facebook.com/goldenspoon",
    tiktok: "@goldenspoonmm",
    baseRating: 4.7,
  },
  {
    name: "Beauty Corner",
    name_mm: "အလှကုန်ကောနာ",
    description: "Cosmetics and beauty products",
    category: "beauty",
    address: "321 Beauty Lane, Yangon",
    phone: "+95 9 456 789 012",
    facebook: "https://facebook.com/beautycorner",
    tiktok: "@beautycornermm",
    baseRating: 4.4,
  },
  {
    name: "Home Comfort",
    name_mm: "အိမ်သာယာ",
    description: "Quality furniture and home decor",
    category: "home",
    address: "654 Home Street, Yangon",
    phone: "+95 9 567 890 123",
    facebook: "https://facebook.com/homecomfort",
    tiktok: "@homecomfortmm",
    baseRating: 4.2,
  },
];

// Locations near Myanmar (Yangon area ~ 16.8°N, 96.1°E)
const LOCATIONS = [
  { lat: 16.8661, lng: 96.1951 },
  { lat: 16.8500, lng: 96.1800 },
  { lat: 16.8800, lng: 96.2100 },
  { lat: 16.8400, lng: 96.2000 },
  { lat: 16.8900, lng: 96.1850 },
];

async function fixExistingShop(shopId: string) {
  console.log(`\n=== Fixing shop: ${shopId} ===`);
  
  const shopRef = db.collection('shops').doc(shopId);
  const shopSnap = await shopRef.get();
  
  if (!shopSnap.exists) {
    console.log('Shop not found, creating new...');
    return createNewShop(shopId, 0);
  }
  
  const data = shopSnap.data()!;
  
  // Fix missing fields
  const updates: any = {
    shop_id: shopId,
    updated_at: FieldValue.serverTimestamp(),
  };
  
  // Ensure latitude/longitude as separate fields
  if (data.location) {
    updates.latitude = data.location.latitude;
    updates.longitude = data.location.longitude;
  }
  
  // Add missing optional fields
  if (!data.description) updates.description = data.name + " - A great shop";
  if (!data.logo_url) {
    updates.logo_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=667eea&color=fff&size=200`;
  }
  if (!data.image_urls || data.image_urls.length === 0) {
    updates.image_urls = [updates.logo_url];
  }
  
  await shopRef.update(updates);
  console.log('✓ Updated shop fields');
  
  // Add reviews if none exist
  const reviewsSnap = await shopRef.collection('reviews').get();
  if (reviewsSnap.empty) {
    console.log('Adding reviews...');
    await addReviews(shopId, data.name, 8);
  }
  
  // Add products if none exist
  const productsSnap = await shopRef.collection('products').get();
  if (productsSnap.empty) {
    console.log('Adding products...');
    await addProducts(shopId, data.category, data.name);
  }
  
  // Recalculate and update rating
  await updateShopRating(shopId);
  
  console.log('✓ Shop fixed successfully!');
  return shopId;
}

async function createNewShop(index: number, locationIndex: number) {
  const template = SHOP_TEMPLATES[index % SHOP_TEMPLATES.length];
  const location = LOCATIONS[locationIndex % LOCATIONS.length];
  const shopId = `shop-${Date.now()}-${index}`;
  
  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(template.name)}&background=667eea&color=fff&size=200`;
  
  const shopData = {
    shop_id: shopId,
    name: template.name,
    name_mm: template.name_mm,
    description: template.description,
    category: template.category,
    address: template.address,
    phone: template.phone,
    facebook: template.facebook,
    tiktok: template.tiktok,
    logo_url: logoUrl,
    image_urls: [logoUrl],
    location: new (db as any).GeoPoint(location.lat, location.lng),
    latitude: location.lat,
    longitude: location.lng,
    rating: template.baseRating,
    review_count: 0,
    delivery_available: true,
    response_speed_score: 80 + Math.floor(Math.random() * 20),
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  };
  
  await db.collection('shops').doc(shopId).set(shopData);
  console.log(`✓ Created shop: ${template.name} (${shopId})`);
  
  // Add reviews
  await addReviews(shopId, template.name, 8, template.baseRating);
  
  // Add products
  await addProducts(shopId, template.category, template.name);
  
  // Update rating based on reviews
  await updateShopRating(shopId);
  
  return shopId;
}

async function addReviews(shopId: string, shopName: string, count: number, baseRating: number = 4.5) {
  const batch = db.batch();
  
  for (let i = 0; i < count; i++) {
    const rating = Math.max(3, Math.min(5, Math.round(baseRating + (Math.random() - 0.5))));
    const reviewRef = db.collection('shops').doc(shopId).collection('reviews').doc(`review-${i}`);
    
    batch.set(reviewRef, {
      review_id: `review-${i}`,
      shop_id: shopId,
      reviewer_name: `Customer ${i + 1}`,
      rating: rating,
      review_text: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
      created_at: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(`  ✓ Added ${count} reviews`);
}

async function addProducts(shopId: string, category: string, shopName: string) {
  const images = PRODUCT_IMAGES[category] || PRODUCT_IMAGES.electronics;
  const productNames: Record<string, string[]> = {
    electronics: ["Smartphone", "Wireless Earbuds", "Power Bank", "Phone Case", "Cable"],
    clothing: ["T-Shirt", "Jeans", "Jacket", "Dress", "Shoes"],
    food: ["Burger", "Pizza", "Noodles", "Drink", "Snack"],
    beauty: ["Face Cream", "Lipstick", "Perfume", "Shampoo", "Mask"],
    home: ["Chair", "Table", "Lamp", "Mirror", "Shelf"],
  };
  
  const names = productNames[category] || productNames.electronics;
  
  for (let i = 0; i < 5; i++) {
    const productId = `product-${shopId}-${i}`;
    const price = 10000 + Math.floor(Math.random() * 90000);
    
    await db.collection('shops').doc(shopId).collection('products').doc(productId).set({
      product_id: productId,
      shop_id: shopId,
      name: names[i],
      name_mm: names[i],
      description: `High quality ${names[i].toLowerCase()} from ${shopName}`,
      price: price,
      currency: 'MMK',
      booking_fee: Math.round(price * 0.1),
      image_urls: [images[i % images.length]],
      category: category,
      delivery_available: true,
      status: 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  
  console.log(`  ✓ Added 5 products`);
}

async function updateShopRating(shopId: string) {
  const reviewsSnap = await db.collection('shops').doc(shopId).collection('reviews').get();
  
  if (reviewsSnap.empty) return;
  
  let totalRating = 0;
  let count = 0;
  
  reviewsSnap.forEach(doc => {
    totalRating += doc.data().rating || 0;
    count++;
  });
  
  const avgRating = Math.round((totalRating / count) * 10) / 10;
  
  await db.collection('shops').doc(shopId).update({
    rating: avgRating,
    review_count: count,
    updated_at: FieldValue.serverTimestamp(),
  });
  
  console.log(`  ✓ Updated rating: ${avgRating} (${count} reviews)`);
}

async function listAllShops() {
  const snapshot = await db.collection('shops').get();
  console.log('\n=== Current Shops ===');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ${doc.id}: ${data.name} (${data.category}) - Rating: ${data.rating}, Reviews: ${data.review_count}`);
  });
  console.log(`Total: ${snapshot.size} shops\n`);
}

async function main() {
  try {
    console.log('Starting shop data fix...\n');
    
    // List current shops
    await listAllShops();
    
    // Fix existing "One Star" shop
    console.log('Fixing your existing shop...');
    await fixExistingShop('3sPa1kDv6JcC2nEHeuJQOeL7Xl53');
    
    // Create additional test shops
    console.log('\nCreating test shops...');
    for (let i = 0; i < 4; i++) {
      await createNewShop(i, i);
    }
    
    // Final list
    await listAllShops();
    
    console.log('\n✅ All done! Your shops should now appear on the map.');
    console.log('Test the map at: http://localhost:3000/map?radius=50');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
