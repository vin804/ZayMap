import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config is present
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

export const isFirebaseConfigured = hasValidConfig();

let app: FirebaseApp | null = null;

// Only initialize Firebase if config is valid
if (hasValidConfig()) {
  if (typeof window !== "undefined") {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  console.warn(
    "Firebase not initialized: Missing environment variables. " +
    "Please check your .env.local file and add Firebase credentials."
  );
}

export const auth = app && typeof window !== "undefined" ? getAuth(app) : null;
export const db = app && typeof window !== "undefined" ? getFirestore(app) : null;
export const storage = app && typeof window !== "undefined" ? getStorage(app) : null;
export { app };

export const googleProvider = app && typeof window !== "undefined" ? new GoogleAuthProvider() : null;

// Configure Facebook provider - only request public_profile, not email
// Email requires additional Facebook permissions that aren't needed for basic sign-in
const fbProvider = app && typeof window !== "undefined" ? new FacebookAuthProvider() : null;
if (fbProvider) {
  // Clear any default scopes first, then add only public_profile
  fbProvider.setCustomParameters({
    scope: "public_profile"
  });
}
export const facebookProvider = fbProvider;

export function isFirebaseInitialized(): boolean {
  return isFirebaseConfigured && !!auth;
}
