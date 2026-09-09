/// <reference types="@cloudflare/workers-types" />

/**
 * Chat d'équipe — Sharing Fair.
 * Messages simples entre bénévoles, ordonnés par date de création.
 */

export interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  first_name: string;
  last_name: string;
  photo: string | null;
}

const MESSAGE_COLUMNS = `m.id, m.sender_id, m.content, m.created_at, v.first_name, v.last_name, v.photo`;

/** Récupère les N derniers messages du chat (plus récents en dernier). */
export async function listMessages(
  db: D1Database,
  limit = 50,
): Promise<ChatMessage[]> {
  const res = await db
    .prepare(
      `SELECT ${MESSAGE_COLUMNS}
       FROM messages m
       JOIN volunteers v ON v.id = m.sender_id
       ORDER BY m.created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<ChatMessage>();
  return res.results.reverse();
}

/** Envoie un message dans le chat. Retourne le message créé avec les infos auteur. */
export async function sendMessage(
  db: D1Database,
  senderId: number,
  content: string,
): Promise<ChatMessage | null> {
  const now = new Date().toISOString();
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) return null;

  const inserted = await db
    .prepare(
      `INSERT INTO messages (sender_id, content, created_at) VALUES (?, ?, ?)
       RETURNING id, sender_id, content, created_at`,
    )
    .bind(senderId, trimmed, now)
    .first<{ id: number; sender_id: number; content: string; created_at: string }>();

  if (!inserted) return null;

  // Récupérer les infos auteur pour le retour immédiat
  const author = await db
    .prepare('SELECT first_name, last_name, photo FROM volunteers WHERE id = ?')
    .bind(senderId)
    .first<{ first_name: string; last_name: string; photo: string | null }>();

  if (!author) return null;

  return {
    id: inserted.id,
    sender_id: inserted.sender_id,
    content: inserted.content,
    created_at: inserted.created_at,
    first_name: author.first_name,
    last_name: author.last_name,
    photo: author.photo,
  };
}