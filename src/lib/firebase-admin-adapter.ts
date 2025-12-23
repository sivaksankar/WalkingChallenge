import type { Firestore } from 'firebase-admin/firestore';

// A minimal NextAuth adapter implementation that uses the Firebase Admin SDK.
// This implements the methods NextAuth needs during OAuth callback flows.
export function AdminFirestoreAdapter(db: Firestore) {
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
      const ref = await sessionsRef.add(session);
      const snap = await ref.get();
      return { id: ref.id, ...snap.data() } as any;
    },

    async getSessionAndUser(sessionToken: string) {
      const q = sessionsRef.where('sessionToken', '==', sessionToken).limit(1);
      const snaps = await q.get();
      const sessionDoc = snaps.docs[0];
      if (!sessionDoc) return null;
      const session = { id: sessionDoc.id, ...sessionDoc.data() } as any;
      const userSnap = await usersRef.doc((session as any).userId).get();
      if (!userSnap.exists) return null;
      const user = { id: userSnap.id, ...userSnap.data() } as any;
      return { session, user };
    },

    async updateSession(partialSession: any) {
      const q = sessionsRef.where('sessionToken', '==', partialSession.sessionToken).limit(1);
      const snaps = await q.get();
      const doc = snaps.docs[0];
      if (!doc) return null;
      await sessionsRef.doc(doc.id).set(partialSession, { merge: true });
      const snap = await sessionsRef.doc(doc.id).get();
      return { id: snap.id, ...snap.data() } as any;
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
