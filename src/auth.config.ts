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

    // Log provider configuration (non-sensitive data only)
    console.log('getAuthOptions: Using Google client id:', googleClientId);
    console.log('getAuthOptions: NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

    return {
      providers: [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          allowDangerousEmailAccountLinking: true,
          checks: ['none'],
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            },
          },
        }),
      ],
      // Prefer passing the client Firestore instance to the adapter when available.
      adapter: adapterInstance,
      callbacks: {
        async jwt({ token, user, account, profile }) {
          console.log('[JWT] callback triggered - user:', user?.id, 'token.sub:', token?.sub, 'account:', account?.provider);
          // On sign in, add user id to token
          if (user) {
            token.id = user.id;
            console.log('[JWT] Added user.id to token:', token.id);
          }
          console.log('[JWT] returning token:', { id: token.id, sub: token.sub, email: token.email });
          return token;
        },
        async signIn({ user, account, profile }) {
          console.log('[Callback][signIn] user:', user?.id, 'provider:', account?.provider, 'accountId:', account?.providerAccountId);
          return true;
        },
        async redirect({ url, baseUrl }) {
          console.log('[Redirect] url:', url, 'baseUrl:', baseUrl);
          return url.startsWith(baseUrl) ? url : baseUrl + '/dashboard';
        },
        async session({ session, token }) {
          console.log('[Session] callback - token.id:', token?.id, 'token.sub:', token?.sub, 'session.user:', session?.user?.email);
          // Add user id from token to session
          if (session?.user && token?.id) {
            session.user.id = token.id as string;
          }
          console.log('[Session] returning user:', session?.user?.id, session?.user?.email);
          return session;
        },
      },
      session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
      pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
      },
      secret: nextAuthSecret,
      // Custom logger and events to capture additional debug info for OAuth
      // flows and token exchange errors.
      logger: {
        log: (...args: any[]) => console.log('[next-auth]', ...args),
        error: (...args: any[]) => console.error('[next-auth][error]', ...args),
        warn: (...args: any[]) => console.warn('[next-auth][warn]', ...args),
      },
      events: {
        async signIn({ user, account, profile, isNewUser }) {
          console.log('[NextAuth event][signIn]', { user: user?.id, provider: account?.provider, isNewUser });
        },
        async signOut({ token }) {
          console.log('[NextAuth event][signOut]', { token: token?.sub });
        },
        async error({ error }) {
          console.error('[NextAuth event][error]', error);
        },
      },
      debug: process.env.NODE_ENV === 'development',
      // Trust proxy headers when behind Firebase Hosting/Cloud Run
      trustHost: true,
      // Use secure cookies in production and ensure cookies work across the OAuth
      // redirect flow by using SameSite=None + Secure when running on HTTPS.
      useSecureCookies: !!(process.env.NODE_ENV === 'production' || (process.env.NEXTAUTH_URL || '').startsWith('https')),
      cookies: {
        sessionToken: {
          name: 'next-auth.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: !!(process.env.NODE_ENV === 'production' || (process.env.NEXTAUTH_URL || '').startsWith('https')),
          },
        },
      },
    };
  } catch (error) {
    console.error('Error in getAuthOptions:', error);
    throw error;
  }
};