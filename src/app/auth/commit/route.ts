function redact(cookieStr: string | null) {
  if (!cookieStr) return 'NONE';
  try {
    return cookieStr
      .split(';')
      .map((p) => p.trim())
      .map((pair) => {
        const [rawName] = pair.split('=');
        const name = rawName?.trim();
        if (!name) return pair;
        if (name === 'next-auth.session-token') return `${name}=(present)`;
        return `${name}=[REDACTED]`;
      })
      .join('; ');
  } catch (e) {
    return '(failed to redact)';
  }
}

export async function GET(req: Request) {
  console.log('[AuthCommit] ===== COMMIT PAGE LOADED =====');
  console.log('[AuthCommit] Request URL:', req.url);
  console.log('[AuthCommit] Request headers:', Object.fromEntries(req.headers.entries()));
  
  const cookieHeader = req.headers.get('cookie');
  console.log('[AuthCommit] Cookies received:', cookieHeader);
  
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Finalizing sign-in</title>
    </head>
    <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; display:flex;align-items:center;justify-content:center;height:100vh;background:#f9fafb;">
      <div style="text-align:center;">
        <p style="margin-bottom:8px;color:#4b5563;">Finalizing sign-in…</p>
        <p style="font-size:12px;color:#6b7280">If you are not redirected, <a href="/auth/landing">click here</a>.</p>
      </div>
      <script>
        console.log('[AuthCommit] ===== CLIENT-SIDE SCRIPT START =====');
        console.log('[AuthCommit] Current cookies:', document.cookie);
        setTimeout(() => {
          console.log('[AuthCommit] ===== REDIRECTING TO LANDING =====');
          location.replace('/auth/landing');
        }, 1000);
      </script>
    </body>
  </html>`;

  console.log('[AuthCommit] ===== SENDING HTML RESPONSE =====');
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
