import type { APIRoute } from 'astro';
import { deleteEvent, getEvent } from '../../../../lib/events';
import { canDo } from '../../../../lib/volunteers';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  // Suppression d'événement : capacité « Gérer les événements » requise.
  if (!locals.volunteer || !canDo(locals.volunteer, 'manage_events')) {
    return new Response('Action non autorisée', { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('ID invalide', { status: 400 });
  }

  const DB = locals.runtime.env.DB;
  const event = await getEvent(DB, id);
  const anchor = event?.start_date ?? new Date().toISOString().slice(0, 10);

  await deleteEvent(DB, id);

  return redirect(`/calendrier/${anchor}?m=${anchor.slice(0, 7)}&ok=event-supprime`, 303);
};
