/// <reference types="@cloudflare/workers-types" />

/**
 * Événements du calendrier partagé — ventes, crèches de Noël, sorties…
 * Indépendants des présences personnelles : ce sont les « rendez-vous »
 * de l'équipe, visibles par tous, éditables par tout bénévole connecté.
 */

export interface CalendarEvent {
  id: number;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (>= start_date)
  hours: string | null;
  volunteers_text: string | null;
  contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  start_date: string;
  end_date: string;
  hours?: string | null;
  volunteers_text?: string | null;
  contact?: string | null;
  notes?: string | null;
}

/** Valide le format + la cohérence d'une date YYYY-MM-DD. */
export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Itère les dates couvertes par un événement, bornées à [min, max]. */
export function eachCoveredDay(startIso: string, endIso: string, min?: string, max?: string): string[] {
  const lo = min && startIso < min ? min : startIso;
  const hi = max && endIso > max ? max : endIso;
  const days: string[] = [];
  for (
    let t = Date.parse(`${lo}T00:00:00Z`), end = Date.parse(`${hi}T00:00:00Z`);
    t <= end;
    t += 86400000
  ) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

export function isMultiDay(e: Pick<CalendarEvent, 'start_date' | 'end_date'>): boolean {
  return e.end_date > e.start_date;
}

export function formatEventDateRange(e: Pick<CalendarEvent, 'start_date' | 'end_date'>): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const fmt = new Intl.DateTimeFormat('fr-FR', opts);
  const start = new Date(`${e.start_date}T00:00:00Z`);
  const end = new Date(`${e.end_date}T00:00:00Z`);
  if (e.start_date === e.end_date) return fmt.format(start);
  const fmtYear: Intl.DateTimeFormatOptions = { ...opts, year: 'numeric' };
  if (e.start_date.slice(0, 4) !== e.end_date.slice(0, 4)) {
    return `du ${fmt.format(start)} ${e.start_date.slice(0, 4)} au ${fmt.format(end)} ${e.end_date.slice(0, 4)}`;
  }
  return `du ${fmt.format(start)} au ${new Intl.DateTimeFormat('fr-FR', fmtYear).format(end)}`;
}

/** Événements qui intersectent la plage [startDate, endDate] (incluses). */
export async function listEventsBetween(
  db: D1Database,
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const res = await db
    .prepare(
      `SELECT * FROM events
       WHERE start_date <= ?2 AND end_date >= ?1
       ORDER BY start_date ASC, title COLLATE NOCASE ASC`,
    )
    .bind(startDate, endDate)
    .all<CalendarEvent>();
  return res.results;
}

export async function getEvent(db: D1Database, id: number): Promise<CalendarEvent | null> {
  const row = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<CalendarEvent>();
  return row ?? null;
}

export async function createEvent(db: D1Database, input: EventInput): Promise<CalendarEvent> {
  const now = new Date().toISOString();
  const inserted = await db
    .prepare(
      `INSERT INTO events (title, start_date, end_date, hours, volunteers_text, contact, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      input.title,
      input.start_date,
      input.end_date,
      input.hours ?? null,
      input.volunteers_text ?? null,
      input.contact ?? null,
      input.notes ?? null,
      now,
      now,
    )
    .first<CalendarEvent>();
  if (!inserted) throw new Error("Insertion de l'événement échouée");
  return inserted;
}

export async function updateEvent(
  db: D1Database,
  id: number,
  input: EventInput,
): Promise<CalendarEvent | null> {
  const now = new Date().toISOString();
  const updated = await db
    .prepare(
      `UPDATE events SET
         title = ?, start_date = ?, end_date = ?, hours = ?,
         volunteers_text = ?, contact = ?, notes = ?, updated_at = ?
       WHERE id = ?
       RETURNING *`,
    )
    .bind(
      input.title,
      input.start_date,
      input.end_date,
      input.hours ?? null,
      input.volunteers_text ?? null,
      input.contact ?? null,
      input.notes ?? null,
      now,
      id,
    )
    .first<CalendarEvent>();
  return updated ?? null;
}

export async function deleteEvent(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return res.success && (res.meta?.changes ?? 0) > 0;
}
