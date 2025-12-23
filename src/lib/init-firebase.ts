// src/lib/init-firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase client SDK
let clientApp: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  clientApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(clientApp);
  auth = getAuth(clientApp);
  
  if (typeof window !== 'undefined') {
    console.log('Firebase client initialized successfully');
  }
} catch (error) {
  console.error('Firebase client initialization error:', error);
  throw error;
}

export { clientApp, db, auth };
export type { Firestore };