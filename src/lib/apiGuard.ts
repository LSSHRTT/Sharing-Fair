import type { APIContext } from 'astro';
import { sessionCookieName, verifySessionToken } from './auth';
import { getVolunteerById, canAccess, canDo, type VolunteerIdentity, type Capability } from './volunteers';
import { jsonError } from '../../functions/api/lib/response';

/**
 * Garde des endpoints /api/** :
 * - lecture  : bénévole connecté·e avec accès à l'onglet Clients ;
 * - écriture : capacité précise requise (ex. 'delete_clients') — gérant : toutes.
 *
 * Retourne null si tout est OK, sinon la Response d'erreur (401/403).
 */
export async function requireClientApiAuth(
  context: APIContext,
  opts: { action?: Capability } = {},
): Promise<Response | null> {
  const env = context.locals.runtime.env;
  const token = context.cookies.get(sessionCookieName())?.value;
  const id = await verifySessionToken(token, env.AUTH_SECRET);
  const me: VolunteerIdentity | null = id ? await getVolunteerById(env.DB, id) : null;

  if (!me) return jsonError('Authentification requise', 401);
  if (!canAccess(me, 'clients')) return jsonError('Accès non autorisé', 403);
  if (opts.action && !canDo(me, opts.action)) return jsonError('Action non autorisée', 403);
  return null;
}
