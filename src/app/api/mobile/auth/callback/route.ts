import { NextRequest } from 'next/server'

// Dedicated mobile OAuth callback that forwards to the app via custom scheme.
// Uses HTML meta refresh since NextResponse.redirect doesn't work with custom schemes in all browsers.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    let redirectUrl: string
    if (error) {
      redirectUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent(error)}`
    } else if (!code) {
      redirectUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('missing_code')}`
    } else {
      redirectUrl = `walkingchallenge://auth/callback?code=${encodeURIComponent(code)}`
    }

    // Use HTML with meta refresh and JavaScript for better custom scheme support
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          <title>Redirecting to app...</title>
        </head>
        <body>
          <p>Redirecting to app...</p>
          <script>
            window.location.href = "${redirectUrl}";
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Mobile Google OAuth callback error:', error)
    const errorUrl = `walkingchallenge://auth/callback?error=${encodeURIComponent('callback_error')}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="0;url=${errorUrl}">
          <title>Error</title>
        </head>
        <body>
          <p>Redirecting to app...</p>
          <script>
            window.location.href = "${errorUrl}";
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
