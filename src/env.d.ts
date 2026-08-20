/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_JWK?: string;
  VAPID_SUBJECT?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    /** Bénévole connecté — renseigné par le middleware après vérification. */
    volunteer?: import('./lib/volunteers').VolunteerIdentity;
  }
}
