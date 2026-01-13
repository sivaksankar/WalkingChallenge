
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';


// Note: avoid logging private key material here for security. Environment
// variables will be checked via controlled diagnostics when needed.

console.log('🚦 [StepSync] Step sync API loaded. Checking Firestore Admin SDK initialization...');

// Handle private key from multiple sources
let privateKey: string | undefined;

// 1. Try raw private key with escaped newlines
if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  // Handle both literal \n and actual newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  } else if (privateKey.includes('\\\\n')) {
    privateKey = privateKey.replace(/\\\\n/g, '\n');
  }
}

// 2. Try base64-encoded key
if (!privateKey && process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64) {
  try {
    privateKey = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64, 'base64').toString('utf8');
  } catch (e) {
    console.error('Failed to decode base64 private key:', e);
  }
}

// 3. Also try ADMIN_PRIVATE_KEY for backward compatibility
if (!privateKey && process.env.ADMIN_PRIVATE_KEY) {
  privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
}

// 4. Try ADMIN_PRIVATE_KEY_B64
if (!privateKey && process.env.ADMIN_PRIVATE_KEY_B64) {
  try {
    privateKey = Buffer.from(process.env.ADMIN_PRIVATE_KEY_B64, 'base64').toString('utf8');
  } catch (e) {
    console.error('Failed to decode base64 private key:', e);
  }
}

if (!privateKey) {
  console.error('❌ [StepSync] No private key found in environment variables');
}

// Only initialize once in serverless
try {
  if (!getApps().length) {
    console.log('🚦 [StepSync] Initializing Firebase Admin SDK...');
    if (!privateKey) {
      throw new Error('Private key not available');
    }
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('✅ [StepSync] Firebase Admin SDK initialized.');
  } else {
    console.log('ℹ️ [StepSync] Firebase Admin SDK already initialized.');
  }
} catch (sdkError) {
  console.error('❌ [StepSync] Firebase Admin SDK initialization FAILED:', sdkError);
}
let db: ReturnType<typeof getFirestore> | null = null;
try {
  db = getFirestore();
  console.log('✅ [StepSync] Firestore instance acquired.');
} catch (dbError) {
  console.error('❌ [StepSync] Firestore instance acquisition FAILED:', dbError);
}

async function verifyGoogleToken(token: string) {
  try {
    // Prefer fetching userinfo (gives email) so we can resolve to a
    // canonical user doc instead of writing to the raw Google sub id.
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // data.id is the Google user id, data.email may be useful for resolving
    return { sub: data.id || data.sub, email: data.email || null };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token authentication
    const authHeader = request.headers.get('authorization');
    console.log('[StepSync] Incoming Authorization header:', authHeader);
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the Google OAuth access token and get identifying info
    const tokenInfo = await verifyGoogleToken(token);

    if (!tokenInfo) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    const { sub: googleSub, email: googleEmail } = tokenInfo as { sub: string; email: string | null };
    const body = await request.json();
    const { steps, date, source } = body;

    if (typeof steps !== 'number' || !date || !source) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: steps (number), date (ISO8601), source (string)' },
        { status: 400 }
      );
    }

    console.log(`📊 Syncing steps for googleSub ${googleSub}:`, {
      steps,
      date,
      source,
    });


    // Store in Firestore under users/{userId}/steps (date as doc ID for idempotency)
    const dateKey = date.split('T')[0]; // Use YYYY-MM-DD as doc ID
    try {
      console.log(`⏳ Attempting Firestore write for googleSub ${googleSub} on ${dateKey}`);

      // Always resolve the admin Firestore instance from the centralized
      // admin helper rather than relying on the module-level `db` variable.
      // This avoids issues where a named admin app is initialized elsewhere
      // and the default app is not available.
      let dbInstance = null as any;
      try {
        // Safe diagnostics (do not log secrets): report whether required
        // FIREBASE env var is present so we can debug missing-config issues.
        console.log('ℹ️ [StepSync] FIREBASE_ADMIN_PROJECT_ID set?', !!process.env.FIREBASE_ADMIN_PROJECT_ID);
        const admin = await import('@/lib/firebase-admin');
        const adminExports = await admin.getAdmin();
        dbInstance = adminExports.adminDb;
        // Resolve canonical user id: prefer a user with matching googleId,
        // then a user with document id == googleSub, then a user with the
        // same email. This ensures we write steps to the canonical doc
        // created/merged earlier instead of re-creating old source docs.
        let resolvedUserId: string | null = null;
        try {
          if (googleSub) {
            const byGoogleId = await dbInstance.collection('users').where('googleId', '==', googleSub).limit(1).get();
            if (!byGoogleId.empty) {
              resolvedUserId = byGoogleId.docs[0].id;
            } else {
              const byDoc = await dbInstance.collection('users').doc(googleSub).get();
              if (byDoc.exists) resolvedUserId = byDoc.id;
            }
          }

          if (!resolvedUserId && googleEmail) {
            const byEmail = await dbInstance.collection('users').where('email', '==', googleEmail).limit(1).get();
            if (!byEmail.empty) resolvedUserId = byEmail.docs[0].id;
          }

          // Fallback to googleSub (create-or-claim semantics happen elsewhere)
          if (!resolvedUserId) resolvedUserId = googleSub || null;

          console.log('ℹ️ [StepSync] Resolved userId:', resolvedUserId, ' from googleSub:', googleSub, 'email:', googleEmail);
        } catch (resolveErr) {
          console.error('❌ [StepSync] Failed to resolve canonical user id:', resolveErr);
        }

        console.log('ℹ️ [StepSync] adminDb resolved?', !!dbInstance);
        if (!dbInstance) throw new Error('adminDb not available after getAdmin()');
      } catch (initErr) {
        console.error('❌ [StepSync] Failed to resolve adminDb for write:', initErr);
        return NextResponse.json({ success: false, error: 'Firestore not initialized' }, { status: 500 });
      }

      // Add a timeout to the Firestore write (10 seconds)
      // Use the resolved user id (prefer canonical) when writing steps.
      const targetUserId = resolvedUserId || googleSub;
      const writePromise = dbInstance.collection('users').doc(targetUserId).collection('steps').doc(dateKey).set({
        steps,
        date: dateKey,
        source,
        syncedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timed out after 10s')), 10000));
      await Promise.race([writePromise, timeoutPromise]);
      console.log(`✅ Firestore write success for targetUser ${targetUserId} (googleSub ${googleSub}) on ${dateKey}`);
      return NextResponse.json({
        success: true,
        message: 'Steps synced successfully',
        data: {
          steps,
          date,
          userId: targetUserId,
        },
      });
    } catch (firestoreError) {
      console.error(`❌ Firestore write FAILED for targetUser ${targetUserId} (googleSub ${googleSub}) on ${dateKey}:`, firestoreError);
      return NextResponse.json({
        success: false,
        error: 'Firestore write failed',
        details: firestoreError instanceof Error ? firestoreError.message : firestoreError
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Step sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
