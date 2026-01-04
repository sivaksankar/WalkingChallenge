import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Decode the JWT token
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET || '',
    });

    if (!decoded?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.sub;
    const body = await request.json();
    const { steps, date, source } = body;

    if (typeof steps !== 'number' || !date || !source) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: steps (number), date (ISO8601), source (string)' },
        { status: 400 }
      );
    }

    console.log(`📊 Syncing steps for user ${userId}:`, {
      steps,
      date,
      source,
    });

    // TODO: Store in Firestore
    // const db = admin.firestore();
    // await db.collection('steps').add({
    //   userId,
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
        userId,
      },
    });
  } catch (error) {
    console.error('❌ Step sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
