import type { APIRoute } from 'astro';
import { sessionCookieName } from '../lib/auth';

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(sessionCookieName(), { path: '/' });
  return redirect('/login', 302);
};

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(sessionCookieName(), { path: '/' });
  return redirect('/login', 302);
};
