import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
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

    // Update shop with better logo and description
    const shopRef = doc(db, "shops", shopId);
    await updateDoc(shopRef, {
      logo_url: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=400&fit=crop",
      image_urls: [
        "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400",
      ],
      description: "Welcome to Gemstone Shop - Your trusted source for authentic Myanmar jade, rubies, sapphires, and precious gemstones. We offer certified gemstones, custom jewelry design, and expert consultation. All our stones are ethically sourced from Myanmar's finest mines.",
      description_mm: "ကျောက်စိမ်းဆိုင်မှ ကြိုဆိုပါသည်။ မြန်မာနိုင်ငံရဲ့ အကောင်းဆုံး ကျောက်စိမ်း၊ ပတ္တမြား၊ နီလာ၊ နှင့် ကျောက်များကို ရောင်းချပေးနေပါသည်။",
    });

    return NextResponse.json({
      success: true,
      message: "Shop updated with gemstone logo and description",
    });
  } catch (error) {
    console.error("Update shop error:", error);
    return NextResponse.json(
      { error: "Failed to update shop", details: String(error) },
      { status: 500 }
    );
  }
}
