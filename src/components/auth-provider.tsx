// src/components/auth-provider.tsx
'use server';

import { getServerSession as _getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/auth.config';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

export default async function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const options = await getAuthOptions();
  const session = (await _getServerSession(options as any)) as Session | null;
  return <SessionProvider session={session}>{children}</SessionProvider>;
}