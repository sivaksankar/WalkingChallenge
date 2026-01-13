import { Buffer } from 'node:buffer'
import { getAdmin } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'

const defaultWebBaseUrl = (process.env.NEXT_PUBLIC_WEB_BASE_URL || 'https://nextjs-app-409798850238.us-central1.run.app').replace(/\/$/, '')
export const MOBILE_REDIRECT_URI = (process.env.MOBILE_REDIRECT_URI || `${defaultWebBaseUrl}/api/mobile/auth/callback`).replace(/\/$/, '')

export interface MobileAuthResponse {
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  profile: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
  token_type: string
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
}

export async function exchangeCodeForMobileResponse(code: string): Promise<MobileAuthResponse> {
  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: MOBILE_REDIRECT_URI,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    console.error('Google token exchange failed:', error)
    throw new Error('Failed to exchange authorization code')
  }

  const tokens: GoogleTokenResponse = await tokenResponse.json()

  const userResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  })

  if (!userResponse.ok) {
    console.error('Failed to get user info from Google')
    throw new Error('Failed to get user information')
  }

  const userInfo: GoogleUserInfo = await userResponse.json()

  // Create or update user in Firestore
  try {
    const { adminDb } = await getAdmin()
    if (adminDb) {
      // Prefer locating an existing user by email (web users often have an
      // email-based document). If a user exists with the same email, we'll
      // treat that doc as canonical and attach the Google id to it. This
      // avoids creating duplicate profiles for the same person.
      let userRef = adminDb.collection('users').doc(userInfo.id)

      // Try to find an existing user by email
      const qSnap = await adminDb.collection('users').where('email', '==', userInfo.email).limit(1).get()
      if (!qSnap.empty) {
        const existing = qSnap.docs[0]
        userRef = adminDb.collection('users').doc(existing.id)
        // Merge/attach Google id to existing doc
        await userRef.set({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          image: userInfo.picture || null,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
        console.log('[Mobile Auth] Attached Google id to existing user:', existing.id)
      } else {
        // No existing user with the email — create a new document keyed by
        // the Google id so mobile-only users still get a stable id.
        await userRef.set({
          id: userInfo.id,
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          image: userInfo.picture || null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          challenges: [],
        })
        console.log('[Mobile Auth] Created new user document for Google id:', userInfo.id)
      }
    }
  } catch (error) {
    console.error('[Mobile Auth] Failed to create/update user in Firestore:', error)
    // Don't fail the auth flow if Firestore update fails
  }

  const response: MobileAuthResponse = {
    tokens: {
      accessToken: String(tokens.access_token),
      refreshToken: String(tokens.refresh_token || ''),
      expiresIn: Number(tokens.expires_in),
    },
    profile: {
      id: String(userInfo.id),
      name: String(userInfo.name),
      email: String(userInfo.email),
      image: userInfo.picture ? String(userInfo.picture) : undefined,
    },
  }

  console.log('Returning mobile auth response:', {
    hasAccessToken: !!response.tokens.accessToken,
    hasRefreshToken: !!response.tokens.refreshToken,
    expiresIn: response.tokens.expiresIn,
    expiresInType: typeof response.tokens.expiresIn,
    profileId: response.profile.id,
    profileIdType: typeof response.profile.id,
    hasImage: !!response.profile.image,
  })

  return response
}

export function encodeMobileAuthPayload(payload: MobileAuthResponse): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}
