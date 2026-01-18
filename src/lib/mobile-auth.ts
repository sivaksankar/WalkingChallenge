// src/lib/mobile-auth.ts
// Mobile-specific authentication handling for Capacitor apps

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

export const isMobile = () => Capacitor.isNativePlatform();

export const handleMobileAuth = async (authUrl: string) => {
  if (!isMobile()) {
    // For web, use standard redirect
    window.location.href = authUrl;
    return;
  }

  console.log('[MobileAuth] Starting mobile OAuth flow');
  console.log('[MobileAuth] Auth URL:', authUrl);

  try {
    // Open the OAuth URL in the system browser
    await Browser.open({ 
      url: authUrl,
      windowName: '_self',
    });

    // Listen for the app to be reopened via deep link
    const listener = await App.addListener('appUrlOpen', async (data) => {
      console.log('[MobileAuth] App URL opened:', data.url);
      
      // Close the browser
      await Browser.close();
      
      // Parse the callback URL
      const url = new URL(data.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        console.error('[MobileAuth] OAuth error:', error);
        // Handle error - redirect to sign-in with error
        window.location.href = `/auth/signin?error=${error}`;
        return;
      }

      if (code) {
        console.log('[MobileAuth] Authorization code received');
        // Redirect to callback handler with the code
        window.location.href = `/api/auth/callback/google?code=${code}`;
      }

      // Remove the listener
      listener.remove();
    });

  } catch (error) {
    console.error('[MobileAuth] Error:', error);
    throw error;
  }
};

// Helper to build the OAuth URL with proper redirect URI for mobile
export const buildMobileAuthUrl = (baseAuthUrl: string) => {
  if (!isMobile()) {
    return baseAuthUrl;
  }

  // For mobile, we need to specify a custom redirect URI
  const url = new URL(baseAuthUrl);
  const redirectUri = 'walkingchallenge://auth/callback';
  url.searchParams.set('redirect_uri', redirectUri);
  
  return url.toString();
};