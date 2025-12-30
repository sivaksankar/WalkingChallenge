import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { challengeId } = body;
    if (!challengeId) return NextResponse.json({ success: false, error: 'Missing challengeId' }, { status: 400 });

    const options = await getAuthOptions();
    const session: any = await _getServerSession(options as any);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    // Resolve userId from session (prefer id, fallback to lookup by email)
    let userId: string | undefined = (session.user as any)?.id;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      userId = snaps.docs[0].id;
    }

    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const userRef = adminDb.collection('users').doc(userId);

    // Add user to challenge participants and add challenge to user's challenges
    await adminDb.runTransaction(async (tx: any) => {
      const chSnap = await tx.get(challengeRef);
      if (!chSnap.exists) throw new Error('Challenge not found');
      const participants = chSnap.data().participants || [];
      if (!participants.includes(userId)) {
        tx.update(challengeRef, { participants: [...participants, userId] });
      }

      const userSnap = await tx.get(userRef);
      const userChallenges = userSnap.exists ? (userSnap.data().challenges || []) : [];
      if (!userChallenges.includes(challengeId)) {
        if (userSnap.exists) {
          tx.update(userRef, { challenges: [...userChallenges, challengeId] });
        } else {
          // If user doc doesn't exist, create a minimal doc with challenges
          tx.set(userRef, { challenges: [challengeId], createdAt: new Date() });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in /api/challenges/join POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
