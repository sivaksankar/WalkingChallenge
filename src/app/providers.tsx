'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/context/AuthContext';
import { App } from '@capacitor/app';
import { ReactNode, useEffect } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Handle Android App Links / iOS Universal Links returning from OAuth so the callback URL loads inside the WebView
    const sub = App.addListener('appUrlOpen', ({ url }) => {
      if (url) {
        window.location.href = url;
      }
    });
    return () => {
      sub.then((listener) => listener.remove()).catch(() => undefined);
    };
  }, []);

  return (
    <SessionProvider basePath="/api/auth" refetchInterval={5 * 60}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}