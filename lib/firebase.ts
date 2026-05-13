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

function hasValidConfig(): boolean {
  return (
    typeof firebaseConfig.apiKey === "string" &&
    firebaseConfig.apiKey.length > 0 &&
    typeof firebaseConfig.projectId === "string" &&
    firebaseConfig.projectId.length > 0
  );
}

export const isFirebaseConfigured = hasValidConfig();

let app: FirebaseApp | null = null;

// Only initialize on the browser. Do NOT run client SDK on the server.
if (typeof window !== "undefined" && hasValidConfig()) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export { app };

export const googleProvider = app ? new GoogleAuthProvider() : null;

const fbProvider = app ? new FacebookAuthProvider() : null;
if (fbProvider) {
  fbProvider.setCustomParameters({
    scope: "public_profile"
  });
}
export const facebookProvider = fbProvider;

export function isFirebaseInitialized(): boolean {
  return isFirebaseConfigured && !!auth;
}