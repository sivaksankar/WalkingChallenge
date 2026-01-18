// src/app/auth/signin/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Handle Google sign-in.
   * Set isLoading to true and error to null initially.
   * Call signIn with 'google' as the provider and '/auth/commit' as the callback URL.
   * If signIn returns an error, log the error to the console and set error to the error message.
   * If signIn throws an exception, log the exception to the console and set error to the exception message.
   * Set isLoading to false after signIn completes.
   * @returns {Promise<void>}
   */
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[SignInPage] Starting Google sign-in...');
      console.log('[SignInPage] Callback URL:', callbackUrl);
      
      // ✅ FIXED: Simplified sign-in call
      await signIn('google', { 
        callbackUrl,
        redirect: true,
      });
      
      // If we reach here without redirect, there was an error
      console.log('[SignInPage] Sign-in completed without redirect');
      
    } catch (err) {
      console.error('[SignInPage] Sign-in error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during sign-in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Walking Challenge
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Track your steps and compete with friends
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {searchParams.get('error') && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Authentication Error: </strong>
              <span className="block sm:inline">
                {searchParams.get('error') === 'OAuthSignin' && 'Failed to start OAuth sign-in'}
                {searchParams.get('error') === 'OAuthCallback' && 'Failed to handle OAuth callback'}
                {searchParams.get('error') === 'OAuthCreateAccount' && 'Failed to create account'}
                {searchParams.get('error') === 'EmailCreateAccount' && 'Failed to create account'}
                {searchParams.get('error') === 'Callback' && 'Failed to process callback'}
                {searchParams.get('error') === 'OAuthAccountNotLinked' && 'Email already used with different sign-in method'}
                {searchParams.get('error') === 'EmailSignin' && 'Failed to send sign-in email'}
                {searchParams.get('error') === 'CredentialsSignin' && 'Sign in failed. Check your credentials.'}
                {searchParams.get('error') === 'SessionRequired' && 'Please sign in to access this page'}
                {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(searchParams.get('error') || '') && searchParams.get('error')}
              </span>
            </div>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            variant="outline"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                Signing in...
              </>
            ) : (
              <>
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}