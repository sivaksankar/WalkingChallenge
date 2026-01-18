// src/components/GoogleSignInButton.tsx
'use client';

import { signIn } from 'next-auth/react';

export default function GoogleSignInButton() {
  const handleSignIn = async () => {
    try {
      console.log('[GoogleSignInButton] ===== BUTTON CLICKED =====');
      console.log('[GoogleSignInButton] Starting Google sign-in...');
      const result = await signIn('google'); // Remove custom callbackUrl to use default
      console.log('[GoogleSignInButton] signIn result:', result);
      console.log('[GoogleSignInButton] ===== SIGN-IN COMPLETE =====');
    } catch (error) {
      console.error('[GoogleSignInButton] Error:', error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.43 4.93v.36h3.57c-.22.66-.35 1.36-.35 2.09s.13 1.43.35 2.09V17l2.5-2.77c.22.66.54 1.28.93 1.77H12v2.84c0 2.08 1.2 3.93 3.28 4.53v-.36h3.57c.72-1.49 1.43-3.07 1.43-4.93z" fill="#FBBC05" />
        <path d="M12 7.07v2.84H7.07c1.2-1.6 2.5-2.77 4.17-2.77s2.97.98 4.17 2.77H12V7.07z" fill="#EA4335" />
      </svg>
      Sign in with Google
    </button>
  );
}