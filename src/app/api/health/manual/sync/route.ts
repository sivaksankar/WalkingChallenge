import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth/next';

// POST: Manual step entry
export async function POST(req: Request) {
  try {
    const options = await getAuthOptions();
    const session: any = await getServerSession(options as any);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { steps, date } = body;

    if (steps === undefined || !date) {
      return NextResponse.json({ success: false, error: 'Missing steps or date' }, { status: 400 });
    }

    const stepsNum = parseInt(steps);
    if (isNaN(stepsNum) || stepsNum < 0) {
      return NextResponse.json({ success: false, error: 'Invalid step count' }, { status: 400 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
    }

    // Find user by email
    let userId = (session.user as any)?.id;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      userId = snaps.docs[0].id;
    }

    // Store manual entry
    const stepsRef = adminDb.collection('users').doc(userId).collection('steps').doc(date);
    await adminDb.runTransaction(async (tx: any) => {
      const docSnap = await tx.get(stepsRef);
      const currentSteps = docSnap.exists ? docSnap.data()?.steps || 0 : 0;
      
      tx.set(stepsRef, {
        steps: Math.max(currentSteps, stepsNum), // Use the higher value
        date,
        lastUpdated: new Date(),
        source: 'manual',
        synced: true
      }, { merge: true });
    });

    return NextResponse.json({ success: true, message: 'Steps saved successfully' });
  } catch (error: any) {
    console.error('Error in /api/health/manual/sync:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
