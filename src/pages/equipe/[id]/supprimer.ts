import type { APIRoute } from 'astro';
import { deleteVolunteer } from '../../../lib/volunteers';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  // Suppression réservée au gérant ; impossible de se retirer soi-même.
  if (locals.volunteer?.role !== 'gerant') {
    return new Response('Réservé au gérant', { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('ID invalide', { status: 400 });
  }
  if (id === locals.volunteer.id) {
    return redirect('/equipe?err=soi-meme', 303);
  }

  const DB = locals.runtime.env.DB;
  const ok = await deleteVolunteer(DB, id);

  if (!ok) {
    return redirect('/equipe?err=introuvable', 303);
  }

  return redirect('/equipe?ok=supprime', 303);
};
