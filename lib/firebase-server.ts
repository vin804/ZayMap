import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

if (!getApps().length) {
  const jsonPath = path.join(
    process.cwd(),
    "zaymap-83385-firebase-adminsdk-fbsvc-cffab7d76f.json"
  );

  let credential;
  if (fs.existsSync(jsonPath)) {
    // Local dev: use the JSON file
    credential = cert(jsonPath);
  } else {
    // Vercel / production: use env vars
    credential = cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    });
  }

  initializeApp({ credential });
}

export const adminDb = getFirestore();