import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForMobileResponse, MOBILE_REDIRECT_URI } from '@/lib/mobile-auth'

interface MobileAuthRequest {
  code: string
  redirectUri?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MobileAuthRequest = await request.json()
    
    if (!body.code) {
      return NextResponse.json(
        { error: 'Missing code' },
        { status: 400 }
      )
    }

    if (body.redirectUri && body.redirectUri !== MOBILE_REDIRECT_URI) {
      console.warn('Mobile exchange redirect URI mismatch:', {
        provided: body.redirectUri,
        expected: MOBILE_REDIRECT_URI,
      })
    }

    // Use the redirectUri provided by the client if present (this must match
    // the redirect used when the code was issued), otherwise fall back to the
    // configured MOBILE_REDIRECT_URI.
    const response = await exchangeCodeForMobileResponse(body.code, body.redirectUri)

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