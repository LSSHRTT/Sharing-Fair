import { defineMiddleware } from 'astro:middleware';
import { sessionCookieName, verifySessionToken } from './lib/auth';

const PUBLIC_PATHS = new Set(['/login']);
const PUBLIC_PREFIXES = ['/_astro/', '/favicon', '/api/', '/assets/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;

  if (isPublic(url.pathname)) {
    return next();
  }

  const env = (locals as any).runtime?.env as Env | undefined;
  const secret = env?.AUTH_SECRET ?? '';
  const token = cookies.get(sessionCookieName())?.value;
  const ok = await verifySessionToken(token, secret);

  if (!ok) {
    const next_ = url.pathname + url.search;
    return redirect(`/login?next=${encodeURIComponent(next_)}`, 302);
  }

  return next();
});
