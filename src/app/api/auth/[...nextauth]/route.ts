// src/app/api/auth/[...nextauth]/route.ts
import { getAuthOptions } from '@/auth.config';
import NextAuth from 'next-auth/next';

const handler = async (req: Request, context: any) => {
  try {
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
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
  handler as OPTIONS,
  handler as HEAD
};