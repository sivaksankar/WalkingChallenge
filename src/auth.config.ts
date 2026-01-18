// src/auth.config.ts
import type { AuthOptions, DefaultSession, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { AdminFirestoreAdapter } from '@/lib/firebase-admin-adapter';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

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
  console.log('[getAuthOptions] ===== GET AUTH OPTIONS START =====');
  console.log('[getAuthOptions] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('[getAuthOptions] NODE_ENV:', process.env.NODE_ENV);
  
  try {
    const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
    const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
    const nextAuthSecret = getEnvVar('NEXTAUTH_SECRET');
    
    // Get Firestore instance and adapter
    const db = await getFirestoreInstance();
    const adapterInstance = AdminFirestoreAdapter(db as any);

    // Determine if we're running in a secure context
    const isProduction = process.env.NODE_ENV === 'production';
    const nextAuthUrl = process.env.NEXTAUTH_URL || '';
    const isSecure = isProduction || nextAuthUrl.startsWith('https');

    console.log('[getAuthOptions] Configuration:', {
      isProduction,
      isSecure,
      nextAuthUrl,
    });

    return {
      providers: [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
              // Add scope for profile and email
              scope: 'openid email profile',
            },
          },
        }),
      ],
      adapter: adapterInstance, // ✅ FIXED: Re-enabled adapter
      callbacks: {
        async signIn({ user, account, profile }) {
          console.log('[Callback][signIn] User:', user?.id, 'Email:', user?.email, 'Provider:', account?.provider);
          return true;
        },
        async redirect({ url, baseUrl }) {
          console.log('[Callback][redirect] URL:', url, 'BaseURL:', baseUrl);
          
          // Handle custom scheme redirects for mobile apps
          if (url.includes('://') && !url.startsWith('http')) {
            console.log('[Callback][redirect] Mobile app custom scheme detected:', url);
            return url;
          }
          
          // Handle relative URLs
          if (url.startsWith('/')) {
            return `${baseUrl}${url}`;
          }
          
          // Handle same-origin URLs
          if (url.startsWith(baseUrl)) {
            return url;
          }
          
          // Default: redirect to dashboard
          console.log('[Callback][redirect] Defaulting to dashboard');
          return `${baseUrl}/dashboard`;
        },
        async session({ session, token, user }) {
          console.log('[Callback][session] Token sub:', token?.sub, 'User ID:', user?.id);
          
          // For database strategy, user object is available
          if (user) {
            session.user.id = user.id;
          }
          // For JWT strategy, use token
          else if (token?.sub) {
            session.user.id = token.sub;
          }
          
          console.log('[Callback][session] Final session user ID:', session.user.id);
          return session;
        },
        async jwt({ token, user, account }) {
          console.log('[Callback][jwt] User:', user?.id, 'Token sub:', token.sub);
          
          // Add user id to token on sign in
          if (user) {
            token.id = user.id;
            token.sub = user.id;
          }
          
          console.log('[Callback][jwt] Final token:', { sub: token.sub, id: token.id });
          return token;
        },
      },
      session: {
        strategy: 'database', // ✅ FIXED: Use database strategy with adapter
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
      },
      pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
      },
      secret: nextAuthSecret,
      logger: {
        error: (code, metadata) => {
          console.error('[NextAuth][Error]', code, metadata);
        },
        warn: (code) => {
          console.warn('[NextAuth][Warn]', code);
        },
        debug: (code, metadata) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[NextAuth][Debug]', code, metadata);
          }
        },
      },
      events: {
        async signIn({ user, account, profile, isNewUser }) {
          console.log('[NextAuth][Event][signIn]', {
            userId: user?.id,
            email: user?.email,
            provider: account?.provider,
            isNewUser,
          });
        },
        async signOut({ session, token }) {
          console.log('[NextAuth][Event][signOut]', {
            userId: token?.sub || session?.user?.id,
          });
        },
      },
      // Allow enabling verbose NextAuth debugging via env var for production troubleshooting
      debug: process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true',
      trustHost: true,
      useSecureCookies: isSecure,
      cookies: {
        sessionToken: {
          name: isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax', // ✅ Changed from 'none' to 'lax' for better compatibility
            path: '/',
            secure: isSecure,
          },
        },
        callbackUrl: {
          name: isSecure ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: isSecure,
          },
        },
        csrfToken: {
          name: isSecure ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: isSecure,
          },
        },
      },
    };
  } catch (error) {
    console.error('[getAuthOptions] Error:', error);
    throw error;
  }
};