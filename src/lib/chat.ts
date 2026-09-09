/// <reference types="@cloudflare/workers-types" />

/**
 * Chat d'équipe — Sharing Fair.
 * Messages simples entre bénévoles, ordonnés par date de création.
 */

export interface ChatMessage {
  id: number;
  sender_id: number;
  content: string | null;
  image: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  photo: string | null;
}

const MESSAGE_COLUMNS = `m.id, m.sender_id, m.content, m.image, m.created_at, v.first_name, v.last_name, v.photo`;

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

/** Supprime un message du chat. Seul l'auteur peut supprimer son propre message. */
export async function deleteMessage(
  db: D1Database,
  messageId: number,
  volunteerId: number,
): Promise<boolean> {
  const res = await db
    .prepare('DELETE FROM messages WHERE id = ? AND sender_id = ?')
    .bind(messageId, volunteerId)
    .run();
  return res.success && (res.meta?.changes ?? 0) > 0;
}

/** Envoie un message dans le chat (texte et/ou image). Retourne le message créé avec les infos auteur. */
export async function sendMessage(
  db: D1Database,
  senderId: number,
  content: string | null,
  image: string | null,
): Promise<ChatMessage | null> {
  const now = new Date().toISOString();
  const trimmedContent = content?.trim() || null;
  if (!trimmedContent && !image) return null;
  if (trimmedContent && trimmedContent.length > 2000) return null;

  const inserted = await db
    .prepare(
      `INSERT INTO messages (sender_id, content, image, created_at) VALUES (?, ?, ?, ?)
       RETURNING id, sender_id, content, image, created_at`,
    )
    .bind(senderId, trimmedContent, image, now)
    .first<{ id: number; sender_id: number; content: string | null; image: string | null; created_at: string }>();

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
    image: inserted.image,
    created_at: inserted.created_at,
    first_name: author.first_name,
    last_name: author.last_name,
    photo: author.photo,
  };
}