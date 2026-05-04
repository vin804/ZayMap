import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getFirestore();
}

// 30 Gemstone/Jewelry Products
const GEMSTONE_PRODUCTS = [
  { name: "Myanmar Imperial Jade Bangle", price: 2500000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400" },
  { name: "Burmese Ruby Ring (3 carat)", price: 1800000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400" },
  { name: "Jadeite Pendant (Imperial Green)", price: 3200000, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220b?w=400" },
  { name: "Blue Sapphire Necklace", price: 1500000, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400" },
  { name: "Raw Jade Stone (A Grade)", price: 450000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400" },
  { name: "Jade Buddha Pendant", price: 890000, image: "https://images.unsplash.com/photo-1602751584552-8ba0b3b59096?w=400" },
  { name: "Ruby Stud Earrings", price: 650000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400" },
  { name: "Jade Bracelet (White)", price: 1200000, image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400" },
  { name: "Emerald Ring (Colombian)", price: 2100000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400" },
  { name: "Jade Dragon Pendant", price: 1500000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400" },
  { name: "Sapphire Bracelet (Ceylon)", price: 2800000, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400" },
  { name: "Jade Earrings (Green)", price: 750000, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220b?w=400" },
  { name: "Raw Ruby Crystal", price: 320000, image: "https://images.unsplash.com/photo-1602751584552-8ba0b3b59096?w=400" },
  { name: "Jade Pi Disc Necklace", price: 980000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400" },
  { name: "Spinel Gemstone (Red)", price: 890000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400" },
  { name: "Jade Guanyin Statue", price: 3500000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400" },
  { name: "Peridot Ring (Gold Band)", price: 560000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400" },
  { name: "Jade Hairpin (Traditional)", price: 420000, image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400" },
  { name: "Aquamarine Pendant", price: 780000, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220b?w=400" },
  { name: "Jade Leaf Brooch", price: 650000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400" },
  { name: "Garnet Gemstone (Raw)", price: 180000, image: "https://images.unsplash.com/photo-1602751584552-8ba0b3b59096?w=400" },
  { name: "Jade Ruyi Scepter", price: 4200000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400" },
  { name: "Topaz Ring (Blue)", price: 520000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400" },
  { name: "Jade Bead Necklace", price: 1100000, image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400" },
  { name: "Tourmaline (Watermelon)", price: 950000, image: "https://images.unsplash.com/photo-1602751584552-8ba0b3b59096?w=400" },
  { name: "Jade Cufflinks (Pair)", price: 380000, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220b?w=400" },
  { name: "Amethyst Cluster", price: 280000, image: "https://images.unsplash.com/photo-1602751584552-8ba0b3b59096?w=400" },
  { name: "Jade Fish Pendant", price: 720000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400" },
  { name: "Moonstone Ring", price: 480000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400" },
  { name: "Jade Carving (Double Dragon)", price: 2800000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400" },
];

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const created: string[] = [];

    for (let i = 0; i < GEMSTONE_PRODUCTS.length; i++) {
      const product = GEMSTONE_PRODUCTS[i];
      const productId = `gemstone-${shopId}-${i}`;
      const bookingFee = Math.round(product.price * 0.1);

      await setDoc(doc(db, "products", productId), {
        product_id: productId,
        shop_id: shopId,
        product_name: product.name,
        product_name_mm: product.name,
        description: `Authentic ${product.name} from our exclusive collection. High quality gemstones sourced from Myanmar. Best price guaranteed in Hpa Khant!`,
        price: product.price,
        currency: "MMK",
        booking_fee: bookingFee,
        image_urls: [product.image],
        category: "jewelry",
        delivery_available: true,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      created.push(product.name);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} gemstone products`,
      products: created,
    });
  } catch (error) {
    console.error("Seed gemstone products error:", error);
    return NextResponse.json(
      { error: "Failed to create products", details: String(error) },
      { status: 500 }
    );
  }
}
