import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      console.log('[Middleware] ===== MIDDLEWARE CHECK =====');
      console.log('[Middleware] path:', req.nextUrl.pathname);
      console.log('[Middleware] token present:', !!token);
      console.log('[Middleware] token data:', token ? { sub: token.sub, id: token.id } : 'null');
      console.log('[Middleware] cookies:', req.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`));
      const hasToken = !!token;
      console.log('[Middleware] hasToken result:', hasToken);
      
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
