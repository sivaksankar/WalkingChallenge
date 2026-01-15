"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommitClient() {
  // This component is left intentionally minimal; the server route serves a
  // static HTML page and performs the redirect there to avoid React SSR
  // hook errors on some requests. The client component remains in place for
  // local development where the page may hydrate.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="mb-2 text-sm text-gray-600">Finalizing sign-in…</p>
        <p className="text-xs text-gray-500">If you are not redirected, <a href="/auth/landing" className="text-blue-600">click here</a>.</p>
      </div>
    </div>
  );
}
