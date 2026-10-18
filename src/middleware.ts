import { defineMiddleware } from 'astro:middleware';
import { sessionCookieName, verifySessionToken } from './lib/auth';
import { getVolunteerById, canAccess } from './lib/volunteers';

const PUBLIC_PATHS = new Set(['/login', '/calendrier/feed.ics']);
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

  // Vercel: injecte Turso même pour les routes publiques (isPublic bypassait avant)
  let env = (locals as any).runtime?.env as Env | undefined;
  if (!env?.DB && (globalThis as any).process?.env?.TURSO_DATABASE_URL) {
    const { getTursoAsD1 } = await import('./lib/turso.js');
    const { TURSO_DATABASE_URL, ...rest } = (globalThis as any).process.env;
    env = { DB: getTursoAsD1(), AUTH_SECRET: rest.AUTH_SECRET ?? '', VAPID_PUBLIC_KEY: rest.VAPID_PUBLIC_KEY, VAPID_PRIVATE_JWK: rest.VAPID_PRIVATE_JWK, VAPID_SUBJECT: rest.VAPID_SUBJECT } as unknown as Env;
    (locals as any).runtime = { env } as any;
  }

  if (isPublic(url.pathname)) {
    return next();
  }
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

  // Contrôle d'accès par onglet (le gérant a toujours tous les accès).
  const { pathname } = url;
  if (pathname.startsWith('/clients') && !canAccess(volunteer, 'clients')) {
    return redirect('/?err=acces', 302);
  }
  if (pathname.startsWith('/calendrier') && !canAccess(volunteer, 'calendrier')) {
    return redirect('/?err=acces', 302);
  }
  if (pathname.startsWith('/equipe') && !canAccess(volunteer, 'equipe')) {
    return redirect('/?err=acces', 302);
  }

  return next();
});
