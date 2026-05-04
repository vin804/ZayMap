"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "./firebase";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  createdAt: Date | null;
  lastLoginAt: Date | null;
}

interface UserProfileData {
  email: string;
  displayName: string;
  photoUrl?: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  lastLoginAt: ReturnType<typeof serverTimestamp>;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapFirebaseUserToUser(
  firebaseUser: FirebaseUser,
  profileData?: Partial<User>
): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: profileData?.displayName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
    photoUrl: profileData?.photoUrl || firebaseUser.photoURL || undefined,
    createdAt: profileData?.createdAt || null,
    lastLoginAt: profileData?.lastLoginAt || null,
  };
}

async function createUserProfile(firebaseUser: FirebaseUser, displayName?: string): Promise<User> {
  if (!db) {
    // Firestore not initialized - return basic user without profile
    return mapFirebaseUserToUser(firebaseUser, {
      displayName: displayName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
    });
  }

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    const defaultDisplayName = displayName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "";

    if (!userSnap.exists()) {
      const newUser: UserProfileData = {
        email: firebaseUser.email || "",
        displayName: defaultDisplayName,
        photoUrl: firebaseUser.photoURL || undefined,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(userRef, newUser);
      return mapFirebaseUserToUser(firebaseUser, {
        displayName: newUser.displayName,
        photoUrl: newUser.photoUrl,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    } else {
      await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
      const data = userSnap.data();
      return mapFirebaseUserToUser(firebaseUser, {
        displayName: data.displayName,
        photoUrl: data.photoUrl,
        createdAt: convertTimestampToDate(data.createdAt),
        lastLoginAt: new Date(),
      });
    }
  } catch (err) {
    // Firestore failed but auth succeeded - return basic user
    console.warn("Failed to create Firestore profile:", err);
    return mapFirebaseUserToUser(firebaseUser, {
      displayName: displayName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
    });
  }
}

async function getUserProfile(uid: string): Promise<Partial<User>> {
  if (!db) return {};
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        displayName: data.displayName,
        photoUrl: data.photoUrl,
        createdAt: convertTimestampToDate(data.createdAt),
        lastLoginAt: new Date(),
      };
    }
  } catch (err) {
    console.warn("Failed to get user profile:", err);
  }
  return {};
}

function convertTimestampToDate(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "object" && "toDate" in timestamp && typeof (timestamp as { toDate: () => Date }).toDate === "function") {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        try {
          const userProfile = await createUserProfile(firebaseUser);
          setUser(userProfile);
        } catch (err) {
          console.error("Error loading user profile:", err);
          setUser(mapFirebaseUserToUser(firebaseUser));
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error("Auth not initialized");
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
      await createUserProfile(result.user, displayName);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Auth not initialized");
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithFacebook = async () => {
    if (!auth || !facebookProvider) throw new Error("Auth not initialized");
    try {
      setError(null);
      await signInWithPopup(auth, facebookProvider);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Auth not initialized");
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    await firebaseUser.reload();
    const profileData = await getUserProfile(firebaseUser.uid);
    setUser(mapFirebaseUserToUser(firebaseUser, profileData));
  };

  const sendVerificationEmail = async () => {
    if (!auth?.currentUser) throw new Error("No user logged in");
    await sendEmailVerification(auth.currentUser);
  };

  const sendPasswordReset = async (email: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    sendVerificationEmail,
    sendPasswordReset,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try signing in instead.";
      case "auth/weak-password":
        return "Password must be at least 8 characters with uppercase, lowercase, and numbers.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/network-request-failed":
        return "Connection failed. Please check your internet and try again.";
      case "auth/popup-closed-by-user":
        return "Sign in was cancelled. Please try again.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      default:
        return "An error occurred. Please try again.";
    }
  }
  return "An error occurred. Please try again.";
}
