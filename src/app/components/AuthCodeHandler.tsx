"use client"
import { useEffect, useState } from 'react'

export default function AuthCodeHandler() {
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Only run in browser
    const code = typeof window !== 'undefined' ? window.localStorage.getItem('auth_code') : null
    const error = typeof window !== 'undefined' ? window.localStorage.getItem('auth_error') : null
    if (!code && !error) return

    (async () => {
      try {
        if (error) {
          let parsed = error
          try { parsed = JSON.parse(error) } catch (_) { /* fall back to raw */ }
          console.warn('Auth error from callback:', parsed)
          // clean up and navigate to sign-in page
          window.localStorage.removeItem('auth_error')
          window.location.href = '/auth/signin'
          return
        }

        setProcessing(true)

        // Exchange the code via the mobile exchange endpoint
        const resp = await fetch('/api/mobile/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri: window.location.origin + '/api/mobile/auth/callback' }),
        })

        if (!resp.ok) {
          console.error('Mobile auth exchange failed:', resp.status)
          window.localStorage.removeItem('auth_code')
          window.localStorage.setItem('auth_error', 'exchange_failed')
          window.location.href = '/auth/signin'
          return
        }

        const data = await resp.json()
        // Persist a lightweight marker so the SPA can reflect logged-in state
        window.localStorage.removeItem('auth_code')
        window.localStorage.setItem('mobile_session', JSON.stringify(data))
        // Redirect to dashboard where user can see they are signed in
        window.location.href = '/dashboard'
      } catch (e) {
        console.error('AuthCodeHandler error:', e)
        window.localStorage.removeItem('auth_code')
        window.localStorage.setItem('auth_error', 'exchange_failed')
        window.location.href = '/auth/signin'
      } finally {
        setProcessing(false)
      }
    })()
  }, [])

  return null
}
