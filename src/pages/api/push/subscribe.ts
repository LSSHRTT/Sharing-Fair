import type { APIRoute } from 'astro';
import { sessionCookieName, verifySessionToken } from '../../../lib/auth';
import { saveSubscription } from '../../../lib/push';
import { jsonOk, jsonError } from '../../../../functions/api/lib/response';

/** Enregistre l'abonnement push du navigateur courant (appareil du bénévole connecté). */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const env = locals.runtime.env;
  const token = cookies.get(sessionCookieName())?.value;
  const id = await verifySessionToken(token, env.AUTH_SECRET);
  if (!id) return jsonError('Authentification requise', 401);

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON invalide', 400);
  }

  const endpoint = body.endpoint ?? '';
  const p256dh = body.keys?.p256dh ?? '';
  const auth = body.keys?.auth ?? '';
  if (!endpoint.startsWith('https://') || !p256dh || !auth) {
    return jsonError('Abonnement invalide', 400);
  }

  await saveSubscription(env.DB, id, { endpoint, p256dh, auth });
  return jsonOk({ ok: true });
};
