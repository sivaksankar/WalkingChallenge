import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const challengeId = searchParams.get('challengeId');

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    const today = new Date().toISOString().split('T')[0];
    let userStepsMap: Record<string, number> = {};
    let participantIds: string[] = [];

    if (challengeId) {
      // Fetch challenge and its participants
      const challengeSnap = await adminDb.collection('challenges').doc(challengeId).get();
      if (!challengeSnap.exists) {
        return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
      }
      const challenge = challengeSnap.data();
      // Participants may be stored as user IDs or emails; normalize to user IDs
      const rawParticipants: string[] = Array.isArray(challenge?.participants) ? challenge.participants : [];
      if (rawParticipants.length === 0) {
        return NextResponse.json({ success: true, leaderboard: [] });
      }

      // Resolve emails to user document IDs
      participantIds = [];
      await Promise.all(rawParticipants.map(async (p) => {
        if (typeof p !== 'string') return;
        // crude email heuristic
        if (p.includes('@')) {
          try {
            const q = await adminDb.collection('users').where('email', '==', p).limit(1).get();
            if (!q.empty) {
              participantIds.push(q.docs[0].id);
            } else {
              console.warn('No user found for participant email:', p);
            }
          } catch (e) {
            console.error('Error resolving participant email to user id:', p, e);
          }
        } else {
          participantIds.push(p);
        }
      }));
      if (participantIds.length === 0) {
        return NextResponse.json({ success: true, leaderboard: [] });
      }
      // Parse challenge period
      const startDate = challenge?.startDate instanceof Date
        ? challenge.startDate
        : (challenge?.startDate?.toDate?.() || new Date(challenge?.startDate));
      const endDate = challenge?.endDate instanceof Date
        ? challenge.endDate
        : (challenge?.endDate?.toDate?.() || new Date(challenge?.endDate));
      // For each participant, sum steps for the challenge period
      await Promise.all(participantIds.map(async (uid) => {
        let total = 0;
        let d = new Date(startDate);
        while (d <= endDate) {
          const dateStr = d.toISOString().split('T')[0];
          try {
            const stepsDoc = await adminDb.collection('users').doc(uid).collection('steps').doc(dateStr).get();
            if (stepsDoc.exists) {
              const data = stepsDoc.data() || {};
              total += (data.steps || 0);
            }
          } catch (e) {
            console.error('Error reading steps for user', uid, 'on', dateStr, e);
          }
          d.setDate(d.getDate() + 1);
        }
        userStepsMap[uid] = total;
      }));
    } else {
      // No challengeId: fallback to all users (original logic)
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
      participantIds = Object.keys(userStepsMap);
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
