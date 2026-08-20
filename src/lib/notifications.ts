/// <reference types="@cloudflare/workers-types" />

/**
 * Notifications internes — cloche en haut de page.
 * Journal partagé par toute l'équipe ; chaque bénévole a son horodatage
 * de lecture (notifications.notif_read_at).
 */

export type NotificationType = 'volunteer_added' | 'event_added';

export interface NotificationRow {
  id: number;
  actor_id: number | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
  type: NotificationType;
  label: string;
  href: string | null;
  created_at: string;
}

export async function notify(
  db: D1Database,
  actorId: number | null,
  type: NotificationType,
  label: string,
  href: string | null = null,
  runtime?: { env: Record<string, unknown>; ctx: { waitUntil(p: Promise<unknown>): void } },
): Promise<void> {
  await db
    .prepare('INSERT INTO notifications (actor_id, type, label, href, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(actorId, type, label, href, new Date().toISOString())
    .run();

  // Push « tickle » vers les téléphones des autres bénévoles — en tâche de
  // fond (waitUntil) : jamais bloquant ni cassant pour la requête courante.
  if (runtime?.ctx) {
    const { sendPushTickle } = await import('./push');
    runtime.ctx.waitUntil(
      sendPushTickle(db, runtime.env as Record<string, string>, actorId).catch(() => {}),
    );
  }
}

export async function listRecentNotifications(db: D1Database, limit = 20): Promise<NotificationRow[]> {
  const res = await db
    .prepare(
      `SELECT n.id, n.actor_id, v.first_name AS actor_first_name, v.last_name AS actor_last_name,
              n.type, n.label, n.href, n.created_at
       FROM notifications n
       LEFT JOIN volunteers v ON v.id = n.actor_id
       ORDER BY n.created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<NotificationRow>();
  return res.results;
}

export async function countUnread(db: D1Database, volunteerId: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM notifications
       WHERE created_at > COALESCE((SELECT notif_read_at FROM volunteers WHERE id = ?), '1970-01-01')`,
    )
    .bind(volunteerId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function markAllRead(db: D1Database, volunteerId: number): Promise<void> {
  await db
    .prepare('UPDATE volunteers SET notif_read_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), volunteerId)
    .run();
}
