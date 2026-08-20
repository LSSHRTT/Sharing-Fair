import type { APIRoute } from 'astro';
import { sessionCookieName, verifySessionToken } from '../../../lib/auth';
import { removeSubscription } from '../../../lib/push';
import { jsonOk, jsonError } from '../../../../functions/api/lib/response';

/** Supprime l'abonnement push de l'appareil courant. */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const env = locals.runtime.env;
  const token = cookies.get(sessionCookieName())?.value;
  const id = await verifySessionToken(token, env.AUTH_SECRET);
  if (!id) return jsonError('Authentification requise', 401);

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON invalide', 400);
  }
  if (!body.endpoint) return jsonError('Endpoint manquant', 400);

  await removeSubscription(env.DB, body.endpoint);
  return jsonOk({ ok: true });
};
