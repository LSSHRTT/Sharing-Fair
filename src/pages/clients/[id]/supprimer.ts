import type { APIRoute } from 'astro';
import { deleteClient } from '../../../../functions/api/lib/db';
import { canDo } from '../../../lib/volunteers';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  // Suppression de fiche : capacité « Supprimer les clients » requise.
  if (!locals.volunteer || !canDo(locals.volunteer, 'delete_clients')) {
    return new Response('Action non autorisée', { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('ID invalide', { status: 400 });
  }

  const DB = locals.runtime.env.DB;
  const ok = await deleteClient(DB, id);

  if (!ok) {
    return new Response('Client introuvable', { status: 404 });
  }

  return redirect('/clients');
};
