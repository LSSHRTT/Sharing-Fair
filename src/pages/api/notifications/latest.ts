import type { APIRoute } from 'astro';
import { sessionCookieName, verifySessionToken } from '../../../lib/auth';
import { listRecentNotifications } from '../../../lib/notifications';
import { jsonOk, jsonError } from '../../../../functions/api/lib/response';

/**
 * Dernière notification de l'équipe — appelée par le service worker
 * quand un push « tickle » le réveille (le cookie de session l'authentifie).
 */
export const GET: APIRoute = async ({ cookies, locals }) => {
  const env = locals.runtime.env;
  const token = cookies.get(sessionCookieName())?.value;
  const id = await verifySessionToken(token, env.AUTH_SECRET);
  if (!id) return jsonError('Authentification requise', 401);

  const [latest] = await listRecentNotifications(env.DB, 1);
  return jsonOk(
    latest
      ? { label: latest.label, href: latest.href, created_at: latest.created_at }
      : { label: null },
  );
};
