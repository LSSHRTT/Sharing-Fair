import type { APIRoute } from 'astro';
import { jsonOk } from '../../../functions/api/lib/response';

export const GET: APIRoute = () => jsonOk({ status: 'ok', at: new Date().toISOString() });
