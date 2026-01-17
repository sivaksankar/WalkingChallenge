"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLandingPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    console.log('[AuthLanding] ===== PAGE LOADED =====');
    console.log('[AuthLanding] Current URL:', window.location.href);
    console.log('[AuthLanding] Cookies:', document.cookie);

    async function checkSession() {
      console.log('[AuthLanding] ===== CHECKING SESSION =====');
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        console.log('[AuthLanding] Session fetch status:', res.status);
        const json = await res.json();
        console.log('[AuthLanding] Session response:', json);
        if (json && json.user) {
          console.log('[AuthLanding] Session found, redirecting to /dashboard');
          router.replace('/dashboard');
          return;
        } else {
          console.log('[AuthLanding] No session found, redirecting to /dashboard (will show login)');
          router.replace('/dashboard');
        }
      } catch (err) {
        console.warn('[AuthLanding] Session check failed:', err);
        router.replace('/dashboard');
      }
    }

    // Wait a bit for cookies to be committed, then check session
    setTimeout(() => {
      console.log('[AuthLanding] ===== STARTING SESSION CHECK =====');
      checkSession();
    }, 1000);

    return () => {
      console.log('[AuthLanding] ===== PAGE UNMOUNTED =====');
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
