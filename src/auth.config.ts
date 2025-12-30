// src/auth.config.ts
import type { AuthOptions, DefaultSession, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@next-auth/firebase-adapter';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { getFirestore as getClientFirestore } from 'firebase/firestore';
import { AdminFirestoreAdapter } from '@/lib/firebase-admin-adapter';

// Extend session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

// Extend JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    sub?: string;
  }
}

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// Get Firebase Admin Firestore instance
const getFirestoreInstance = async (): Promise<Firestore> => {
  try {
    const db = await getFirebaseAdmin();
    if (!db) {
      throw new Error('Failed to get Firebase Admin instance');
    }
    return db;
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    throw new Error('Failed to initialize Firestore: ' + (error as Error).message);
  }
};

// Get the auth options
export const getAuthOptions = async (): Promise<AuthOptions> => {
  try {
    const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
    const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
    const nextAuthSecret = getEnvVar('NEXTAUTH_SECRET');
    
    // Get Firestore instance
    const db = await getFirestoreInstance();

    // Ensure the Firebase Client SDK is initialized (some adapters expect a client app)
    let clientDb: any = null;
    const clientConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Debug logs: print which client config keys are present (avoid logging secrets)
    console.log('getAuthOptions: clientConfig presence:', {
      projectId: !!clientConfig.projectId,
      apiKey: !!clientConfig.apiKey,
      authDomain: !!clientConfig.authDomain,
    });

    try {
      const hasRequired = clientConfig.projectId && clientConfig.apiKey;
      if (hasRequired) {
        const clientApp = getClientApps().length === 0 ? initializeClientApp(clientConfig as any) : undefined;
        const appToUse = clientApp || (getClientApps()[0] as any);
        if (appToUse) {
          clientDb = getClientFirestore(appToUse as any);
        }
      }
    } catch (initErr) {
      console.warn('Could not initialize Firebase client SDK in getAuthOptions:', initErr);
    }

    console.log('getAuthOptions: clientDb set?', !!clientDb);

    // Build adapter and log detailed errors if initialization fails
    // Prefer using admin adapter (server-side) to avoid client permission errors
    let adapterInstance: any = null;
    try {
      const adminDb = await getFirestoreInstance();
      adapterInstance = AdminFirestoreAdapter(adminDb as any);
    } catch (adapterErr) {
      console.error('AdminFirestoreAdapter initialization error:', adapterErr);
      console.error((adapterErr as any)?.stack);
      // Fallback: try client adapter if admin adapter fails
      try {
        const hasClientConfig = !!clientConfig.projectId && !!clientConfig.apiKey;
        if (!hasClientConfig) throw new Error('Missing client Firebase config for FirestoreAdapter fallback');
        adapterInstance = FirestoreAdapter(clientConfig as any);
      } catch (fallbackErr) {
        console.error('FirestoreAdapter fallback initialization error:', fallbackErr);
        throw fallbackErr;
      }
    }

    return {
      providers: [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          allowDangerousEmailAccountLinking: true,
        }),
      ],
      // Prefer passing the client Firestore instance to the adapter when available.
      adapter: adapterInstance,
      callbacks: {
        async session({ session, token }) {
          if (session?.user) {
            session.user.id = token.sub || token.id || '';
          }
          return session;
        },
        async jwt({ token, user }) {
          if (user?.id) {
            token.id = user.id;
          }
          return token;
        }
      },
      session: {
        strategy: 'jwt',
      },
      pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
      },
      secret: nextAuthSecret,
      debug: process.env.NODE_ENV === 'development',
      trustHost: true,
    };
  } catch (error) {
    console.error('Error in getAuthOptions:', error);
    throw error;
  }
};