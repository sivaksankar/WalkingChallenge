// POST /api/mobile/challenges/join
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Missing authorization' }, { status: 401 });
    }
    const accessToken = authHeader.slice(7);

    const tokenInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 });
    }
    const tokenInfo = await tokenInfoRes.json();
    const userEmail = tokenInfo.email;
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Could not identify user' }, { status: 401 });
    }

    const body = await request.json();
    const { challengeId } = body;
    if (!challengeId) {
      return NextResponse.json({ success: false, error: 'Missing challengeId' }, { status: 400 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    const usersQ = adminDb.collection('users').where('email', '==', userEmail).limit(1);
    const snaps = await usersQ.get();
    if (snaps.empty) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userId = snaps.docs[0].id;

    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (tx: any) => {
      const chSnap = await tx.get(challengeRef);
      const userSnap = await tx.get(userRef);
      if (!chSnap.exists) throw new Error('Challenge not found');
      const participants = chSnap.data().participants || [];
      const userChallenges = userSnap.exists ? (userSnap.data().challenges || []) : [];
      if (!participants.includes(userId)) {
        tx.update(challengeRef, { participants: [...participants, userId] });
      }
      if (!userChallenges.includes(challengeId)) {
        if (userSnap.exists) {
          tx.update(userRef, { challenges: [...userChallenges, challengeId] });
        } else {
          tx.set(userRef, { challenges: [challengeId], createdAt: new Date() });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Mobile Challenges Join] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
