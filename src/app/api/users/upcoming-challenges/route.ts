import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export async function GET() {
  try {
    const options = await getAuthOptions();
    const session: any = await _getServerSession(options as any);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 7);

    const q = adminDb.collection('challenges').where('startDate', '>=', now.toISOString()).where('startDate', '<=', future.toISOString());
    const snaps = await q.get();
    const results: any[] = [];

    snaps.forEach((s: any) => {
      const data = s.data();
      const participants = data.participants || [];
      // participants may be emails or userIds depending on earlier data; check both
      const matchesEmail = participants.includes(session.user.email);
      const matchesId = (session.user as any)?.id && participants.includes((session.user as any).id);
      if (matchesEmail || matchesId) {
        results.push({ id: s.id, ...data, startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate });
      }
    });

    return NextResponse.json({ success: true, upcoming: results });
  } catch (error: any) {
    console.error('Error in /api/users/upcoming-challenges GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
