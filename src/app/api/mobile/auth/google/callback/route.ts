// src/app/api/mobile/auth/google/callback/route.ts
// Callback handler for mobile OAuth - redirects to custom scheme with auth code
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('[Mobile Auth Callback] Received callback');
  console.log('[Mobile Auth Callback] Code present:', !!code);
  console.log('[Mobile Auth Callback] State:', state);
  console.log('[Mobile Auth Callback] Error:', error);

  if (error) {
    console.error('[Mobile Auth Callback] OAuth error:', error);
    return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    console.error('[Mobile Auth Callback] No authorization code received');
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  if (!state) {
    console.error('[Mobile Auth Callback] No state parameter');
    return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 });
  }

  try {
    // Decode the state to get the mobile redirect URI
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const mobileRedirectUri = stateData.mobileRedirectUri;

    if (!mobileRedirectUri) {
      console.error('[Mobile Auth Callback] No mobile redirect URI in state');
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Check timestamp (10 minute expiry)
    const timestamp = stateData.timestamp;
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      console.error('[Mobile Auth Callback] State expired');
      return NextResponse.json({ error: 'State expired' }, { status: 400 });
    }

    console.log('[Mobile Auth Callback] Mobile redirect URI:', mobileRedirectUri);
    console.log('[Mobile Auth Callback] Redirecting to mobile app with code');

    // Build the mobile redirect URL with the authorization code
    const redirectUrl = new URL(mobileRedirectUri);
    redirectUrl.searchParams.set('code', code);

    // Redirect to the mobile app's custom scheme
    return NextResponse.redirect(redirectUrl.toString());
  } catch (e) {
    console.error('[Mobile Auth Callback] Error parsing state:', e);
    return NextResponse.json({ error: 'Invalid state format' }, { status: 400 });
  }
}
