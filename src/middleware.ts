import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const hasToken = !!token;
      console.log('[Middleware] path:', req.nextUrl.pathname, 'hasToken:', hasToken);
      
      // Always allow access for now - we'll handle protection client-side
      // This is needed for mobile app redirects after OAuth
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
