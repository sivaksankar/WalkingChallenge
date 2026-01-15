import { headers } from 'next/headers';
import CommitClient from './CommitClient';

export default function AuthCommitPage() {
  // Server-side log of incoming cookies so we can see whether the browser
  // included cookies on the initial navigation to /auth/commit.
  const cookieHeader = headers().get('cookie');

  function redact(cookieStr: string | null) {
    if (!cookieStr) return 'NONE';
    try {
      return cookieStr
        .split(';')
        .map((p) => p.trim())
        .map((pair) => {
          const [rawName] = pair.split('=');
          const name = rawName?.trim();
          if (!name) return pair;
          if (name === 'next-auth.session-token') return `${name}=(present)`;
          return `${name}=[REDACTED]`;
        })
        .join('; ');
    } catch (e) {
      return '(failed to redact)';
    }
  }

  console.log('[AuthCommit] Server Cookies received:', redact(cookieHeader));

  return <CommitClient />;
}
