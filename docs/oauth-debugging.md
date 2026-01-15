OAuth debugging notes

What I changed

- Added client-side retry logic in `src/components/providers/SessionProvider.tsx` that polls `/api/auth/session` for a short time after redirect and reloads when a session is available. This prevents race conditions where a freshly-set HttpOnly cookie isn't yet reflected in client-side session fetches.
- Added additional server-side logging in `src/app/api/auth/[...nextauth]/route.ts` to log headers, query params, and cookies for every auth request.
- Added a NextAuth `logger` and `events` in `src/auth.config.ts` so sign-in/sign-out/error events and token-exchange errors are captured in logs.

Manual testing steps

1. Open a Chrome/Firefox Incognito window.
2. Start sign-in with Google and complete the consent screen.
3. After redirect completes, wait 2–3s and then run in DevTools Console:
   fetch('/api/auth/session', { credentials: 'include' }).then(r => r.json()).then(console.log)
4. If it returns empty on the first try, retry (the client provider will automatically attempt retries and reload when session becomes available).
5. Look at Cloud Run logs (stdout/stderr) and search for the following markers to debug failures:
   - `[Route Handler] Request:` — shows incoming auth requests
   - `[Route Handler] Cookies received:` — shows received cookies
   - `[Route Handler] Cookie:` — shows cookies being set on responses
   - `[NextAuth event][signIn]` / `[NextAuth event][error]` — NextAuth events
   - `[SessionRetry]` — client-side messages about retry attempts

If you still see intermittent empty sessions after these changes, reproduce the issue and paste the timestamp here so we can pull the logs around that window and inspect the full request/response exchange.

Landing page

- A new landing page `/auth/landing` will be used as the OAuth post-redirect landing target. It polls `/api/auth/session` for several short attempts and redirects to `/dashboard` when a session appears. This reduces the timing-race between Set-Cookie and client-side session fetches.

- Update: Increased landing page polling to 12 attempts with ~700ms interval (total ~8.4s) to make it more tolerant of slow cookie propagation. If no session is detected after retries the landing page redirects to `/dashboard` as a final fallback.

Client updates

- Sign-in buttons now pass `callbackUrl: '/auth/landing'` when calling `signIn('google', ...)` so all Google OAuth flows land on the landing page.
