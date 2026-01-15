// src/app/api/auth/[...nextauth]/route.ts
import { getAuthOptions } from '@/auth.config';
import NextAuth from 'next-auth/next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = async (req: Request, context: any) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const cookieHeader = req.headers.get('cookie');
  console.log('[Route Handler] Request:', req.method, path);
  console.log('[Route Handler] Query:', url.searchParams.toString() || '(none)');
  console.log('[Route Handler] Headers:', {
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    'user-agent': req.headers.get('user-agent'),
  });
  console.log('[Route Handler] Cookies received:', cookieHeader ? cookieHeader.substring(0, 300) + '...' : 'NONE');
  
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
          console.log('[Route Handler] Cookie:', name, hasToken ? '(has JWT token)' : '(no token)');
        });
      }
    }

    console.log('[Route Handler]', path, '- Response status:', response?.status);
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