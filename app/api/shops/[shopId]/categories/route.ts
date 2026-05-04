import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// Initialize Firebase within the route handler for server-side reliability
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

// POST - Create new category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { name, name_mm, icon, userId } = await request.json();

    // Validate input
    if (!name?.trim() && !name_mm?.trim()) {
      return NextResponse.json(
        { error: "At least one name (EN or MM) is required" },
        { status: 400 }
      );
    }

    console.log("Creating category:", { shopId, name, name_mm, icon, userId });

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data();

    // Verify ownership
    const ownerId = shopData.owner_id || shopData.owner_uid || shopData.user_id;
    console.log("Auth check:", { userId, ownerId, shopFields: {
      owner_id: shopData.owner_id,
      owner_uid: shopData.owner_uid,
      user_id: shopData.user_id
    }});
    if (userId !== ownerId) {
      return NextResponse.json({ error: "Unauthorized", debug: { userId, ownerId } }, { status: 403 });
    }

    // Check for duplicate names (case-insensitive)
    const existingCategories = shopData.categories || [];
    const normalizedName = name?.toLowerCase().trim();
    const normalizedNameMM = name_mm?.toLowerCase().trim();

    const duplicate = existingCategories.find((cat: any) => {
      const catNameEN = cat.name?.toLowerCase().trim();
      const catNameMM = cat.name_mm?.toLowerCase().trim();
      return (normalizedName && catNameEN === normalizedName) ||
             (normalizedNameMM && catNameMM === normalizedNameMM);
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Create new category (only include fields with values)
    const newCategory: Record<string, unknown> = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      icon: icon?.trim() || "📦",
      order_index: existingCategories.length,
      created_at: Timestamp.now(),
    };
    
    if (name?.trim()) newCategory.name = name.trim();
    if (name_mm?.trim()) newCategory.name_mm = name_mm.trim();

    await updateDoc(shopRef, {
      categories: arrayUnion(newCategory),
    });

    return NextResponse.json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category", details: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { categoryId, name, name_mm, icon, userId } = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data();

    // Verify ownership
    const ownerId = shopData.owner_id || shopData.owner_uid || shopData.user_id;
    if (userId !== ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const categories = shopData.categories || [];
    const categoryIndex = categories.findIndex((cat: any) => cat.id === categoryId);

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check for duplicate names (excluding current category)
    const normalizedName = name?.toLowerCase().trim();
    const normalizedNameMM = name_mm?.toLowerCase().trim();

    const duplicate = categories.find((cat: any, idx: number) => {
      if (idx === categoryIndex) return false;
      const catNameEN = cat.name?.toLowerCase().trim();
      const catNameMM = cat.name_mm?.toLowerCase().trim();
      return (normalizedName && catNameEN === normalizedName) ||
             (normalizedNameMM && catNameMM === normalizedNameMM);
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Update category
    const updatedCategory = {
      ...categories[categoryIndex],
      name: name?.trim() || categories[categoryIndex].name,
      name_mm: name_mm?.trim() || categories[categoryIndex].name_mm,
      icon: icon?.trim() || categories[categoryIndex].icon,
    };

    categories[categoryIndex] = updatedCategory;

    await updateDoc(shopRef, { categories });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const userId = searchParams.get("userId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shopData = shopSnap.data();

    // Verify ownership
    const ownerId = shopData.owner_id || shopData.owner_uid || shopData.user_id;
    if (userId !== ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const categories = shopData.categories || [];
    const filteredCategories = categories.filter((cat: any) => cat.id !== categoryId);

    // Reorder remaining categories
    const reorderedCategories = filteredCategories.map((cat: any, idx: number) => ({
      ...cat,
      order_index: idx,
    }));

    await updateDoc(shopRef, { categories: reorderedCategories });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
