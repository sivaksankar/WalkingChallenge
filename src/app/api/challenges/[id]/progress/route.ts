import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const options = await getAuthOptions();
    const session: any = await _getServerSession(options as any);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    // resolve userId from session
    let userId: string | undefined = (session.user as any)?.id;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      userId = snaps.docs[0].id;
    }

    const challengeRef = adminDb.collection('challenges').doc(id);
    const chSnap = await challengeRef.get();
    if (!chSnap.exists) return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
    const chData: any = chSnap.data();

    const startDate = chData.startDate?.toDate ? chData.startDate.toDate() : new Date(chData.startDate);
    const endDate = chData.endDate?.toDate ? chData.endDate.toDate() : new Date(chData.endDate);

    const stepsRef = adminDb.collection('users').doc(userId).collection('steps');
    const q = stepsRef.where('date', '>=', startDate.toISOString().split('T')[0])
                   .where('date', '<=', endDate.toISOString().split('T')[0]);
    const snaps = await q.get();

    let totalSteps = 0;
    snaps.forEach((s: any) => {
      totalSteps += s.data().steps || 0;
    });

    const today = new Date();
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = daysElapsed > 0 ? Math.round(totalSteps / daysElapsed) : 0;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const completionPercentage = Math.min(100, Math.round((daysElapsed / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) * 100));

    return NextResponse.json({ success: true, progress: { totalSteps, dailyAverage, daysRemaining, completionPercentage } });
  } catch (error: any) {
    console.error('Error in /api/challenges/[id]/progress GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
