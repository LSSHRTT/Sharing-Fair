import type { APIRoute } from 'astro';
import { clientInputSchema } from '../../../../functions/api/lib/schemas';
import { getClient, updateClient, deleteClient } from '../../../../functions/api/lib/db';
import { jsonOk, jsonError } from '../../../../functions/api/lib/response';
import { requireClientApiAuth } from '../../../lib/apiGuard';

function clientIdFrom(params: Record<string, string | undefined>): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const GET: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context);
  if (denied) return denied;

  const id = clientIdFrom(context.params);
  if (!id) return jsonError('ID invalide', 400);
  const client = await getClient(context.locals.runtime.env.DB, id);
  if (!client) return jsonError('Client introuvable', 404);
  return jsonOk(client);
};

export const PUT: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context, { action: 'edit_clients' });
  if (denied) return denied;

  const id = clientIdFrom(context.params);
  if (!id) return jsonError('ID invalide', 400);

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return jsonError('JSON invalide', 400);
  }
  const parsed = clientInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation échouée', 400, parsed.error.flatten());
  }
  const updated = await updateClient(context.locals.runtime.env.DB, id, parsed.data);
  if (!updated) return jsonError('Client introuvable', 404);
  return jsonOk(updated);
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context, { action: 'delete_clients' });
  if (denied) return denied;

  const id = clientIdFrom(context.params);
  if (!id) return jsonError('ID invalide', 400);
  const ok = await deleteClient(context.locals.runtime.env.DB, id);
  if (!ok) return jsonError('Client introuvable', 404);
  return jsonOk({ id, deleted: true });
};
