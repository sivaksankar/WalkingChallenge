import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      console.log('[Join Challenge] No user.id in session, looking up by email:', session.user.email);
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) {
        console.log('[Join Challenge] User not found in Firestore, email:', session.user.email);
        return NextResponse.json({ success: false, error: 'User not found. Please sign out and sign in again.' }, { status: 404 });
      }
      userId = snaps.docs[0].id;
      console.log('[Join Challenge] Found user by email, userId:', userId);
    }

    console.log('[Join Challenge] userId:', userId, 'challengeId:', challengeId);

    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const userRef = adminDb.collection('users').doc(userId);

    // Add user to challenge participants and add challenge to user's challenges
    await adminDb.runTransaction(async (tx: any) => {
      // IMPORTANT: All reads must happen before any writes in Firestore transactions
      
      // 1. Read challenge
      const chSnap = await tx.get(challengeRef);
      if (!chSnap.exists) throw new Error('Challenge not found');
      
      // 2. Read user
      const userSnap = await tx.get(userRef);
      
      // Now perform all writes
      const participants = chSnap.data().participants || [];
      if (!participants.includes(userId)) {
        console.log('[Join Challenge] Adding user to participants');
        tx.update(challengeRef, { participants: [...participants, userId] });
      } else {
        console.log('[Join Challenge] User already in participants');
      }

      const userChallenges = userSnap.exists ? (userSnap.data().challenges || []) : [];
      if (!userChallenges.includes(challengeId)) {
        if (userSnap.exists) {
          console.log('[Join Challenge] Updating user challenges');
          tx.update(userRef, { challenges: [...userChallenges, challengeId] });
        } else {
          // If user doc doesn't exist, create a minimal doc with challenges
          console.log('[Join Challenge] Creating new user document');
          tx.set(userRef, { 
            challenges: [challengeId], 
            email: session.user.email,
            name: session.user.name || '',
            createdAt: new Date() 
          });
        }
      } else {
        console.log('[Join Challenge] User already has this challenge');
      }
    });

    console.log('[Join Challenge] Transaction complete, returning success');
    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error in /api/challenges/join POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
