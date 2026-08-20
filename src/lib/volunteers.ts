/// <reference types="@cloudflare/workers-types" />

import { constantTimeEqual } from './auth';

/**
 * Bénévoles & présences — Sharing Fair.
 *
 * Authentification : prénom + nom + mot de passe.
 * Par défaut, le mot de passe est la date de naissance du bénévole ;
 * il peut la remplacer par un mot de passe libre depuis sa page Profil.
 * Système volontairement simple, adapté à une petite équipe interne.
 */

export type VolunteerRole = 'gerant' | 'benevole';

export interface Volunteer {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string; // YYYY-MM-DD — fait office de mot de passe tant que password = NULL
  email: string | null;
  phone: string | null;
  photo: string | null;    // data URL (JPEG redimensionné côté client)
  password: string | null; // mot de passe personnalisé (NULL = date de naissance)
  role: VolunteerRole;
  access_calendrier: number; // 1/0 — onglet Calendrier visible
  access_clients: number;    // 1/0 — onglet Clients visible
  access_equipe: number;     // 1/0 — onglet Équipe visible
  feed_token: string | null; // jeton secret du lien d'abonnement calendrier
  // Capacités accordées individuellement (sans rôle gérant) :
  can_manage_events: number; // créer/modifier/supprimer des événements
  can_add_clients: number;
  can_edit_clients: number;
  can_delete_clients: number;
  can_send_mail: number;
  can_add_volunteer: number;
  created_at: string;
}

/** Identité exposée dans Astro.locals.volunteer (jamais la date de naissance ni le mot de passe). */
export interface VolunteerIdentity {
  id: number;
  first_name: string;
  last_name: string;
  photo: string | null;
  role: VolunteerRole;
  access_calendrier: number;
  access_clients: number;
  access_equipe: number;
  can_manage_events: number;
  can_add_clients: number;
  can_edit_clients: number;
  can_delete_clients: number;
  can_send_mail: number;
  can_add_volunteer: number;
}

const ALL_COLUMNS =
  'id, first_name, last_name, birth_date, email, phone, photo, password, role, access_calendrier, access_clients, access_equipe, feed_token, can_manage_events, can_add_clients, can_edit_clients, can_delete_clients, can_send_mail, can_add_volunteer, created_at';

/** Un gérant voit tous les onglets, quelles que soient ses permissions. */
export function canAccess(
  v: Pick<VolunteerIdentity, 'role' | 'access_calendrier' | 'access_clients' | 'access_equipe'>,
  tab: 'calendrier' | 'clients' | 'equipe',
): boolean {
  if (v.role === 'gerant') return true;
  return v[`access_${tab}`] === 1;
}

/** Capacité accordée individuellement — le rôle gérant a tout par défaut. */
export type Capability =
  | 'manage_events'
  | 'add_clients'
  | 'edit_clients'
  | 'delete_clients'
  | 'send_mail'
  | 'add_volunteer';

export function canDo(v: VolunteerIdentity, action: Capability): boolean {
  if (v.role === 'gerant') return true;
  return v[`can_${action}`] === 1;
}

export function toIdentity(v: Volunteer): VolunteerIdentity {
  return {
    id: v.id,
    first_name: v.first_name,
    last_name: v.last_name,
    photo: v.photo,
    role: v.role,
    access_calendrier: v.access_calendrier,
    access_clients: v.access_clients,
    access_equipe: v.access_equipe,
    can_manage_events: v.can_manage_events,
    can_add_clients: v.can_add_clients,
    can_edit_clients: v.can_edit_clients,
    can_delete_clients: v.can_delete_clients,
    can_send_mail: v.can_send_mail,
    can_add_volunteer: v.can_add_volunteer,
  };
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
 * Normalise une date de naissance saisie : JJ/MM/AAAA, JJ-MM-AAAA, JJMMAAAA
 * ou AAAA-MM-JJ → AAAA-MM-JJ. Retourne null si invalide (ex. 31/02/1990).
 */
export function parseBirthDate(raw: string): string | null {
  const s = raw.trim();
  let y: string, m: string, d: string;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (match) {
    [, y, m, d] = match;
  } else {
    match = /^(\d{2})[/\-. ](\d{2})[/\-. ](\d{4})$/.exec(s) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(s);
    if (!match) return null;
    [, d, m, y] = match;
  }
  const iso = `${y}-${m}-${d}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

/**
 * Vérifie l'identifiant secret d'un bénévole :
 * mot de passe personnalisé s'il en a défini un, sinon sa date de naissance
 * (dans l'un des formats acceptés par parseBirthDate).
 */
export function verifyCredential(volunteer: Volunteer, candidate: string): boolean {
  if (volunteer.password) {
    return constantTimeEqual(volunteer.password, candidate.trim());
  }
  const birth = parseBirthDate(candidate);
  return birth !== null && constantTimeEqual(volunteer.birth_date, birth);
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
      `SELECT ${ALL_COLUMNS}
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
    .prepare(`SELECT ${ALL_COLUMNS} FROM volunteers WHERE id = ?`)
    .bind(id)
    .first<Volunteer>();
  return row ? toIdentity(row) : null;
}

export async function getVolunteerFullById(
  db: D1Database,
  id: number,
): Promise<Volunteer | null> {
  const row = await db.prepare(`SELECT ${ALL_COLUMNS} FROM volunteers WHERE id = ?`).bind(id).first<Volunteer>();
  return row ?? null;
}

/** Recherche par jeton d'abonnement calendrier (lien secret personnel). */
export async function findVolunteerByFeedToken(
  db: D1Database,
  token: string,
): Promise<Volunteer | null> {
  const row = await db
    .prepare(`SELECT ${ALL_COLUMNS} FROM volunteers WHERE feed_token = ?`)
    .bind(token)
    .first<Volunteer>();
  return row ?? null;
}

export function generateFeedToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

export async function setFeedToken(db: D1Database, id: number, token: string): Promise<void> {
  await db.prepare('UPDATE volunteers SET feed_token = ? WHERE id = ?').bind(token, id).run();
}

/** Met à jour le rôle, les accès aux onglets et les capacités d'un bénévole (gérant). */
export async function updatePermissions(
  db: D1Database,
  id: number,
  fields: {
    role: VolunteerRole;
    access_calendrier: number;
    access_clients: number;
    access_equipe: number;
    can_manage_events: number;
    can_add_clients: number;
    can_edit_clients: number;
    can_delete_clients: number;
    can_send_mail: number;
    can_add_volunteer: number;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE volunteers SET
         role = ?, access_calendrier = ?, access_clients = ?, access_equipe = ?,
         can_manage_events = ?, can_add_clients = ?, can_edit_clients = ?,
         can_delete_clients = ?, can_send_mail = ?, can_add_volunteer = ?
       WHERE id = ?`,
    )
    .bind(
      fields.role,
      fields.access_calendrier,
      fields.access_clients,
      fields.access_equipe,
      fields.can_manage_events,
      fields.can_add_clients,
      fields.can_edit_clients,
      fields.can_delete_clients,
      fields.can_send_mail,
      fields.can_add_volunteer,
      id,
    )
    .run();
}

/** Met à jour les coordonnées d'un bénévole (chaque champ remplacé, null = vidé). */
export async function updateContact(
  db: D1Database,
  id: number,
  fields: { email: string | null; phone: string | null },
): Promise<void> {
  await db
    .prepare('UPDATE volunteers SET email = ?, phone = ? WHERE id = ?')
    .bind(fields.email, fields.phone, id)
    .run();
}

/** Définit la photo de profil (data URL) ou la supprime (null). */
export async function updatePhoto(
  db: D1Database,
  id: number,
  photo: string | null,
): Promise<void> {
  await db.prepare('UPDATE volunteers SET photo = ? WHERE id = ?').bind(photo, id).run();
}

/** Définit un mot de passe personnalisé (null → retour à la date de naissance). */
export async function updatePassword(
  db: D1Database,
  id: number,
  newPassword: string | null,
): Promise<void> {
  await db.prepare('UPDATE volunteers SET password = ? WHERE id = ?').bind(newPassword, id).run();
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
  const res = await db.prepare(`SELECT ${ALL_COLUMNS} FROM volunteers`).all<Volunteer>();
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
      `INSERT INTO volunteers (first_name, last_name, birth_date, feed_token, created_at)
       VALUES (?, ?, ?, ?, ?)
       RETURNING ${ALL_COLUMNS}`,
    )
    .bind(input.first_name.trim(), input.last_name.trim(), input.birth_date, generateFeedToken(), now)
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
