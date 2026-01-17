import type { Firestore } from 'firebase-admin/firestore';

// Helper to convert Firestore Timestamps to JS Dates
function convertTimestamps(data: any): any {
  if (!data) return data;
  const result = { ...data };
  for (const key in result) {
    if (result[key]?.toDate && typeof result[key].toDate === 'function') {
      result[key] = result[key].toDate();
    }
  }
  return result;
}

// A minimal NextAuth adapter implementation that uses the Firebase Admin SDK.
// This implements the methods NextAuth needs during OAuth callback flows.
export function AdminFirestoreAdapter(db: Firestore) {
  console.log('[Adapter] ===== ADAPTER INITIALIZED =====');
  const usersRef = db.collection('users');
  const accountsRef = db.collection('accounts');
  const sessionsRef = db.collection('sessions');
  const verificationTokensRef = db.collection('verificationTokens');

  return {
    async createUser(newUser: any) {
      const ref = await usersRef.add({ ...newUser });
      const snap = await ref.get();
      return { id: ref.id, ...snap.data() } as any;
    },

    async getUser(id: string) {
      const snap = await usersRef.doc(id).get();
      if (!snap.exists) return null;
      return { id: snap.id, ...snap.data() } as any;
    },

    async getUserByEmail(email: string) {
      const q = usersRef.where('email', '==', email).limit(1);
      const snaps = await q.get();
      const doc = snaps.docs[0];
      if (!doc) return null;
      return { id: doc.id, ...doc.data() } as any;
    },

    async getUserByAccount({ provider, providerAccountId }: any) {
      const q = accountsRef
        .where('provider', '==', provider)
        .where('providerAccountId', '==', providerAccountId)
        .limit(1);
      const snaps = await q.get();
      const acctDoc = snaps.docs[0];
      if (!acctDoc) return null;
      const { userId } = acctDoc.data() as any;
      const userSnap = await usersRef.doc(userId).get();
      if (!userSnap.exists) return null;
      return { id: userSnap.id, ...userSnap.data() } as any;
    },

    async updateUser(partialUser: any) {
      const ref = usersRef.doc(partialUser.id);
      await ref.set(partialUser, { merge: true });
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() } as any;
    },

    async deleteUser(userId: string) {
      // Delete user and related accounts/sessions in a transaction
      await db.runTransaction(async (tx) => {
        tx.delete(usersRef.doc(userId));
        const accounts = await accountsRef.where('userId', '==', userId).get();
        accounts.forEach((a) => tx.delete(accountsRef.doc(a.id)));
        const sessions = await sessionsRef.where('userId', '==', userId).get();
        sessions.forEach((s) => tx.delete(sessionsRef.doc(s.id)));
      });
    },

    async linkAccount(account: any) {
      const ref = await accountsRef.add(account);
      const snap = await ref.get();
      return { id: ref.id, ...snap.data() } as any;
    },

    async unlinkAccount({ provider, providerAccountId }: any) {
      const q = accountsRef
        .where('provider', '==', provider)
        .where('providerAccountId', '==', providerAccountId)
        .limit(1);
      const snaps = await q.get();
      const doc = snaps.docs[0];
      if (doc) await accountsRef.doc(doc.id).delete();
    },

    async createSession(session: any) {
      console.log('[Adapter] ===== CREATE SESSION CALLED =====');
      console.log('[Adapter] createSession input:', { sessionToken: session?.sessionToken, userId: session?.userId, expires: session?.expires });
      const ref = await sessionsRef.add(session);
      const snap = await ref.get();
      const result = convertTimestamps({ id: ref.id, ...snap.data() }) as any;
      console.log('[Adapter] createSession output:', { sessionId: ref.id, userId: result?.userId });
      console.log('[Adapter] ===== CREATE SESSION COMPLETE =====');
      return result;
    },

    async getSessionAndUser(sessionToken: string) {
      console.log('[Adapter] getSessionAndUser called with token:', sessionToken?.substring(0, 20) + '...');
      const q = sessionsRef.where('sessionToken', '==', sessionToken).limit(1);
      const snaps = await q.get();
      console.log('[Adapter] getSessionAndUser query returned', snaps.size, 'documents');
      const sessionDoc = snaps.docs[0];
      if (!sessionDoc) {
        console.log('[Adapter] getSessionAndUser: session not found for token');
        return null;
      }
      const session = convertTimestamps({ id: sessionDoc.id, ...sessionDoc.data() }) as any;
      console.log('[Adapter] getSessionAndUser found session:', { id: session.id, userId: session.userId, expires: session.expires });
      const userSnap = await usersRef.doc((session as any).userId).get();
      if (!userSnap.exists) {
        console.log('[Adapter] getSessionAndUser: user not found for userId:', (session as any).userId);
        return null;
      }
      const user = { id: userSnap.id, ...userSnap.data() } as any;
      console.log('[Adapter] getSessionAndUser returning session and user:', { sessionId: session.id, userId: user.id, userEmail: user.email });
      return { session, user };
    },

    async updateSession(partialSession: any) {
      const q = sessionsRef.where('sessionToken', '==', partialSession.sessionToken).limit(1);
      const snaps = await q.get();
      const doc = snaps.docs[0];
      if (!doc) return null;
      await sessionsRef.doc(doc.id).set(partialSession, { merge: true });
      const snap = await sessionsRef.doc(doc.id).get();
      return convertTimestamps({ id: snap.id, ...snap.data() }) as any;
    },

    async deleteSession(sessionToken: string) {
      const q = sessionsRef.where('sessionToken', '==', sessionToken).limit(1);
      const snaps = await q.get();
      const doc = snaps.docs[0];
      if (doc) await sessionsRef.doc(doc.id).delete();
    },

    async createVerificationToken(verificationToken: any) {
      const ref = await verificationTokensRef.add(verificationToken);
      const snap = await ref.get();
      const data = snap.data() as any;
      const { id, ...rest } = data;
      return rest;
    },

    async useVerificationToken({ identifier, token }: any) {
      const q = verificationTokensRef
        .where('identifier', '==', identifier)
        .where('token', '==', token)
        .limit(1);
      const snaps = await q.get();
      const doc = snaps.docs[0];
      if (!doc) return null;
      const data = doc.data() as any;
      await verificationTokensRef.doc(doc.id).delete();
      const { id, ...rest } = data;
      return rest;
    },
  };
}

export default AdminFirestoreAdapter;
