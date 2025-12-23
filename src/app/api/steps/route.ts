import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const daysBack = parseInt(searchParams.get('daysBack') || '7', 10);

    let resolvedUserId = userId;
    // If no userId supplied, try to derive from session server-side
    if (!resolvedUserId) {
      const options = await getAuthOptions();
      const session = await _getServerSession(options as any);
      if (session?.user?.id) {
        resolvedUserId = session.user.id as string;
      } else if (session?.user?.email) {
        // Lookup by email
        const { adminDb } = await getAdmin();
        if (!adminDb) {
          return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
        }
        const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
        const snaps = await usersQ.get();
        if (!snaps.empty) {
          resolvedUserId = snaps.docs[0].id;
        }
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
    }

    // Build date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const stepsRef = adminDb.collection('users').doc(resolvedUserId).collection('steps');
    const q = stepsRef.where('date', '>=', startDateStr).where('date', '<=', todayStr).orderBy('date', 'asc');
    const snapshot = await q.get();

    const steps: Array<any> = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      steps.push({ id: doc.id, ...data });
    });

    return NextResponse.json({ success: true, steps });
  } catch (error: any) {
    console.error('Error in /api/steps (GET):', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// Increment steps for the authenticated user (server-side)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stepsToAdd = Number(body?.stepsToAdd || 0);
    if (!stepsToAdd || stepsToAdd <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid stepsToAdd' }, { status: 400 });
    }

    // Get session
    const options = await getAuthOptions();
    const session = await _getServerSession(options as any);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    // Find user document by session user id or email
    let userId = session.user.id as string | undefined;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      userId = snaps.docs[0].id;
    }

    const today = new Date().toISOString().split('T')[0];
    const stepsRef = adminDb.collection('users').doc(userId).collection('steps').doc(today);

    // Use transaction to increment steps atomically
    await adminDb.runTransaction(async (tx: any) => {
      const docSnap = await tx.get(stepsRef);
      const current = (docSnap.exists ? docSnap.data().steps || 0 : 0);
      tx.set(stepsRef, { steps: current + stepsToAdd, date: today, lastUpdated: new Date() }, { merge: true });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in /api/steps (POST):', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// Set steps to an exact value for the authenticated user
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const newSteps = Number(body?.newSteps);
    if (isNaN(newSteps) || newSteps < 0) {
      return NextResponse.json({ success: false, error: 'Invalid newSteps' }, { status: 400 });
    }

    const options = await getAuthOptions();
    const session = await _getServerSession(options as any);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    let userId = session.user.id as string | undefined;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      userId = snaps.docs[0].id;
    }

    const today = new Date().toISOString().split('T')[0];
    const stepsRef = adminDb.collection('users').doc(userId).collection('steps').doc(today);

    await adminDb.runTransaction(async (tx: any) => {
      tx.set(stepsRef, { steps: newSteps, date: today, lastUpdated: new Date() }, { merge: true });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in /api/steps (PUT):', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
