"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLandingPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function pollSession() {
      for (let i = 0; i < 6 && !cancelled; i++) {
        try {
          // eslint-disable-next-line no-console
          console.log('[AuthLanding] checking session attempt', i + 1);
          const res = await fetch('/api/auth/session', { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            if (json && json.user) {
              // eslint-disable-next-line no-console
              console.log('[AuthLanding] session present, redirecting to /dashboard');
              router.replace('/dashboard');
              return;
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[AuthLanding] session check failed', err);
        }
        setAttempt((a) => a + 1);
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!cancelled) {
        // Final fallback: reload to let SessionProvider detect session, then go to dashboard
        // eslint-disable-next-line no-console
        console.log('[AuthLanding] session not detected after retries — reloading');
        window.location.replace('/');
      }
    }

    pollSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="mb-2 text-sm text-gray-600">Finalizing sign-in…</p>
        <p className="text-xs text-gray-500">Attempt {attempt + 1} of 6</p>
      </div>
    </div>
  );
}
