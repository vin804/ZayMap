import { NextResponse } from "next/server";
import { isFirebaseInitialized } from "@/lib/firebase";
import { isLeafletAvailable } from "@/lib/leaflet-config";

export async function GET() {
  const firebaseStatus = isFirebaseInitialized();
  const leafletStatus = isLeafletAvailable();

  return NextResponse.json({
    firebase: firebaseStatus,
    leaflet: leafletStatus,
    timestamp: new Date().toISOString(),
  });
}
