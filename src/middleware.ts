// src/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      console.log('[Middleware] Checking path:', path);
      console.log('[Middleware] Token present:', !!token);
      console.log('[Middleware] Token sub:', token?.sub);
      
      // Allow access if token exists
      return !!token;
    },
  },
  pages: {
    signIn: '/auth/signin', // ✅ FIXED: Corrected path to match actual sign-in page
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/challenges/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
  ],
};