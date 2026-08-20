import type { APIRoute } from 'astro';
import { listDistinctTags } from '../../../../functions/api/lib/db';
import { jsonOk } from '../../../../functions/api/lib/response';
import { requireClientApiAuth } from '../../../lib/apiGuard';

export const GET: APIRoute = async (context) => {
  const denied = await requireClientApiAuth(context);
  if (denied) return denied;

  const tags = await listDistinctTags(context.locals.runtime.env.DB);
  return jsonOk(tags);
};
