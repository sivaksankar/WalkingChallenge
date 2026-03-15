// POST /api/mobile/health/sync
// Mobile endpoint for syncing step data with bearer token auth (no NextAuth session required)
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify bearer token via Google tokeninfo
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Missing authorization' }, { status: 401 });
    }
    const accessToken = authHeader.slice(7);

    // Validate token and get user info from Google
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
    const { steps, date } = body;
    if (typeof steps !== 'number' || !date) {
      return NextResponse.json({ success: false, error: 'Missing steps or date' }, { status: 400 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    // Find or create user by email
    const usersQ = adminDb.collection('users').where('email', '==', userEmail).limit(1);
    const snaps = await usersQ.get();
    if (snaps.empty) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userId = snaps.docs[0].id;

    // Store step data, keeping the higher value for the day
    const stepsRef = adminDb.collection('users').doc(userId).collection('steps').doc(date);
    await adminDb.runTransaction(async (tx: any) => {
      const docSnap = await tx.get(stepsRef);
      const currentSteps = docSnap.exists ? (docSnap.data()?.steps ?? 0) : 0;
      tx.set(stepsRef, {
        steps: Math.max(currentSteps, steps),
        date,
        lastUpdated: new Date(),
        source: 'apple_health',
        synced: true,
      }, { merge: true });
    });

    console.log(`[Mobile Health Sync] Synced ${steps} steps for ${userEmail} on ${date}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Mobile Health Sync] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
