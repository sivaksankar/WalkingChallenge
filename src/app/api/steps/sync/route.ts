import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { steps, date, source } = body;

    if (typeof steps !== 'number' || !date || !source) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: steps (number), date (ISO8601), source (string)' },
        { status: 400 }
      );
    }

    console.log(`📊 Syncing steps for user ${session.user.id}:`, {
      steps,
      date,
      source,
    });

    // TODO: Store in Firestore
    // const db = admin.firestore();
    // await db.collection('steps').add({
    //   userId: session.user.id,
    //   steps,
    //   date: new Date(date),
    //   source,
    //   syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    // });

    return NextResponse.json({
      success: true,
      message: 'Steps synced successfully',
      data: {
        steps,
        date,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error('❌ Step sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
