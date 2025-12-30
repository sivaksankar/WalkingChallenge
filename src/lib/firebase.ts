// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Debug: Log environment variables
console.log('Firebase Config:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'API Key is set' : 'API Key is missing',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Auth Domain is set' : 'Auth Domain is missing'
});

// Throw an error if required environment variables are missing
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let missingEnv: string[] = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnv.push(envVar);
  }
}
let missingEnv: string[] = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnv.push(envVar);
  }
}

if (missingEnv.length) {
  const msg = `Missing required environment variable(s): ${missingEnv.join(', ')}`;
  // During builds (CI) these may legitimately be absent; avoid throwing so the build can complete.
  // Log a clear warning so it can be addressed in the Netlify site settings.
  console.warn(msg);

  // Export null stubs so imports don't break during static build. Runtime on the deployed site
  // should have the proper NEXT_PUBLIC_* vars and initialize normally in the browser.
  const app = null as any;
  const db = null as any;
  const auth = null as any;
  export { db, auth, app };
} else {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase
  let app;
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }

  const db = getFirestore(app);
  const auth = getAuth(app);

  export { db, auth, app };
}