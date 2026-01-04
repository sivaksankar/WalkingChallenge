// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Initialize Firebase Admin
export let adminApp: App | undefined;
export let adminDb: Firestore | undefined;
export let adminAuth: Auth | undefined;

// This function initializes the admin SDK
export const initFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (adminApp && adminDb && adminAuth) {
      return { adminApp, adminDb, adminAuth };
    }

    // Get environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    
    // Handle private key from multiple sources
    let privateKey: string | undefined;
    
    // 1. Try raw private key with escaped newlines
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      // Handle both literal \n and actual newlines
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      } else if (privateKey.includes('\\\\n')) {
        privateKey = privateKey.replace(/\\\\n/g, '\n');
      }
    }
    
    // 2. Try base64-encoded key
    if (!privateKey && process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64) {
      try {
        privateKey = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64, 'base64').toString('utf8');
      } catch (e) {
        console.error('Failed to decode base64 private key:', e);
      }
    }
    
    // 3. Also try ADMIN_PRIVATE_KEY for backward compatibility
    if (!privateKey && process.env.ADMIN_PRIVATE_KEY) {
      privateKey = process.env.ADMIN_PRIVATE_KEY;
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      } else if (privateKey.includes('\\\\n')) {
        privateKey = privateKey.replace(/\\\\n/g, '\n');
      }
    }

    // Validate required environment variables
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(`Missing required Firebase Admin environment variables. Got projectId=${projectId}, clientEmail=${clientEmail}, privateKey=${privateKey ? 'set' : 'not set'}`);
    }

    // Initialize Firebase Admin if not already done
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      }, 'admin');
    } else {
      adminApp = getApp('admin') || getApp();
    }

    // Initialize Firestore and Auth
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);

    console.log('Firebase Admin initialized successfully');
    return { adminApp, adminDb, adminAuth };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
};

// Export a function to get the admin instances
export const getAdmin = async () => {
  return initFirebaseAdmin();
};

// Export a function to get the Firestore instance
export const getFirebaseAdmin = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin cannot be used in the browser');
  }
  await initFirebaseAdmin();
  if (!adminDb) throw new Error('Firestore not initialized');
  return adminDb;
};

// Note: we intentionally do NOT call initFirebaseAdmin at module
// import time because Next.js may import server modules during
// static generation (build) when environment variables may not
// be available. Instead initialize lazily via `getAdmin` or
// `getFirebaseAdmin` inside request handlers at runtime.
export default initFirebaseAdmin;