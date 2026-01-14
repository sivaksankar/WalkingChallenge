import { NextRequest, NextResponse } from 'next/server'

// Ensure this API route always runs dynamically (uses request headers/url).
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    // Determine client type. For mobile browsers we'll forward the
    // callback to the mobile HTML handler which will redirect to the
    // app via the custom scheme. For desktop/web browsers, we return a
    // small HTML page that stores the code in localStorage and redirects
    // to the web app root so the SPA can pick it up and finish auth.
    const ua = request.headers.get('user-agent') || ''
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua)

    if (error) {
      if (isMobile) {
        const errorUrl = `/api/mobile/auth/callback?error=${encodeURIComponent(error)}`
        return NextResponse.redirect(new URL(errorUrl, request.url))
      }
      // Web: return an HTML page that informs the user and provides the
      // error in the location so the SPA can react. Use JSON.stringify to
      // safely embed the error string in the client-side script.
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auth Error</title></head><body><h1>Sign-in error</h1><p>${encodeURIComponent(error)}</p><script>localStorage.setItem('auth_error', ${JSON.stringify(error)});window.location='/'</script></body></html>`
      return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    }

    if (!code) {
      if (isMobile) {
        const errorUrl = `/api/mobile/auth/callback?error=${encodeURIComponent('missing_code')}`
        return NextResponse.redirect(new URL(errorUrl, request.url))
      }
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auth Error</title></head><body><h1>Sign-in error</h1><p>Missing code</p><script>localStorage.setItem('auth_error', ${JSON.stringify('missing_code')});window.location='/'</script></body></html>`
      return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    }

    if (isMobile) {
      // Forward to the mobile HTML handler which will do an HTML redirect
      // to the app custom scheme (handles browsers that don't allow direct
      // redirects to custom schemes).
      const mobileUrl = `/api/mobile/auth/callback?code=${encodeURIComponent(code)}`
      return NextResponse.redirect(new URL(mobileUrl, request.url))
    }

    // Web flow: embed the auth code in localStorage and redirect to the
    // SPA root so client-side code can pick it up and complete the login.
    // Use JSON.stringify to safely embed the raw auth code into the
    // HTML so client-side code receives the exact, unencoded code.
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signing in...</title></head><body><p>Signing you in — returning to the app.</p><script>localStorage.setItem('auth_code', ${JSON.stringify(code)});window.location='/'</script></body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('callback_error')}`
    return NextResponse.redirect(errorUrl)
  }
}