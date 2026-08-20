import type { APIRoute } from 'astro';
import { findVolunteerByFeedToken, canAccess } from '../../lib/volunteers';
import { listEventsBetween } from '../../lib/events';
import { buildIcs } from '../../lib/ics';

/**
 * Flux d'abonnement calendrier (Google Agenda, Apple Calendar…).
 * URL personnelle et secrète : /calendrier/feed.ics?token=…
 * — publique côté middleware mais protégée par le jeton ici.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const token = url.searchParams.get('token') ?? '';
  const DB = locals.runtime.env.DB;

  const volunteer = token.length >= 32 ? await findVolunteerByFeedToken(DB, token) : null;
  if (!volunteer || !canAccess(volunteer, 'calendrier')) {
    return new Response('Lien d’abonnement invalide.', { status: 403 });
  }

  const events = await listEventsBetween(DB, '2026-01-01', '2035-12-31');

  return new Response(buildIcs(events), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      // Les agendas re-téléchargent périodiquement le flux ; cache court.
      'cache-control': 'no-cache',
    },
  });
};
