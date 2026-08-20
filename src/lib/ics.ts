import type { CalendarEvent } from './events';

/**
 * Génère un fichier .ics (iCalendar) pour Google Agenda, Apple Calendar, etc.
 * Les événements sont en « journée entière » ; les horaires/détails passent
 * dans la description.
 */

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** '2026-08-15' → '20260815' */
function fmtDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** '2026-08-20T12:34:56.000Z' → '20260820T123456Z' */
function fmtTimestamp(isoTime: string): string {
  return isoTime.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Jour suivant d'une date ISO (DTEND des événements « toute la journée » est exclusif). */
function nextDay(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
}

/** Description texte agrégeant les infos de l'événement. */
export function eventDescription(e: CalendarEvent): string {
  return [
    e.hours && `Horaires : ${e.hours}`,
    e.volunteers_text && `Bénévoles : ${e.volunteers_text}`,
    e.contact && `Contact : ${e.contact}`,
    e.notes && `Notes : ${e.notes}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Lien « Ajouter à Google Agenda » (pré-remplit l'événement dans le navigateur). */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${fmtDate(e.start_date)}/${fmtDate(nextDay(e.end_date))}`,
    details: eventDescription(e),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(events: CalendarEvent[], calName = 'Sharing Fair — boutique solidaire'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sharing Fair//Agenda//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    'X-WR-TIMEZONE:Europe/Paris',
  ];

  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:sf-event-${e.id}@sharing-fair`,
      `DTSTAMP:${fmtTimestamp(e.updated_at)}`,
      `LAST-MODIFIED:${fmtTimestamp(e.updated_at)}`,
      `DTSTART;VALUE=DATE:${fmtDate(e.start_date)}`,
      `DTEND;VALUE=DATE:${fmtDate(nextDay(e.end_date))}`,
      `SUMMARY:${escapeIcsText(e.title)}`,
    );
    const desc = eventDescription(e);
    if (desc) lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
