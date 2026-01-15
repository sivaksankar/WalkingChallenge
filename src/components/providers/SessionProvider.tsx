'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect, useRef } from 'react';

// Small helper: after OAuth redirect the browser may not include freshly-set
// HttpOnly cookies on the very first client-side fetch. Retry the session
// endpoint a few times and force a reload when a session becomes available.
async function attemptSessionFetch(retries = 5) {
  let delay = 200;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.user) return json;
      }
    } catch (err) {
      // ignore network errors and try again
      // eslint-disable-next-line no-console
      console.warn('[SessionRetry] attempt error:', err);
    }
    // exponential backoff
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }
  return null;
}

export function SessionProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: any;
}) {
  const polled = useRef(false);

  useEffect(() => {
    // Only run once on mount and only when there's no session provided.
    if (polled.current) return;
    polled.current = true;

    (async () => {
      try {
        // If the provider already provided an authenticated session, skip polling
        if (session && session.user) return;

        // Try to fetch session; if it becomes available, force reload so the
        // NextAuth client state catches up deterministically.
        const found = await attemptSessionFetch(5);
        if (found) {
          // eslint-disable-next-line no-console
          console.log('[SessionRetry] session available, reloading to sync state');
          window.location.reload();
        } else {
          // eslint-disable-next-line no-console
          console.log('[SessionRetry] session not found after retries');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[SessionRetry] unexpected error:', e);
      }
    })();
  }, [session]);

  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
