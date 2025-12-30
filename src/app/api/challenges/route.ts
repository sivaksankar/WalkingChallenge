import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession as _getServerSession } from 'next-auth/next';

// GET: list active challenges
export async function GET(req: Request) {
  try {
    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    const q = adminDb.collection('challenges').where('isActive', '==', true);
    const snaps = await q.get();
    const challenges: any[] = [];
    snaps.forEach((doc: any) => {
      const data = doc.data();
      challenges.push({
        id: doc.id,
        ...data,
        startDate: data.startDate instanceof Date ? data.startDate.toISOString() : (data.startDate?.toDate?.() || data.startDate),
        endDate: data.endDate instanceof Date ? data.endDate.toISOString() : (data.endDate?.toDate?.() || data.endDate),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
      });
    });

    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error('Error in /api/challenges GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// POST: create a new challenge (admin-only)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, startDate, endDate, minSteps } = body;
    if (!name || !startDate || !endDate || !minSteps) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const options = await getAuthOptions();
    const session: any = await _getServerSession(options as any);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    // Enforce admin email (as provided)
    const adminEmail = 'sivaksankar@gmail.com';
    if (session.user.email !== adminEmail) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });

    const docRef = await adminDb.collection('challenges').add({
      name,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      minSteps: Number(minSteps),
      participants: [],
      isActive: true,
      createdAt: new Date(),
    });

    const created = await docRef.get();
    const data = created.data();

    return NextResponse.json({ success: true, challenge: { id: docRef.id, ...data } });
  } catch (error: any) {
    console.error('Error in /api/challenges POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
