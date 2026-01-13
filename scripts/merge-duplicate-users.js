#!/usr/bin/env node
/**
 * Merge duplicate users in Firestore based on email.
 *
 * Usage:
 *   DRY RUN (default): node scripts/merge-duplicate-users.js
 *   APPLY CHANGES:     MIGRATION_APPLY=true node scripts/merge-duplicate-users.js
 *
 * Make sure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and one of
 * FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_PRIVATE_KEY_B64 are set in env.
 */

const admin = require('firebase-admin')

function getPrivateKeyFromEnv() {
  let key = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY
  if (key) {
    if (key.includes('\\n')) key = key.replace(/\\n/g, '\n')
    if (key.includes('\\\\n')) key = key.replace(/\\\\n/g, '\n')
  }
  if (!key && process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64) {
    try {
      key = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64, 'base64').toString('utf8')
    } catch (e) {
      console.error('Failed to decode base64 private key:', e)
    }
  }
  return key
}

function ensureEnv() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = getPrivateKeyFromEnv()
  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing required Firebase admin env vars. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY(_B64)')
    process.exit(1)
  }
  return { projectId, clientEmail, privateKey }
}

async function main() {
  const { projectId, clientEmail, privateKey } = ensureEnv()

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
  const db = admin.firestore()

  console.log('Connected to Firestore project:', projectId)

  const usersSnap = await db.collection('users').get()
  const byEmail = new Map()

  usersSnap.forEach((doc) => {
    const data = doc.data() || {}
    const email = (data.email || '').toLowerCase().trim()
    if (!email) return
    if (!byEmail.has(email)) byEmail.set(email, [])
    byEmail.get(email).push({ id: doc.id, data })
  })

  const apply = !!process.env.MIGRATION_APPLY
  console.log(`Found ${usersSnap.size} users; ${byEmail.size} unique emails. apply=${apply}`)

  for (const [email, docs] of byEmail.entries()) {
    if (docs.length < 2) continue
    console.log(`\nFound ${docs.length} duplicates for email=${email}`)

    // Heuristic: pick the doc with the most steps as canonical
    let canonical = docs[0]
    let maxSteps = -1
    for (const candidate of docs) {
      const stepsSnap = await db.collection('users').doc(candidate.id).collection('steps').get()
      const count = stepsSnap.size
      if (count > maxSteps) {
        maxSteps = count
        canonical = candidate
      }
    }
    console.log('Canonical chosen:', canonical.id, 'with steps:', maxSteps)

    for (const src of docs) {
      if (src.id === canonical.id) continue
      console.log(`  Merging ${src.id} => ${canonical.id}`)
      const srcStepsSnap = await db.collection('users').doc(src.id).collection('steps').get()
      for (const sdoc of srcStepsSnap.docs) {
        const date = sdoc.id
        const srcData = sdoc.data() || {}
        const tgtRef = db.collection('users').doc(canonical.id).collection('steps').doc(date)
        const tgtDoc = await tgtRef.get()
        if (!tgtDoc.exists) {
          console.log(`    Copying steps ${date}: ${srcData.steps}`)
          if (apply) await tgtRef.set(srcData)
        } else {
          const tgtData = tgtDoc.data() || {}
          const sum = (Number(tgtData.steps) || 0) + (Number(srcData.steps) || 0)
          console.log(`    Merging steps ${date}: ${tgtData.steps} + ${srcData.steps} => ${sum}`)
          if (apply) await tgtRef.set({ steps: sum }, { merge: true })
        }
      }

      // Merge top-level fields we care about: challenges (union), name/image
      const canonicalRef = db.collection('users').doc(canonical.id)
      const srcRef = db.collection('users').doc(src.id)
      const srcDoc = await srcRef.get()
      const srcData = srcDoc.data() || {}
      const canonDoc = await canonicalRef.get()
      const canonData = canonDoc.data() || {}

      const mergedChallenges = Array.from(new Set([...(canonData.challenges || []), ...(srcData.challenges || [])]))
      const merged = {
        challenges: mergedChallenges,
        name: canonData.name || srcData.name || null,
        image: canonData.image || srcData.image || null,
        email: canonData.email || srcData.email,
        mergedFrom: Array.from(new Set([...(canonData.mergedFrom || []), src.id]))
      }
      console.log('    Merged meta:', merged)
      if (apply) await canonicalRef.set(merged, { merge: true })

      // Delete source steps and source user
      console.log('    Deleting source steps and user doc for', src.id)
      if (apply) {
        for (const sdoc of srcStepsSnap.docs) {
          await db.collection('users').doc(src.id).collection('steps').doc(sdoc.id).delete()
        }
        await srcRef.delete()
      }
    }
  }

  console.log('\nMigration finished. If you ran with MIGRATION_APPLY=true changes have been applied.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
