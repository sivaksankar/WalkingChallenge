// src/app/api/mobile/auth/signin/route.ts
// Custom OAuth signin for native mobile apps that need custom redirect URIs
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get('redirect_uri');

  if (!redirectUri) {
    return NextResponse.json({ error: 'redirect_uri is required' }, { status: 400 });
  }

  // Store the custom redirect URI in a cookie so we can use it after OAuth
  const response = NextResponse.redirect(
    new URL('/api/auth/signin/google', request.url)
  );

  // Store the mobile redirect URI
  response.cookies.set('mobile_redirect_uri', redirectUri, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
