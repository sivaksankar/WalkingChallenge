"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLandingPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        console.log('[AuthLanding] Checking session...');
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          console.log('[AuthLanding] Session response:', { hasUser: !!json.user, userEmail: json.user?.email });
          if (json && json.user) {
            console.log('[AuthLanding] Session found, redirecting to /dashboard');
            router.replace('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.warn('[AuthLanding] Session check failed', err);
      }

      if (!cancelled) {
        console.log('[AuthLanding] No session found, redirecting to /dashboard (will show login)');
        router.replace('/dashboard');
      }
    }

    // Wait a bit for cookies to be committed, then check session
    setTimeout(checkSession, 1000);

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="mb-2 text-sm text-gray-600">Finalizing sign-in…</p>
        <p className="text-xs text-gray-500">Checking session...</p>
      </div>
    </div>
  );
}
