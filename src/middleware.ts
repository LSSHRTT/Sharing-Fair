import { defineMiddleware } from 'astro:middleware';
import { sessionCookieName, verifySessionToken } from './lib/auth';
import { getVolunteerById } from './lib/volunteers';

const PUBLIC_PATHS = new Set(['/login']);
const PUBLIC_PREFIXES = [
  '/_astro/',
  '/favicon',
  '/api/',
  '/assets/',
  // PWA : manifest, service worker, icônes et page hors-ligne
  // doivent être accessibles sans session (installation sur l'écran d'accueil).
  '/manifest.webmanifest',
  '/sw.js',
  '/offline.html',
  '/icons/',
  '/logo.svg',
];

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
  const db = env?.DB;
  const token = cookies.get(sessionCookieName())?.value;
  const volunteerId = await verifySessionToken(token, secret);

  // Jeton valide → on recharge le bénévole (il a pu être supprimé de l'équipe).
  const volunteer = volunteerId && db ? await getVolunteerById(db, volunteerId) : null;

  if (!volunteer) {
    if (token) cookies.delete(sessionCookieName(), { path: '/' });
    const next_ = url.pathname + url.search;
    return redirect(`/login?next=${encodeURIComponent(next_)}`, 302);
  }

  locals.volunteer = volunteer;
  return next();
});
