import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Validate that all required Firebase env vars are present
if (typeof window !== "undefined") {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing Firebase environment variables: ${missing.join(', ')}`);
    console.error('Make sure these are set in your deployment platform (Coolify, Vercel, etc.) or .env.local file');
  }

  // Warn if authDomain looks incorrect (this causes the /method redirect bug!)
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.includes('localhost')) {
    console.warn('⚠️  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN should not be localhost in production!');
    console.warn('This will cause redirects to localhost:3000/method during OAuth flows');
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern: Ensure we only start Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };