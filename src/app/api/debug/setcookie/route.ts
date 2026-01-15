export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookie = `x-debug=1; Path=/; SameSite=None; Secure; HttpOnly`;
    console.log('[Debug setcookie] Incoming Cookies:', req.headers.get('cookie') || 'NONE');
    console.log('[Debug setcookie] Setting cookie:', cookie);

    return new Response('', {
      status: 302,
      headers: [
        ['set-cookie', cookie],
        ['location', '/auth/commit']
      ]
    });
  } catch (err) {
    console.error('[Debug setcookie] Error:', err);
    return new Response('error', { status: 500 });
  }
}
