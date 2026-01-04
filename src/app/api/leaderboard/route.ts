import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    // Aggregate today's steps from users' `steps` subcollections. Try collectionGroup first for efficiency.
    const today = new Date().toISOString().split('T')[0];

    let userStepsMap: Record<string, number> = {};

    try {
      const stepsGroup = adminDb.collectionGroup('steps').where('date', '==', today);
      const stepsSnap = await stepsGroup.get();
      stepsSnap.forEach((doc: any) => {
        const data = doc.data();
        const userRef = doc.ref.parent.parent;
        if (!userRef) return;
        const uid = userRef.id;
        userStepsMap[uid] = (userStepsMap[uid] || 0) + (data.steps || 0);
      });
    } catch (cgError) {
      // collectionGroup may fail in certain environments or require indexes — fall back to per-user reads
      console.warn('collectionGroup failed, falling back to per-user reads:', cgError);
      const usersSnap = await adminDb.collection('users').get();
      await Promise.all(usersSnap.docs.map(async (u: any) => {
        try {
          const stepsDoc = await adminDb.collection('users').doc(u.id).collection('steps').doc(today).get();
          if (stepsDoc.exists) {
            const data = stepsDoc.data() || {};
            userStepsMap[u.id] = (data.steps || 0);
          }
        } catch (e) {
          console.error('Error reading steps for user', u.id, e);
        }
      }));
    }

    const userIds = Object.keys(userStepsMap);
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    // Fetch user profiles for these ids
    const userDocs = await Promise.all(userIds.map((id) => adminDb.collection('users').doc(id).get()));

    const entries: any[] = userDocs.map((udoc: any) => {
      const data = udoc.data() || {};
      return {
        id: udoc.id,
        name: data.name || 'Anonymous',
        email: data.email || '',
        steps: userStepsMap[udoc.id] || 0,
        image: data.image || null
      };
    });

    // Sort and limit
    entries.sort((a, b) => b.steps - a.steps);
    const limited = entries.slice(0, limit);

    return NextResponse.json({ success: true, leaderboard: limited });
  } catch (error: any) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
