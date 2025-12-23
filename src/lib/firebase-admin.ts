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
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Validate required environment variables
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing required Firebase Admin environment variables');
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

// Initialize and export the default instances
const { adminApp: app, adminDb: db, adminAuth: auth } = initFirebaseAdmin();

export { app, db, auth };
export default initFirebaseAdmin;