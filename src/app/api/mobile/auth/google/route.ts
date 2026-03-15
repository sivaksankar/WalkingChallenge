// src/app/api/mobile/auth/google/route.ts
// Direct Google OAuth for native mobile apps
// This initiates OAuth and stores the mobile redirect URI for later
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mobileRedirectUri = searchParams.get('redirect_uri');

  if (!mobileRedirectUri) {
    return NextResponse.json({ error: 'redirect_uri is required' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
  }

  // Our server callback URL (must be registered in Google Console)
  const serverCallbackUrl = `${process.env.NEXTAUTH_URL}/api/mobile/auth/google/callback`;

  // Generate a state parameter to prevent CSRF and store mobile redirect
  const state = Buffer.from(JSON.stringify({
    mobileRedirectUri,
    timestamp: Date.now(),
  })).toString('base64url');

  // Build Google OAuth URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', serverCallbackUrl);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');
  googleAuthUrl.searchParams.set('state', state);

  console.log('[Mobile Auth] Starting OAuth flow');
  console.log('[Mobile Auth] Mobile redirect URI:', mobileRedirectUri);
  console.log('[Mobile Auth] Server callback URL:', serverCallbackUrl);

  // Redirect to Google OAuth
  return NextResponse.redirect(googleAuthUrl.toString());
}
