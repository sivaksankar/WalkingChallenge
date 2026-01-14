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
    // Debug: log which public base values are available at runtime so we can
    // verify whether the handler can read the configured host used for
    // building redirect URIs. These are not secrets and help diagnose why the
    // forced public base may not be picked up in some environments.
    try {
      console.log('Runtime public base vars:', {
        NEXT_PUBLIC_WEB_BASE_URL: process.env.NEXT_PUBLIC_WEB_BASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      })
    } catch (e) {
      // ignore failures to stringify env
    }
    if (error) {
      console.log('OAuth error from Google:', error)
      redirectUrl = buildAppRedirect({ error })
    } else if (!code) {
      console.log('No code received in callback')
      redirectUrl = buildAppRedirect({ error: 'missing_code' })
    } else {
      console.log('Attempting inline code exchange before redirect')
      try {
        // Derive the exact redirect URI that Google called back to and use it
        // for the token exchange so redirect_uri matches what was used when the
        // code was issued. Some proxies or platforms (Next.js dev server, Cloud
        // Run) may present an internal host like 'localhost' in request.url,
        // so fall back to forwarded headers when that happens.
        const callbackUrl = new URL(request.url)
        callbackUrl.search = ''
        let redirectUri = callbackUrl.toString()
        try {
          const hostname = callbackUrl.hostname
          const proto = request.headers.get('x-forwarded-proto') || request.headers.get('x-forwarded-protocol') || 'https'
          const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''

          // Prefer forcing a configured public base URL when available so the
          // redirect_uri used in the token exchange always matches the OAuth
          // client's registered redirect URIs. This avoids mismatches when the
          // incoming request has a loopback or ephemeral host in forwarded
          // headers (mobile browser during auth flows).
          const publicBase = (process.env.NEXT_PUBLIC_WEB_BASE_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
          if (publicBase) {
            redirectUri = `${publicBase}/api/mobile/auth/callback`
            console.log('Forcing public base URL for redirectUri:', redirectUri, { host, publicBase })
          } else {
            // Fall back to forwarded host
            const isLoopbackHost = /(^localhost$|^127\\.0\\.0\\.1(:|$))/i.test(host)
            if (isLoopbackHost) {
              redirectUri = `${proto}://${host}/api/mobile/auth/callback`
              console.log('Normalized redirectUri from forwarded headers (loopback host, no public base):', redirectUri, { proto, host })
            } else if (host) {
              redirectUri = `${proto}://${host}/api/mobile/auth/callback`
              console.log('Normalized redirectUri from forwarded headers:', redirectUri, { proto, host })
            }
          }
        } catch (err) {
          console.warn('Failed to normalize callback URL, using request.url:', callbackUrl.toString(), err)
        }

        const sessionPayload = await exchangeCodeForMobileResponse(code, redirectUri)
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
