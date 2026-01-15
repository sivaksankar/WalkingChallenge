"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommitClient() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const delayMs = 400;
    // eslint-disable-next-line no-console
    console.log('[AuthCommit] client mount — delaying', delayMs, 'ms then navigating to /auth/landing');
    (async () => {
      await new Promise((r) => setTimeout(r, delayMs));
      if (!cancelled) router.replace('/auth/landing');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="mb-2 text-sm text-gray-600">Finalizing sign-in…</p>
        <p className="text-xs text-gray-500">If you are not redirected, <a href="/auth/landing" className="text-blue-600">click here</a>.</p>
      </div>
    </div>
  );
}
