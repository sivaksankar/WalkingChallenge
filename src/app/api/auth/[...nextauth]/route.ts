// src/app/api/auth/[...nextauth]/route.ts
import { getAuthOptions } from '@/auth.config';
import NextAuth from 'next-auth/next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = async (req: Request, context: any) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const cookieHeader = req.headers.get('cookie');
  // Redact cookie values for logs, but show presence and short prefix for session token
  function redactCookies(header: string | null) {
    if (!header) return 'NONE';
    try {
      return header
        .split(';')
        .map((pair) => {
          const [rawName, ...rest] = pair.split('=');
          const name = rawName?.trim();
          const value = rest.join('=')?.trim() || '';
          if (!name) return pair.trim();
          if (name === 'next-auth.session-token') {
            return `${name}=${value ? value.slice(0, 8) + '...' : ''}`;
          }
          return `${name}=[REDACTED]`;
        })
        .join('; ');
    } catch (e) {
      return '(failed to redact)';
    }
  }

  console.log('[Route Handler] ===== AUTH REQUEST START =====');
  console.log('[Route Handler] Request:', req.method, path);
  console.log('[Route Handler] Query:', url.searchParams.toString() || '(none)');
  console.log('[Route Handler] Headers:', {
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    'user-agent': req.headers.get('user-agent'),
  });
  console.log('[Route Handler] Cookies received:', redactCookies(cookieHeader));
  console.log('[Route Handler] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('[Route Handler] Host header:', req.headers.get('host'));
  console.log('[Route Handler] ===== AUTH REQUEST END =====');
  console.log('[Route Handler] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('[Route Handler] Host header:', req.headers.get('host'));
  
  try {
    const authOptions = await getAuthOptions();
    const nextAuthHandler = NextAuth(authOptions);
    const response = await nextAuthHandler(req, context);

    // Log all Set-Cookie headers
    if (response?.headers?.getSetCookie) {
      const cookies = response.headers.getSetCookie();
      if (cookies?.length > 0) {
        console.log('[Route Handler]', path, '- Setting cookies:', cookies.length);
        cookies.forEach((cookie) => {
          const name = cookie.split('=')[0];
          const hasToken = cookie.includes('eyJ');
          const lower = cookie.toLowerCase();
          const attrs = {
            sameSiteNone: lower.includes('samesite=none'),
            secure: lower.includes('secure'),
            domain: /domain=([^;]+)/i.test(cookie) ? RegExp.$1 : null,
            length: cookie.length,
          };
          console.log('[Route Handler] Cookie:', name, hasToken ? '(has JWT token)' : '(no token)', attrs);
        });
      }
    }

    console.log('[Route Handler]', path, '- Response status:', response?.status);
    // Log original redirect location (if any) for debugging redirect/cookie flow
    try {
      const origLocation = response?.headers?.get && response.headers.get('location');
      if (origLocation) console.log('[Route Handler] Original redirect location:', origLocation);
    } catch (e) {
      console.warn('[Route Handler] failed to read response location header', e);
    }

    // If this was an OAuth callback (e.g. /api/auth/callback/google) then
    // NextAuth typically returns a 302 to the callbackUrl. With database strategy,
    // we can redirect directly to /auth/landing since sessions are stored in the database.
    // However, if a custom redirect_uri was provided (e.g., for mobile apps), respect that instead.
    if (path.startsWith('/api/auth/callback') && response?.status && String(response.status).startsWith('3')) {
      try {
        const originalLocation = response?.headers?.get && response.headers.get('location');
        console.log('[Route Handler] Callback detected; original location:', originalLocation);
        
        // Check if the original redirect location is a custom scheme (like walkingchallenge://)
        // This indicates a mobile app callback
        const isCustomSchemeRedirect = originalLocation && (
          originalLocation.startsWith('walkingchallenge://') || 
          (originalLocation.includes('://') && !originalLocation.startsWith('http'))
        );
        
        console.log('[Route Handler] Callback analysis:', {
          originalLocation,
          isCustomSchemeRedirect,
          redirectUriParam,
          authCode: url.searchParams.get('code')
        });
        
        if (isCustomSchemeRedirect) {
          console.log('[Route Handler] Mobile app callback detected; redirecting with authorization code');
          
          // For mobile apps, extract the authorization code from the callback and include it in the redirect
          const authCode = url.searchParams.get('code');
          let redirectUrl = originalLocation;
          
          if (authCode && redirectUrl) {
            // Handle custom schemes that can't be parsed by URL constructor
            if (redirectUrl.includes('://') && !redirectUrl.startsWith('http')) {
              // For custom schemes like walkingchallenge://, append query param manually
              const separator = redirectUrl.includes('?') ? '&' : '?';
              redirectUrl = `${redirectUrl}${separator}code=${encodeURIComponent(authCode)}`;
            } else {
              // For regular URLs, use URL constructor
              try {
                const urlObj = new URL(redirectUrl);
                urlObj.searchParams.set('code', authCode);
                redirectUrl = urlObj.toString();
              } catch (e) {
                console.warn('[Route Handler] Failed to parse redirect URL:', redirectUrl, e);
              }
            }
            console.log('[Route Handler] Added code to mobile redirect:', redirectUrl);
          }
          
          return new Response('', { 
            status: 302, 
            headers: [['location', redirectUrl]] 
          });
        } else {
          console.log('[Route Handler] Web callback detected; redirecting directly to /auth/landing');
          
          // Use NEXTAUTH_URL to determine the correct host for the redirect
          const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const landingUrl = `${nextAuthUrl}/auth/landing`;
          console.log('[Route Handler] Using landing URL:', landingUrl);

          return new Response('', { 
            status: 302, 
            headers: [['location', landingUrl]] 
          });
        }
      } catch (err) {
        console.warn('[Route Handler] failed to override callback redirect', err);
      }
    }

    // Additional short-lived debug: for session endpoint, log a small summary
    // of the response body so we can see whether a session object is present.
    try {
      if (path === '/api/auth/session' && response) {
        console.log('[Route Handler] /api/auth/session - incoming cookies:', redactCookies(cookieHeader));
        const cloned = response.clone();
        const text = await cloned.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (e) {
          // not JSON
        }
        const hasUser = !!(json && json.user);
        console.log('[Route Handler] /api/auth/session response summary:', {
          hasUser,
          userId: json?.user?.id ?? null,
          userEmailPresent: !!json?.user?.email,
          bodyLength: text?.length ?? 0,
        });
        console.log('[Route Handler] /api/auth/session full response:', json);
      }
    } catch (err) {
      console.warn('[Route Handler] failed to read/parse session response body', err);
    }
    return response;
  } catch (error) {
    console.error('❌ Auth handler error:', error);
    console.error('Stack:', (error as Error)?.stack);
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