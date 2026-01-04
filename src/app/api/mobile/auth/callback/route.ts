import { NextRequest, NextResponse } from 'next/server'

// Dedicated mobile OAuth callback that simply forwards the code back to the app via custom scheme.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent(error)}`
      return NextResponse.redirect(errorUrl, { status: 302 })
    }

    if (!code) {
      const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('missing_code')}`
      return NextResponse.redirect(errorUrl, { status: 302 })
    }

    const successUrl = `walkingchallenge://auth/callback?code=${encodeURIComponent(code)}`
    return NextResponse.redirect(successUrl, { status: 302 })
  } catch (error) {
    console.error('Mobile Google OAuth callback error:', error)
    const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('callback_error')}`
    return NextResponse.redirect(errorUrl, { status: 302 })
  }
}
