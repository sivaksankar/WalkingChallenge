// src/app/api/mobile/auth/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

interface UserInfo {
  sub?: string;  // v3/OIDC endpoint
  id?: string;   // v2 endpoint
  name: string;
  picture?: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    console.log('[Mobile Auth Exchange] Received code exchange request');
    console.log('[Mobile Auth Exchange] Code length:', code?.length);
    console.log('[Mobile Auth Exchange] Redirect URI from client:', redirectUri);

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Use the server callback URL that was registered with Google
    // The client sends their custom scheme, but we used the server callback for OAuth
    const serverCallbackUrl = `${process.env.NEXTAUTH_URL}/api/mobile/auth/google/callback`;
    console.log('[Mobile Auth Exchange] Using server callback URL:', serverCallbackUrl);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: serverCallbackUrl, // Use server callback, not client's custom scheme
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }

    const userInfo: UserInfo = await userInfoResponse.json();

    // Return session payload compatible with iOS app
    // IMPORTANT: Use snake_case because Swift decoder uses .convertFromSnakeCase
    // All fields must be correct types for Swift Codable
    const sessionPayload = {
      tokens: {
        access_token: String(tokens.access_token),
        refresh_token: String(tokens.refresh_token || ''),
        expires_in: Number(tokens.expires_in), // TimeInterval (Double) in Swift
      },
      profile: {
        id: String(userInfo.sub || userInfo.id || ''), // v3 uses sub, v2 uses id
        name: String(userInfo.name || 'User'),
        image: userInfo.picture ? String(userInfo.picture) : null, // String URL or null
        email: userInfo.email ? String(userInfo.email) : null,
      },
    };

    console.log('[Mobile Auth Exchange] Session payload:', JSON.stringify(sessionPayload, null, 2));
    return NextResponse.json(sessionPayload);
  } catch (error) {
    console.error('Mobile auth exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}