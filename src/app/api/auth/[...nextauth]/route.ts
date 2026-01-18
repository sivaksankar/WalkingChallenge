// src/app/api/auth/[...nextauth]/route.ts
import { getAuthOptions } from '@/auth.config';
import NextAuth from 'next-auth/next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = async (req: Request, context: any) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const cookieHeader = req.headers.get('cookie');
  console.log('[Route Handler] Cookie header:', cookieHeader);
  if (path.startsWith('/api/auth/callback')) {
    const hasState = cookieHeader?.includes('__Secure-next-auth.state') ? 'yes' : 'no';
    console.log('[Route Handler] Callback cookie state present?', hasState);
  }
  
  console.log('[Route Handler] ===== AUTH REQUEST =====');
  console.log('[Route Handler] Method:', req.method, 'Path:', path);
  console.log('[Route Handler] Host:', req.headers.get('host'));
  console.log('[Route Handler] Origin:', req.headers.get('origin'));
  console.log('[Route Handler] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

  // Extra diagnostics for signin POSTs to see if client expects JSON (which returns 200)
  if (req.method === 'POST' && path.startsWith('/api/auth/signin')) {
    console.log('[Route Handler] Signin POST headers:', {
      accept: req.headers.get('accept'),
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
    });
  }
  
  try {
    const authOptions = await getAuthOptions();
    const nextAuthHandler = NextAuth(authOptions);
    const response = await nextAuthHandler(req, context);

    console.log('[Route Handler] Response status:', response?.status);

    // Log any Set-Cookie headers returned by NextAuth so we can verify cookies
    try {
      const setCookie = response?.headers?.get?.('set-cookie');
      if (setCookie) {
        console.log('[Route Handler] Response Set-Cookie header:', setCookie);
      }
      // Also print all headers for debugging when in debug mode
      if (process.env.NEXTAUTH_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
        for (const [key, value] of response.headers) {
          console.log(`[Route Handler] Response header: ${key}=${value}`);
        }
      }
    } catch (e) {
      console.warn('[Route Handler] Could not read response headers for debugging', e);
    }

    // If this was a callback request, log an additional host mismatch warning
    if (path.startsWith('/api/auth/callback')) {
      try {
        const callbackHost = url.host;
        const nextAuthUrl = process.env.NEXTAUTH_URL || '';
        const nextAuthHost = nextAuthUrl ? new URL(nextAuthUrl).host : null;
        if (nextAuthHost && callbackHost !== nextAuthHost) {
          console.warn('[Route Handler] CALLBACK HOST MISMATCH:', { callbackHost, nextAuthHost });
        }
      } catch (e) {
        console.warn('[Route Handler] Error checking callback host mismatch', e);
      }
    }

    // ✅ REMOVED: Forced redirect to /auth/landing
    // Let NextAuth handle redirects naturally based on callbacks
    
    return response;
  } catch (error) {
    console.error('[Route Handler] Error:', error);
    console.error('[Route Handler] Stack:', (error as Error)?.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export { 
  handler as GET, 
  handler as POST
};