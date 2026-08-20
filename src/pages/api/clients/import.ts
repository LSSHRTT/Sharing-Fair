import type { APIRoute } from 'astro';
import { clientImportSchema } from '../../../../functions/api/lib/schemas';
import { bulkImportClients } from '../../../../functions/api/lib/db';
import { jsonOk, jsonError } from '../../../../functions/api/lib/response';
import { requireClientApiAuth } from '../../../lib/apiGuard';

export const POST: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context, { write: true });
  if (denied) return denied;

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return jsonError('JSON invalide', 400);
  }
  const parsed = clientImportSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation échouée', 400, parsed.error.flatten());
  }
  const summary = await bulkImportClients(context.locals.runtime.env.DB, parsed.data.clients);
  return jsonOk(summary, 201);
};
