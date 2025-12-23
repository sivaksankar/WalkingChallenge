import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    const challengeRef = adminDb.collection('challenges').doc(id);
    const chSnap = await challengeRef.get();
    if (!chSnap.exists) return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });

    const chData: any = chSnap.data();
    const participants: string[] = chData.participants || [];
    const startDate = chData.startDate?.toDate ? chData.startDate.toDate() : new Date(chData.startDate);
    const endDate = chData.endDate?.toDate ? chData.endDate.toDate() : new Date(chData.endDate);

    const results: any[] = [];

    for (const userId of participants) {
      try {
        const userRef = adminDb.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) continue;
        const userData: any = userSnap.data();

        const stepsRef = adminDb.collection('users').doc(userId).collection('steps');
        const q = stepsRef.where('date', '>=', startDate.toISOString().split('T')[0])
                       .where('date', '<=', endDate.toISOString().split('T')[0]);
        const snaps = await q.get();

        let totalSteps = 0;
        let daysWithSteps = 0;
        snaps.forEach((s: any) => {
          const st = s.data().steps || 0;
          if (st > 0) {
            totalSteps += st;
            daysWithSteps++;
          }
        });

        results.push({
          userId,
          name: userData.name || 'Anonymous',
          email: userData.email,
          totalSteps,
          daysCompleted: daysWithSteps,
        });
      } catch (err) {
        console.error('Error processing participant', userId, err);
      }
    }

    results.sort((a, b) => b.totalSteps - a.totalSteps);
    return NextResponse.json({ success: true, leaderboard: results });
  } catch (error: any) {
    console.error('Error in /api/challenges/[id]/leaderboard GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
