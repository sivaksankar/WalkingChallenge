import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      // Redirect to app with error
      const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent(error)}`
      return NextResponse.redirect(errorUrl)
    }
    
    if (!code) {
      // Redirect to app with error
      const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('missing_code')}`
      return NextResponse.redirect(errorUrl)
    }
    
    // Redirect to app with authorization code
    const successUrl = `walkingchallenge://auth/callback?code=${encodeURIComponent(code)}`
    return NextResponse.redirect(successUrl)
    
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('callback_error')}`
    return NextResponse.redirect(errorUrl)
  }
}