import { NextRequest, NextResponse } from 'next/server'

interface MobileAuthRequest {
  code: string
  redirectUri: string
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
  token_type: string
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
}

interface MobileAuthResponse {
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  profile: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MobileAuthRequest = await request.json()
    
    if (!body.code || !body.redirectUri) {
      return NextResponse.json(
        { error: 'Missing code or redirectUri' },
        { status: 400 }
      )
    }

    // Exchange authorization code for tokens with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: body.code,
        grant_type: 'authorization_code',
        // Must match the dedicated mobile callback to avoid NextAuth catch-all
        redirect_uri: 'https://nextjs-app-maiqzzrcja-uc.a.run.app/api/mobile/auth/callback',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Google token exchange failed:', error)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get user info from Google')
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 400 }
      )
    }

    const userInfo: GoogleUserInfo = await userResponse.json()

    // Return the mobile auth response
    const response: MobileAuthResponse = {
      tokens: {
        accessToken: String(tokens.access_token),
        refreshToken: String(tokens.refresh_token || ''),
        expiresIn: Number(tokens.expires_in) // Explicitly ensure it's a number
      },
      profile: {
        id: String(userInfo.id),
        name: String(userInfo.name),
        email: String(userInfo.email),
        image: userInfo.picture ? String(userInfo.picture) : undefined
      }
    }

    console.log('Returning mobile auth response:', {
      hasAccessToken: !!response.tokens.accessToken,
      hasRefreshToken: !!response.tokens.refreshToken,
      expiresIn: response.tokens.expiresIn,
      expiresInType: typeof response.tokens.expiresIn,
      profileId: response.profile.id,
      profileIdType: typeof response.profile.id,
      hasImage: !!response.profile.image
    })

    // Ensure proper JSON serialization
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
    
  } catch (error) {
    console.error('Mobile auth exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}