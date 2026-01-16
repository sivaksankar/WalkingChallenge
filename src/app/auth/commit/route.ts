export const runtime = 'edge';

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
  const cookieHeader = req.headers.get('cookie');
  console.log('[AuthCommit][route] Server Cookies received:', redact(cookieHeader));

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
      <script>setTimeout(()=>{location.replace('/auth/landing')},1000)</script>
    </body>
  </html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
