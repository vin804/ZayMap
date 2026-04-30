/**
 * Test Data Seeding Script
 * Deletes all existing shops and creates 3-5 sample shops with complete data
 * 
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = getFirestore();

// Configuration
const USER_LOCATION = {
  lat: 16.8661, // Myanmar/Yangon area (change to your location)
  lng: 96.1951,
};

const SHOP_OFFSETS = [
  { lat: 0.002, lng: 0.002 },
  { lat: -0.003, lng: 0.001 },
  { lat: 0.001, lng: -0.002 },
  { lat: -0.002, lng: -0.003 },
  { lat: 0.003, lng: 0.0 },
];

const CATEGORIES = [
  'electronics',
  'clothing',
  'food',
  'beauty',
  'home',
];

// Sample shop data
const SHOP_TEMPLATES = [
  {
    name: "Tech Haven Myanmar",
    name_mm: "တက်ခ် ဟေဗင် မြန်မာ",
    description: "Your one-stop shop for all electronics and gadgets. We offer phones, laptops, accessories, and repair services.",
    description_mm: "အီလက်ထရွန်းနစ်ပစ္စည်းနှင့် ဂျက်ဂျက်များအတွက် သင့်ရဲ့ တစ်နေရာတည်းဝယ်စုံပြ။ ဖုန်းများ၊ လက်ပ်တော့များ၊ အသုံးအဆောင်ပစ္စည်းများနှင့် ပြုပြင်မှုဝန်ဆောင်မှုများကို ပေးပါသည်။",
    logo_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    phone: "+95 9 123 456 789",
    email: "tech.haven@example.com",
    address: "123 Tech Street, Yangon",
    facebook_url: "https://facebook.com/techhavenmyanmar",
    tiktok_handle: "@techhavenmm",
    rating: 4.7,
    delivery_available: true,
    categories: ["electronics", "accessories"],
  },
  {
    name: "Fashion Corner",
    name_mm: "ဖက်ရှင်ကောနာ",
    description: "Trendy clothing and accessories for men, women, and kids. Latest fashion from local and international brands.",
    description_mm: "ယောက်ျား၊ မိန်းကလေး၊ ကလေးများအတွက် ခေတ်စားနေသော အဝတ်အစားနှင့် အသုံးအဆောင်ပစ္စည်းများ။ ပြည်တွင်းနှင့် နိုင်ငံတကာ ဘရန့်များမှ နောက်ဆုံးပေါ်ဖက်ရှင်။",
    logo_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    phone: "+95 9 234 567 890",
    email: "fashion.corner@example.com",
    address: "456 Fashion Ave, Yangon",
    facebook_url: "https://facebook.com/fashioncorner",
    tiktok_handle: "@fashioncornermm",
    rating: 4.5,
    delivery_available: true,
    categories: ["clothing", "accessories"],
  },
  {
    name: "Golden Spoon Restaurant",
    name_mm: "ဂေါ်ဒင်စ্পoon စားသောက်ဆိုင်",
    description: "Authentic Myanmar cuisine and international dishes. Fresh ingredients, delicious flavors, comfortable dining experience.",
    description_mm: "မူလမြန်မာ့အစားအစာနှင့် နိုင်ငံတကာအစားအစာများ။ လတ်ဆတ်သော ပါဝင်ပစ္စည်းများ၊ အရသာရှိသော အရသာများ၊ သက်တောင့်သက်သာစွာ စားသောက်နိုင်သော အတွေ့အကြုံ။",
    logo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    phone: "+95 9 345 678 901",
    email: "goldenspoon@example.com",
    address: "789 Food Street, Yangon",
    facebook_url: "https://facebook.com/goldenspoon",
    tiktok_handle: "@goldenspoonmm",
    rating: 4.8,
    delivery_available: true,
    categories: ["food", "restaurant"],
  },
  {
    name: "Beauty Glow Cosmetics",
    name_mm: "ဘিরတီဂလို အလှကုန်",
    description: "Premium cosmetics and skincare products. Korean beauty, makeup essentials, and professional beauty services.",
    description_mm: "ပရီမီယမ် အလှကုန်ပစ္စည်းများ။ ကိုရီးယားဘီူတီ၊ မက်ကအဲ့ဘ်အသုံးအဆောင်ပစ္စည်းများ၊ ပရော်ဖက်ရှင်နယ် အလှပြင်ဝန်ဆောင်မှုများ။",
    logo_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    phone: "+95 9 456 789 012",
    email: "beautyglow@example.com",
    address: "321 Beauty Lane, Yangon",
    facebook_url: "https://facebook.com/beautyglow",
    tiktok_handle: "@beautyglowmm",
    rating: 4.6,
    delivery_available: false,
    categories: ["beauty", "cosmetics"],
  },
  {
    name: "Home Comfort Furniture",
    name_mm: "ဟုမ်း ကမ်ဖတ် အရာဝယ်ဆိုင်",
    description: "Quality furniture for your home. Sofas, beds, dining sets, and home decor. Affordable prices, delivery available.",
    description_mm: "သင့်အိမ်အတွက် အရည်အသွေးရှိသော အရာဝယ်ပစ္စည်းများ။ ဆိုဖာများ၊ အိပ်ယာများ၊ စားသောက်စားပွဲများ၊ နှင့် အိမ်အလှဆင်ပစ္စည်းများ။ စျေးနှုန်းမှန်မှန်၊ ပို့ဆောင်မှုပေးပါသည်။",
    logo_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    phone: "+95 9 567 890 123",
    email: "homecomfort@example.com",
    address: "654 Home Street, Yangon",
    facebook_url: "https://facebook.com/homecomfort",
    tiktok_handle: "@homecomfortmm",
    rating: 4.4,
    delivery_available: true,
    categories: ["home", "furniture"],
  },
];

// Sample product templates for each category
const PRODUCT_TEMPLATES: Record<string, Array<{ name: string; name_mm: string; price: number; description: string }>> = {
  electronics: [
    { name: "Wireless Earbuds Pro", name_mm: "ဘလူးတုသ် ဘယ်အားပြား", price: 45000, description: "High-quality wireless earbuds with noise cancellation" },
    { name: "Smart Watch Series 5", name_mm: "စမတ်ဝotch လေးစနစ် ၅", price: 89000, description: "Fitness tracking, heart rate monitor, GPS" },
    { name: "Power Bank 20000mAh", name_mm: "ပါဝါဘဏ် ၂၀၀၀၀mAh", price: 25000, description: "Fast charging, dual USB ports" },
    { name: "Phone Case Premium", name_mm: "ဖုန်းခွက်ပရီမီယံ", price: 15000, description: "Shockproof, stylish design" },
  ],
  clothing: [
    { name: "Summer Dress Floral", name_mm: "နွေရာသီဝတ်အင်္ကျီပန်းပွင့်", price: 35000, description: "Lightweight, comfortable cotton dress" },
    { name: "Men's Casual Shirt", name_mm: "ယောက်ျားလေး ကျွမ်းကျင်ဝတ်စား", price: 28000, description: "Cotton blend, modern fit" },
    { name: "Kids T-Shirt Pack", name_mm: "ကလေးများ တီရှာ့ထ်ပqua", price: 22000, description: "3-pack colorful t-shirts" },
    { name: "Denim Jacket", name_mm: "ဒင်နင်ဂျာကတ်", price: 55000, description: "Classic style, durable material" },
  ],
  food: [
    { name: "Traditional Mohinga", name_mm: "ဆန်ဖြူကြက်သားဟင်း", price: 3500, description: "Authentic Myanmar fish noodle soup" },
    { name: "Tea Leaf Salad Set", name_mm: "လက်ဖက်သုပ်", price: 4500, description: "Fresh ingredients, traditional recipe" },
    { name: "Burmese Curry Combo", name_mm: "မြန်မာ့ဟင်းခွက်", price: 8500, description: "3-curry set with rice and soup" },
    { name: "Shan Noodles Special", name_mm: "ရှမ်းခေါက်ဆွဲ", price: 4000, description: "Popular Shan style noodles" },
  ],
  beauty: [
    { name: "Korean Face Mask Set", name_mm: "ကိုရီးယားမျက်နှာဖုံး", price: 18000, description: "10-pack hydrating sheet masks" },
    { name: "Matte Lipstick Collection", name_mm: "မက်တီအရောင်ခွေးစုတ်", price: 12000, description: "Long-lasting, 6 vibrant shades" },
    { name: "Skincare Essentials Kit", name_mm: "အသားအရေထိန်းသိမ်းပစ္စည်းများ", price: 45000, description: "Cleanser, toner, moisturizer set" },
    { name: "Perfume Eau de Parfum", name_mm: "ရေမွှေးအရသာ", price: 35000, description: "Elegant floral scent, 50ml" },
  ],
  home: [
    { name: "3-Seater Sofa Modern", name_mm: "ခေါင်းလောင်းခုံ ခေတ်သစ်", price: 280000, description: "Comfortable, stain-resistant fabric" },
    { name: "Dining Table Set 6-Chair", name_mm: "စားပွဲခုံ အခုံ ၆ခု", price: 320000, description: "Solid wood, elegant design" },
    { name: "Decorative Wall Mirror", name_mm: "ဆင်မြန်းခြယ်သပ်ကွນ", price: 45000, description: "Round mirror with gold frame" },
    { name: "Table Lamp Minimalist", name_mm: "စားပွဲမီးအိမ်ခြံအနည်းဆုံး", price: 25000, description: "LED, warm light, modern design" },
  ],
};

const REVIEW_COMMENTS = [
  "Great products and fast delivery! Highly recommended.",
  "Excellent customer service. Will buy again.",
  "Quality is better than expected. Love it!",
  "Good prices compared to other shops.",
  "Fast response and professional service.",
  "Items arrived in perfect condition.",
  "Authentic products, trustworthy seller.",
  "Convenient location and friendly staff.",
];

async function deleteAllShops() {
  console.log('Deleting all existing shops...');
  
  const shopsSnapshot = await db.collection('shops').get();
  
  if (shopsSnapshot.empty) {
    console.log('No shops to delete');
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  for (const shopDoc of shopsSnapshot.docs) {
    // Delete products subcollection
    const productsSnapshot = await shopDoc.ref.collection('products').get();
    for (const productDoc of productsSnapshot.docs) {
      batch.delete(productDoc.ref);
    }
    
    // Delete reviews subcollection
    const reviewsSnapshot = await shopDoc.ref.collection('reviews').get();
    for (const reviewDoc of reviewsSnapshot.docs) {
      batch.delete(reviewDoc.ref);
    }
    
    // Delete shop document
    batch.delete(shopDoc.ref);
    count++;
  }
  
  await batch.commit();
  console.log(`Deleted ${count} shops with their products and reviews`);
}

async function createShop(shopTemplate: typeof SHOP_TEMPLATES[0], offset: { lat: number; lng: number }, index: number) {
  const shopId = `sample-shop-${index + 1}`;
  const latitude = USER_LOCATION.lat + offset.lat;
  const longitude = USER_LOCATION.lng + offset.lng;
  const ownerId = `test-owner-${index + 1}`;
  
  // Create shop document
  const shopData = {
    shop_id: shopId,
    name: shopTemplate.name,
    name_mm: shopTemplate.name_mm,
    description: shopTemplate.description,
    description_mm: shopTemplate.description_mm,
    logo_url: shopTemplate.logo_url,
    image_urls: [
      shopTemplate.logo_url,
      `https://images.unsplash.com/photo-${1500000000 + index * 100}?w=800`,
      `https://images.unsplash.com/photo-${1500000000 + index * 100 + 50}?w=800`,
    ],
    phone: shopTemplate.phone,
    email: shopTemplate.email,
    address: shopTemplate.address,
    facebook_url: shopTemplate.facebook_url,
    tiktok_handle: shopTemplate.tiktok_handle,
    rating: shopTemplate.rating,
    review_count: 5 + Math.floor(Math.random() * 5),
    delivery_available: shopTemplate.delivery_available,
    latitude,
    longitude,
    location: new (db as any).GeoPoint(latitude, longitude),
    owner_id: ownerId,
    categories: shopTemplate.categories,
    status: 'active',
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  };
  
  await db.collection('shops').doc(shopId).set(shopData);
  console.log(`Created shop: ${shopTemplate.name}`);
  
  // Create products
  const productsForCategories = shopTemplate.categories.flatMap(cat => 
    PRODUCT_TEMPLATES[cat] || []
  ).slice(0, 5);
  
  for (let i = 0; i < productsForCategories.length; i++) {
    const product = productsForCategories[i];
    const productId = `product-${shopId}-${i + 1}`;
    
    await db.collection('shops').doc(shopId).collection('products').doc(productId).set({
      product_id: productId,
      shop_id: shopId,
      name: product.name,
      name_mm: product.name_mm,
      description: product.description,
      price: product.price,
      currency: 'MMK',
      booking_fee: Math.round(product.price * 0.1),
      image_urls: [
        `https://images.unsplash.com/photo-${1500000000 + index * 1000 + i * 100}?w=600`,
      ],
      category: shopTemplate.categories[0],
      delivery_available: shopTemplate.delivery_available,
      status: 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  Created ${productsForCategories.length} products`);
  
  // Create reviews
  const numReviews = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numReviews; i++) {
    const reviewId = `review-${shopId}-${i + 1}`;
    const rating = 4 + Math.floor(Math.random() * 2); // 4 or 5 stars
    
    await db.collection('shops').doc(shopId).collection('reviews').doc(reviewId).set({
      review_id: reviewId,
      shop_id: shopId,
      reviewer_name: `Customer ${i + 1}`,
      rating,
      review_text: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
      created_at: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  Created ${numReviews} reviews`);
  
  return shopId;
}

async function seedTestData() {
  try {
    console.log('Starting test data seeding...\n');
    
    // Step 1: Delete all existing shops
    await deleteAllShops();
    
    // Step 2: Create sample shops
    console.log('\nCreating sample shops...\n');
    
    const createdShops: string[] = [];
    for (let i = 0; i < SHOP_TEMPLATES.length; i++) {
      const shopId = await createShop(SHOP_TEMPLATES[i], SHOP_OFFSETS[i], i);
      createdShops.push(shopId);
      console.log('');
    }
    
    console.log('\n========================================');
    console.log('Test data seeding completed successfully!');
    console.log('========================================');
    console.log(`Created ${createdShops.length} sample shops:`);
    createdShops.forEach((id, i) => {
      console.log(`  ${i + 1}. ${SHOP_TEMPLATES[i].name} (${id})`);
    });
    console.log(`\nLocation: ${USER_LOCATION.lat}, ${USER_LOCATION.lng}`);
    console.log('Each shop has 5 products and 5-10 reviews');
    console.log('\nYou can view these shops in the app by:');
    console.log('1. Going to /map and searching nearby');
    console.log('2. Going to /search and browsing shops');
    console.log('3. Direct link: /shop/[shopId]');
    
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedTestData();
