// src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Check if this is a mobile browser (Safari/Chrome) NOT in a native WebView
function isMobileBrowserFromUA(userAgent: string): boolean {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  // Check for WebView indicators
  // Capacitor WebView typically includes 'CriOS' on iOS or has special indicators
  // SFSafariViewController shows as regular Safari
  const isWebView = /CriOS|wv|WebView/.test(userAgent);

  // If mobile but not showing WebView indicators, it's likely Safari/Chrome browser
  return isMobile && !isWebView;
}

// Check if this looks like it could be a fresh OAuth callback
// (user just authenticated and is being redirected to dashboard for first time)
function isPossibleOAuthCallback(req: NextRequest): boolean {
  // Check for common OAuth-related indicators
  const referer = req.headers.get('referer') || '';
  const hasOAuthReferer = referer.includes('accounts.google.com') ||
                          referer.includes('googleapis.com') ||
                          referer.includes('/api/auth/callback');

  // Also check if there's no __Host or session cookie yet
  // (indicates fresh redirect from OAuth)
  const cookies = req.cookies;
  const hasSessionCookie = cookies.has('__Secure-next-auth.session-token') ||
                           cookies.has('next-auth.session-token');

  return hasOAuthReferer || !hasSessionCookie;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || '';

  console.log('[Middleware] Path:', path);
  console.log('[Middleware] User Agent:', userAgent.substring(0, 100));

  // Skip middleware for non-protected routes
  if (!path.startsWith('/dashboard') &&
      !path.startsWith('/challenges') &&
      !path.startsWith('/leaderboard') &&
      !path.startsWith('/profile')) {
    return NextResponse.next();
  }

  // Get the JWT token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  console.log('[Middleware] Token present:', !!token);
  console.log('[Middleware] Token sub:', token?.sub);

  // If no token, redirect to sign in
  if (!token) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check if this is a mobile browser (not native WebView)
  // and user is accessing dashboard (likely after OAuth)
  // Use a cookie to prevent redirect loops
  const hasSeenLanding = req.cookies.has('app_redirect_shown');

  if (path.startsWith('/dashboard') && isMobileBrowserFromUA(userAgent) && !hasSeenLanding) {
    console.log('[Middleware] Mobile browser detected, redirecting to landing page');

    // Redirect to landing page which will handle returning to native app
    const landingUrl = new URL('/auth/landing', req.url);
    const response = NextResponse.redirect(landingUrl);

    // Set a cookie so we don't redirect again if user stays in browser
    response.cookies.set('app_redirect_shown', 'true', {
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });

    return response;
  }

  // Allow access for authenticated users in native WebView or web
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/challenges/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
  ],
};
