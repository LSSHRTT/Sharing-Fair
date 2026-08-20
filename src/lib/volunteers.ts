/// <reference types="@cloudflare/workers-types" />

/**
 * Bénévoles & présences — Sharing Fair.
 *
 * Authentification : prénom + nom + date de naissance (mot de passe).
 * Système volontairement simple, adapté à une petite équipe interne ;
 * la date de naissance est stockée en clair en base (c'est le mot de passe).
 */

export interface Volunteer {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string; // YYYY-MM-DD
  created_at: string;
}

/** Identité exposée dans Astro.locals.volunteer (jamais la date de naissance). */
export interface VolunteerIdentity {
  id: number;
  first_name: string;
  last_name: string;
}

export function toIdentity(v: Volunteer): VolunteerIdentity {
  return { id: v.id, first_name: v.first_name, last_name: v.last_name };
}

export type PresenceStatus = 'present' | 'maybe' | 'absent';

export const PRESENCE_STATUSES: PresenceStatus[] = ['present', 'maybe', 'absent'];

export function isPresenceStatus(s: unknown): s is PresenceStatus {
  return s === 'present' || s === 'maybe' || s === 'absent';
}

export interface PresenceWithName {
  volunteer_id: number;
  date: string;
  status: PresenceStatus;
  first_name: string;
  last_name: string;
}

/**
 * Normalisation prénom/nom : insensible à la casse, aux accents et aux
 * espaces multiples — pour qu'une saisie « elise » retrouve bien « Élise ».
 */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function listVolunteers(db: D1Database): Promise<Volunteer[]> {
  const res = await db
    .prepare(
      `SELECT id, first_name, last_name, birth_date, created_at
       FROM volunteers
       ORDER BY first_name COLLATE NOCASE ASC, last_name COLLATE NOCASE ASC`,
    )
    .all<Volunteer>();
  return res.results;
}

export async function getVolunteerById(
  db: D1Database,
  id: number,
): Promise<VolunteerIdentity | null> {
  const row = await db
    .prepare('SELECT id, first_name, last_name FROM volunteers WHERE id = ?')
    .bind(id)
    .first<VolunteerIdentity>();
  return row ?? null;
}

/** Recherche un bénévole pour la connexion (comparaison insensible aux accents). */
export async function findVolunteerForLogin(
  db: D1Database,
  firstName: string,
  lastName: string,
): Promise<Volunteer | null> {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  if (!first || !last) return null;

  // L'équipe est petite : filtrage en mémoire, robuste aux accents/casse.
  const res = await db
    .prepare('SELECT id, first_name, last_name, birth_date, created_at FROM volunteers')
    .all<Volunteer>();
  return (
    res.results.find(
      (v) => normalizeName(v.first_name) === first && normalizeName(v.last_name) === last,
    ) ?? null
  );
}

export type CreateVolunteerResult =
  | { ok: true; volunteer: Volunteer }
  | { ok: false; reason: 'duplicate' };

export async function createVolunteer(
  db: D1Database,
  input: { first_name: string; last_name: string; birth_date: string },
): Promise<CreateVolunteerResult> {
  // Pré-contrôle doublon (l'index unique reste le filet de sécurité).
  const existing = await findVolunteerForLogin(db, input.first_name, input.last_name);
  if (existing) return { ok: false, reason: 'duplicate' };

  const now = new Date().toISOString();
  const inserted = await db
    .prepare(
      `INSERT INTO volunteers (first_name, last_name, birth_date, created_at)
       VALUES (?, ?, ?, ?)
       RETURNING id, first_name, last_name, birth_date, created_at`,
    )
    .bind(input.first_name.trim(), input.last_name.trim(), input.birth_date, now)
    .first<Volunteer>();

  if (!inserted) throw new Error('Insertion du bénévole échouée');
  return { ok: true, volunteer: inserted };
}

export async function deleteVolunteer(db: D1Database, id: number): Promise<boolean> {
  // Les présences suivent le bénévole (ON DELETE CASCADE + filet explicite).
  await db.prepare('DELETE FROM presences WHERE volunteer_id = ?').bind(id).run();
  const res = await db.prepare('DELETE FROM volunteers WHERE id = ?').bind(id).run();
  return res.success && (res.meta?.changes ?? 0) > 0;
}

// --- Présences ---

/** Présences de toute l'équipe entre deux dates incluses (YYYY-MM-DD). */
export async function listPresencesBetween(
  db: D1Database,
  startDate: string,
  endDate: string,
): Promise<PresenceWithName[]> {
  const res = await db
    .prepare(
      `SELECT p.volunteer_id, p.date, p.status, v.first_name, v.last_name
       FROM presences p
       JOIN volunteers v ON v.id = p.volunteer_id
       WHERE p.date BETWEEN ? AND ?
       ORDER BY v.first_name COLLATE NOCASE ASC, v.last_name COLLATE NOCASE ASC`,
    )
    .bind(startDate, endDate)
    .all<PresenceWithName>();
  return res.results;
}

/** Crée ou remplace le statut d'un bénévole pour un jour donné. */
export async function setPresence(
  db: D1Database,
  volunteerId: number,
  date: string,
  status: PresenceStatus,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO presences (volunteer_id, date, status, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (volunteer_id, date) DO UPDATE SET
         status = excluded.status,
         updated_at = excluded.updated_at`,
    )
    .bind(volunteerId, date, status, now)
    .run();
}

/** Retire le statut d'un bénévole pour un jour (retour à « sans réponse »). */
export async function clearPresence(
  db: D1Database,
  volunteerId: number,
  date: string,
): Promise<void> {
  await db
    .prepare('DELETE FROM presences WHERE volunteer_id = ? AND date = ?')
    .bind(volunteerId, date)
    .run();
}
