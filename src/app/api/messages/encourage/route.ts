import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth/next';

// POST: Send encouragement message to challenge participants
export async function POST(req: Request) {
  try {
    const options = await getAuthOptions();
    const session: any = await getServerSession(options as any);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { challengeId, message } = body;

    if (!challengeId || !message) {
      return NextResponse.json({ success: false, error: 'Missing challengeId or message' }, { status: 400 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
    }

    // Find user by email
    let userId = (session.user as any)?.id;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      userId = snaps.docs[0].id;
    }

    // Get challenge and verify sender is a participant
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();
    
    if (!challengeSnap.exists) {
      return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
    }

    const challengeData = challengeSnap.data();
    const participants = challengeData?.participants || [];

    if (!participants.includes(userId) && !participants.includes(session.user.email)) {
      return NextResponse.json({ success: false, error: 'You are not a participant in this challenge' }, { status: 403 });
    }

    // Get sender info
    const senderDoc = await adminDb.collection('users').doc(userId).get();
    const senderData = senderDoc.data();
    const senderName = senderData?.name || session.user.name || 'Anonymous';

    // Create encouragement message
    const messageDoc = await adminDb.collection('challenges').doc(challengeId).collection('messages').add({
      senderId: userId,
      senderName,
      senderEmail: session.user.email,
      message,
      type: 'encouragement',
      createdAt: new Date(),
      likes: []
    });

    // Send notifications to all participants (store in their notifications collection)
    const notificationPromises = participants
      .filter((p: string) => p !== userId && p !== session.user.email)
      .map(async (participantId: string) => {
        try {
          await adminDb.collection('users').doc(participantId).collection('notifications').add({
            type: 'encouragement',
            challengeId,
            challengeName: challengeData?.name || 'Challenge',
            from: senderName,
            message,
            read: false,
            createdAt: new Date()
          });
        } catch (err) {
          console.error('Failed to create notification for participant:', participantId, err);
        }
      });

    await Promise.all(notificationPromises);

    return NextResponse.json({ 
      success: true, 
      messageId: messageDoc.id,
      message: 'Encouragement sent to all participants' 
    });
  } catch (error: any) {
    console.error('Error in /api/messages/encourage:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// GET: Get encouragement messages for a challenge
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ success: false, error: 'Missing challengeId' }, { status: 400 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
    }

    const messagesRef = adminDb.collection('challenges').doc(challengeId).collection('messages');
    const snapshot = await messagesRef.orderBy('createdAt', 'desc').limit(50).get();

    const messages: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error in /api/messages/encourage GET:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
