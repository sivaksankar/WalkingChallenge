// src/app/api/auth/[...nextauth]/route.ts
import { getAuthOptions } from '@/auth.config';
import NextAuth from 'next-auth/next';

export const dynamic = 'force-dynamic';

const handler = async (req: Request, context: any) => {
  try {
    // Log incoming request details for debugging
    const url = new URL(req.url);
    console.log('🔐 Auth handler called:', {
      method: req.method,
      pathname: url.pathname,
      search: url.search,
      host: req.headers.get('host'),
      'x-forwarded-host': req.headers.get('x-forwarded-host'),
      'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
    });

    // Get the host from request headers (Netlify sets X-Forwarded-Host)
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    
    if (!host) {
      console.error('❌ Unable to determine host from request headers');
      return new Response(
        JSON.stringify({ error: 'Unable to determine host' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Override NEXTAUTH_URL if not explicitly set
    if (!process.env.NEXTAUTH_URL) {
      process.env.NEXTAUTH_URL = `${proto}://${host}`;
      console.log('✅ Set NEXTAUTH_URL from headers:', process.env.NEXTAUTH_URL);
    } else {
      console.log('✅ NEXTAUTH_URL already set:', process.env.NEXTAUTH_URL);
    }

    const authOptions = await getAuthOptions();
    return await NextAuth(authOptions)(req, context);
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
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