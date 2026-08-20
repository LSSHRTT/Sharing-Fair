import type { APIContext } from 'astro';
import { sessionCookieName, verifySessionToken } from './auth';
import { getVolunteerById, canAccess, type VolunteerIdentity } from './volunteers';
import { jsonError } from '../../functions/api/lib/response';

/**
 * Garde des endpoints /api/** :
 * - lecture  : bénévole connecté·e avec accès à l'onglet Clients ;
 * - écriture : réservée au gérant.
 *
 * Retourne null si tout est OK, sinon la Response d'erreur (401/403).
 */
export async function requireClientApiAuth(
  context: APIContext,
  opts: { write?: boolean } = {},
): Promise<Response | null> {
  const env = context.locals.runtime.env;
  const token = context.cookies.get(sessionCookieName())?.value;
  const id = await verifySessionToken(token, env.AUTH_SECRET);
  const me: VolunteerIdentity | null = id ? await getVolunteerById(env.DB, id) : null;

  if (!me) return jsonError('Authentification requise', 401);
  if (!canAccess(me, 'clients')) return jsonError('Accès non autorisé', 403);
  if (opts.write && me.role !== 'gerant') return jsonError('Réservé au gérant', 403);
  return null;
}
