// src/auth.ts
import NextAuth from 'next-auth';
import { getAuthOptions } from './auth.config';

// For API routes - provide an async handler that resolves dynamic options
const handler = async (req: Request, res: any) => {
	const options = await getAuthOptions();
	return await NextAuth(options)(req as any, res as any);
};

export { handler as GET, handler as POST };

// For server components - export a helper that resolves options at call time
import { getServerSession as _getServerSession } from 'next-auth/next';
export const getServerSession = async () => {
	const options = await getAuthOptions();
	return _getServerSession(options as any);
};

// For client components
export { signIn, signOut } from 'next-auth/react';