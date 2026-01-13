import { NextRequest } from 'next/server'
// This route needs request context (headers/url), force dynamic execution
export const dynamic = 'force-dynamic'
import { encodeMobileAuthPayload, exchangeCodeForMobileResponse } from '@/lib/mobile-auth'

const MOBILE_APP_CALLBACK_URL = process.env.MOBILE_APP_CALLBACK_URL || 'walkingchallenge://auth/callback'

function buildAppRedirect(params: Record<string, string>) {
  const target = new URL(MOBILE_APP_CALLBACK_URL)
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value))
  return target.toString()
}

function htmlRedirect(targetUrl: string) {
  const escapedAttr = targetUrl.replace(/"/g, '&quot;')
  const scriptTarget = JSON.stringify(targetUrl)
  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="0;url=${escapedAttr}">
          <title>Redirecting to app...</title>
        </head>
        <body>
          <p>Redirecting to app...</p>
          <script>
            window.location.href = ${scriptTarget};
          </script>
        </body>
      </html>
    `
}

// Dedicated mobile OAuth callback that forwards to the app via custom scheme.
// Uses HTML meta refresh since NextResponse.redirect doesn't work with custom schemes in all browsers.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    // Log for debugging
    console.log('Mobile OAuth callback received:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      error,
      allParams: Object.fromEntries(searchParams.entries())
    })

    let redirectUrl: string
    if (error) {
      console.log('OAuth error from Google:', error)
      redirectUrl = buildAppRedirect({ error })
    } else if (!code) {
      console.log('No code received in callback')
      redirectUrl = buildAppRedirect({ error: 'missing_code' })
    } else {
      console.log('Attempting inline code exchange before redirect')
      try {
        const sessionPayload = await exchangeCodeForMobileResponse(code)
        const payloadString = encodeMobileAuthPayload(sessionPayload)
        redirectUrl = buildAppRedirect({ payload: payloadString, code })
      } catch (exchangeError) {
        console.error('Failed to exchange code inside callback:', exchangeError)
        redirectUrl = buildAppRedirect({ error: 'exchange_failed', code })
      }
    }

    const html = htmlRedirect(redirectUrl)

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Mobile Google OAuth callback error:', error)
    console.error('Request URL:', request.url)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    const errorUrl = buildAppRedirect({ error: 'callback_error' })
    const html = htmlRedirect(errorUrl)

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
