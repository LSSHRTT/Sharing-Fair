/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
}

declare namespace App {
  interface Locals extends Runtime {
    /** Bénévole connecté — renseigné par le middleware après vérification. */
    volunteer?: import('./lib/volunteers').VolunteerIdentity;
  }
}
