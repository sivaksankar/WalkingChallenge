// Auth landing page - handles OAuth callback and redirects to native app
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Check if running in native Capacitor WebView
function isNativeWebView(): boolean {
  if (typeof window === 'undefined') return false;

  const win = window as any;

  // Check for Capacitor bridge indicators
  if (win.Capacitor?.isNativePlatform?.()) return true;
  if (win.webkit?.messageHandlers?.Capacitor) return true;
  if (win.AndroidBridge) return true;

  // Check if NOT in standalone browser (Safari, Chrome)
  // If we see these indicators, we're in a browser, not native app
  const ua = navigator.userAgent || '';

  // Safari View Controller or in-app browser won't have Capacitor bridge
  // but will have standard browser UA
  return false;
}

// Check if on mobile device (but in browser, not native app)
function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isNative = isNativeWebView();

  // If on mobile but NOT in native WebView, we're in a mobile browser
  return isMobile && !isNative;
}

export default function AuthLandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');
  const [showManualLink, setShowManualLink] = useState(false);

  useEffect(() => {
    console.log('[AuthLanding] ===== PAGE LOADED =====');
    console.log('[AuthLanding] Current URL:', window.location.href);
    console.log('[AuthLanding] User Agent:', navigator.userAgent);
    console.log('[AuthLanding] Is Native WebView:', isNativeWebView());
    console.log('[AuthLanding] Is Mobile Browser:', isMobileBrowser());

    async function handleAuthCallback() {
      try {
        // First check if we have a valid session
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const session = await res.json();
        console.log('[AuthLanding] Session:', session);

        if (session && session.user) {
          setStatus('Sign-in successful!');

          // If we're in a mobile browser (Safari opened for OAuth),
          // redirect to custom URL scheme to return to native app
          if (isMobileBrowser()) {
            console.log('[AuthLanding] In mobile browser, redirecting to native app...');
            setStatus('Returning to app...');

            // Try to open the native app with custom scheme
            // The native app will then navigate to /dashboard
            const appUrl = 'walkingchallenge://dashboard';
            console.log('[AuthLanding] Redirecting to:', appUrl);

            // Use location.href for immediate redirect
            window.location.href = appUrl;

            // Show manual link after a delay in case auto-redirect fails
            setTimeout(() => {
              setShowManualLink(true);
              setStatus('If the app didn\'t open automatically:');
            }, 2000);

            return;
          }

          // If in native WebView, just navigate normally
          console.log('[AuthLanding] In native WebView, navigating to dashboard');
          router.replace('/dashboard');
        } else {
          // No session - something went wrong
          console.log('[AuthLanding] No session found');
          setStatus('Authentication failed. Please try again.');

          setTimeout(() => {
            if (isMobileBrowser()) {
              window.location.href = 'walkingchallenge://login';
            } else {
              router.replace('/login');
            }
          }, 2000);
        }
      } catch (err) {
        console.error('[AuthLanding] Error:', err);
        setStatus('Error checking session');

        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    }

    // Small delay to ensure cookies are set
    setTimeout(handleAuthCallback, 500);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
        <p className="text-gray-700 mb-4">{status}</p>

        {showManualLink && (
          <div className="space-y-4">
            <a
              href="walkingchallenge://dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Open Walking Challenge App
            </a>
            <p className="text-sm text-gray-500 mt-4">
              Or close this browser and return to the app manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
