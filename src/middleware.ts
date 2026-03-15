// src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Check if this is a mobile browser (Safari/Chrome) NOT in a native WebView
function isMobileBrowserFromUA(userAgent: string): boolean {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  // Check for WebView indicators
  // Android WebView includes 'wv' or 'WebView'
  // Capacitor on Android may just show as regular Chrome - we need to be more lenient
  // iOS Safari View Controller shows as regular Safari
  // CriOS = Chrome on iOS
  const isWebView = /wv|WebView|CriOS/i.test(userAgent);

  // On Android, if it's Chrome but NOT explicitly showing as browser-launched
  // (no 'SamsungBrowser', 'Firefox', 'Opera', etc.), it might be a WebView
  // This is a heuristic - we want to avoid false positives that break native app experience
  const isAndroidChrome = /Android.*Chrome/i.test(userAgent);
  const isExplicitBrowser = /SamsungBrowser|Firefox|Opera|Edge|Brave/i.test(userAgent);

  // Consider it a WebView if:
  // 1. Has explicit WebView indicators, OR
  // 2. Is Android Chrome without explicit third-party browser indicators
  //    (Capacitor WebView uses Chrome engine but may not always have 'wv')
  const likelyWebView = isWebView || (isAndroidChrome && !isExplicitBrowser);

  // If mobile but showing as a standalone browser (Safari on iOS, explicit browsers),
  // then it's a mobile browser, not a WebView
  // For now, we'll be conservative and NOT redirect if we're unsure
  // The landing page redirect is meant for Safari View Controller after OAuth,
  // not for preventing native app access

  // Only consider it a "mobile browser" if it's iOS Safari (not Chrome/CriOS)
  // or an explicit third-party browser
  const isIOSSafari = /iPhone|iPad|iPod/i.test(userAgent) &&
                      /Safari/i.test(userAgent) &&
                      !/CriOS|Chrome/i.test(userAgent);

  return isMobile && (isIOSSafari || isExplicitBrowser);
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
