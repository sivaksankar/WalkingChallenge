import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export async function GET() {
  console.log('\n=== Starting Test Request ===');
  console.log('Environment Variables:', {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? '***EMAIL_SET***' : 'NOT_SET',
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? '***PRIVATE_KEY_SET***' : 'NOT_SET'
  });

  try {
    console.log('\nAttempting to access Firestore...');
    const { adminDb } = await getAdmin();
    const usersRef = adminDb.collection('users');
    console.log('Collection reference created');
    
    console.log('Executing query...');
    const snapshot = await usersRef.limit(1).get();
    console.log('Query successful');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin is working correctly',
      usersCount: snapshot.size
    });
  } catch (error: any) {
    console.error('\n=== ERROR DETAILS ===');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('Stack:', error.stack?.split('\n').slice(0, 3).join('\n') + '...');
    console.error('===================\n');
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to Firebase',
        details: error.message || 'No error details',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}