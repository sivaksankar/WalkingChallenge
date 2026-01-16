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

  console.log('[Route Handler] Request:', req.method, path);
  console.log('[Route Handler] Query:', url.searchParams.toString() || '(none)');
  console.log('[Route Handler] Headers:', {
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    'user-agent': req.headers.get('user-agent'),
  });
  console.log('[Route Handler] Cookies received:', redactCookies(cookieHeader));
  
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
    // NextAuth typically returns a 302 to the callbackUrl. To avoid the
    // cookie-commit race where the client immediately requests /api/auth/session
    // before the browser attaches cookies from the redirect response, override
    // the callback redirect to point to `/auth/commit` which will perform a
    // short client-side delay then navigate to `/auth/landing`.
    if (path.startsWith('/api/auth/callback') && response?.status && String(response.status).startsWith('3')) {
      try {
        const cookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
        console.log('[Route Handler] Callback detected; overriding redirect to /auth/commit and preserving', cookies?.length ?? 0, 'Set-Cookie headers');

        // Use NEXTAUTH_URL to determine the correct host for the redirect
        const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const commitUrl = `${nextAuthUrl}/auth/commit`;
        console.log('[Route Handler] Using commit URL:', commitUrl);

        // Force the redirect to the same host where auth is handled so that
        // cookies set on the callback response will be applicable to the
        // following navigation. This prevents the browser from navigating
        // to a different host where the cookies would be host-mismatched
        // and therefore not sent.
        const headers: Array<[string, string]> = [['location', commitUrl]];
        if (cookies && cookies.length) {
          cookies.forEach((c: string) => headers.push(['set-cookie', c]));
        }

        return new Response('', { status: 302, headers });
      } catch (err) {
        console.warn('[Route Handler] failed to override callback redirect', err);
      }
    }

    // Additional short-lived debug: for session endpoint, log a small summary
    // of the response body so we can see whether a session object is present.
    try {
      if (path === '/api/auth/session' && response) {
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