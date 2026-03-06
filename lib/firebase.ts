import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Firebase configuration
// IMPORTANT: Create a .env.local file with all Firebase credentials
// See .env.local.example for required variables
const requiredEnv = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

// Firebase environment variables are optional since we have fallback values
// if (process.env.NODE_ENV === 'production') {
//   const missing = requiredEnv.filter((k) => !process.env[k]);
//   if (missing.length) {
//     console.warn(`⚠️ Missing Firebase environment variables: ${missing.join(', ')}`);
//   }
// }

// Use env when provided; fall back to known public web config to ensure client init after static export
// IMPORTANT: These values are hardcoded to match Firebase project rentmatic-b24ff (project number: 813761726055)
const firebaseConfig = {
  apiKey: "AIzaSyBUZhRqTEAvJe8jhgtXFE2kLaJq07zOLTQ", // Firebase Web API Key for rentmatic-b24ff
  authDomain: "rentmatic-b24ff.firebaseapp.com",
  projectId: "rentmatic-b24ff",
  storageBucket: "rentmatic-b24ff.firebasestorage.app",
  messagingSenderId: "813761726055", // This is the project number
  appId: "1:813761726055:web:1b3c38f34359409940b6c2",
  measurementId: "G-Y3LNX9S0S0",
};

// Warn if using fallback values (development only)
// Silence warnings in production; local dev will still log if desired

// Client-only initialization (no-ops on server/SSG)
const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;

if (isBrowser) {
  // Always initialize using provided env or safe fallback config
  // (Hosting doesn’t inject NEXT_PUBLIC_* vars; we still want client init to work)
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  storage = getStorage(app);
}

export { app, storage };
export default app;

export function getClientAuth(): Auth | null {
  if (!isBrowser || !app) return null;
  return getAuth(app);
}

export function getClientDb(): Firestore | null {
  if (!isBrowser || !app) return null;
  return getFirestore(app);
}

export function getClientStorage(): FirebaseStorage | null {
  if (!isBrowser || !storage) return null;
  return storage;
}

export async function getClientAnalytics(): Promise<Analytics | null> {
  if (!isBrowser || !app) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getAnalytics(app);
  } catch {
    return null;
  }
}
