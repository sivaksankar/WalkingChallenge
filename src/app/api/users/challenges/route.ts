import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId');

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    let userId = userIdParam;
    if (!userId) {
      const options = await getAuthOptions();
      const session: any = await _getServerSession(options as any);
      if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      userId = session.user.id as string;
    }

    // Query challenges where participants array contains this userId
    const q = adminDb.collection('challenges').where('participants', 'array-contains', userId);
    const snaps = await q.get();
    const challenges: any[] = [];
    snaps.forEach((doc: any) => {
      const data = doc.data();
      challenges.push({
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
        endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString() : data.endDate,
      });
    });

    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error('Error in /api/users/challenges GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
