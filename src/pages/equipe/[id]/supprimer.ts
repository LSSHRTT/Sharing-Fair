import type { APIRoute } from 'astro';
import { deleteVolunteer } from '../../../lib/volunteers';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('ID invalide', { status: 400 });
  }

  const DB = locals.runtime.env.DB;
  const ok = await deleteVolunteer(DB, id);

  if (!ok) {
    return redirect('/equipe?err=introuvable', 303);
  }

  // Si le bénévole supprimé est le compte courant, le middleware
  // détectera la session orpheline à la prochaine requête → /login.
  return redirect('/equipe?ok=supprime', 303);
};
