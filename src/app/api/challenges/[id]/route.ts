import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    const docRef = adminDb.collection('challenges').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });

    const data: any = snap.data();
    const challenge = {
      id: snap.id,
      ...data,
      startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
      endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString() : data.endDate,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    };

    return NextResponse.json({ success: true, challenge });
  } catch (error: any) {
    console.error('Error in /api/challenges/[id] GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
