import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasValidConfig(): boolean {
  return (
    typeof firebaseConfig.apiKey === "string" &&
    firebaseConfig.apiKey.length > 0 &&
    typeof firebaseConfig.authDomain === "string" &&
    firebaseConfig.authDomain.length > 0 &&
    typeof firebaseConfig.projectId === "string" &&
    firebaseConfig.projectId.length > 0
  );
}

// Server-side Firebase initialization (no window check)
let app: FirebaseApp | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

if (hasValidConfig()) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
} else {
  console.error(
    "Server Firebase not initialized: Missing environment variables. " +
    "Please check your .env.local file and add Firebase credentials."
  );
}

export { app, db };
