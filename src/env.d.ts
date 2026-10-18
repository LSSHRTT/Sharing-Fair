/// <reference types="astro/client" />
/// <reference types="@libsql/client" />

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<Env>;
type VercelRuntime = import('@astrojs/vercel').Runtime<Env>;

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_JWK?: string;
  VAPID_SUBJECT?: string;
}

declare namespace App {
  interface Locals extends Omit<CloudflareRuntime, 'runtime'>, VercelRuntime {
    /** Bénévole connecté — renseigné par le middleware après vérification. */
    volunteer?: import('./lib/volunteers').VolunteerIdentity;
  }
}
