import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Get current user's joined challenges
export async function GET(req: Request) {
  try {
    const options = await getAuthOptions();
    const session: any = await _getServerSession(options as any);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
    }

    // Resolve userId from session
    let userId: string | undefined = (session.user as any)?.id;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) {
        return NextResponse.json({ success: true, challengeIds: [], userId: null });
      }
      userId = snaps.docs[0].id;
    }

    // Get user's challenges
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const challengeIds = userDoc.exists ? (userDoc.data()?.challenges || []) : [];

    return NextResponse.json({ success: true, challengeIds, userId });
  } catch (error: any) {
    console.error('Error in /api/user/challenges GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
