"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLandingPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function pollSession() {
      // Increase attempts and interval to be more tolerant of slow cookie propagation
      const maxAttempts = 12; // ~8.4s total with 700ms interval
      let delayMs = 700;

      for (let i = 0; i < maxAttempts && !cancelled; i++) {
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
        await new Promise((r) => setTimeout(r, delayMs));
      }

      if (!cancelled) {
        // Final fallback: attempt to navigate to dashboard to let a full page load
        // pick up cookies; if not signed-in the page will show the sign-in UI.
        // eslint-disable-next-line no-console
        console.log('[AuthLanding] session not detected after retries — redirecting to /dashboard');
        window.location.replace('/dashboard');
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
