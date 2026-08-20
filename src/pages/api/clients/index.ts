import type { APIRoute } from 'astro';
import { clientInputSchema, clientQuerySchema } from '../../../../functions/api/lib/schemas';
import { listClients, createClient } from '../../../../functions/api/lib/db';
import { jsonOk, jsonError } from '../../../../functions/api/lib/response';
import { requireClientApiAuth } from '../../../lib/apiGuard';

export const GET: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context);
  if (denied) return denied;

  const raw = Object.fromEntries(new URL(context.request.url).searchParams);
  const parsed = clientQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError('Paramètres invalides', 400, parsed.error.flatten());
  }
  const result = await listClients(context.locals.runtime.env.DB, parsed.data);
  return jsonOk(result);
};

export const POST: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context, { write: true });
  if (denied) return denied;

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
  const created = await createClient(context.locals.runtime.env.DB, parsed.data);
  return jsonOk(created, 201);
};
