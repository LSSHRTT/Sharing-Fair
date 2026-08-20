import type { APIRoute } from 'astro';
import { getEvent } from '../../../lib/events';
import { buildIcs } from '../../../lib/ics';

/** Téléchargement d'un événement unique en .ics (Apple Calendar, Google…). */
export const GET: APIRoute = async ({ params, locals }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('ID invalide', { status: 400 });
  }

  const event = await getEvent(locals.runtime.env.DB, id);
  if (!event) {
    return new Response('Événement introuvable', { status: 404 });
  }

  const safeTitle = event.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'evenement';

  return new Response(buildIcs([event]), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${safeTitle}.ics"`,
    },
  });
};
