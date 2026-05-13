import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

if (!getApps().length) {
  const serviceAccountPath = path.join(
    process.cwd(),
    "zaymap-83385-firebase-adminsdk-fbsvc-cffab7d76f.json"
  );
  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

export const adminDb = getFirestore();