-- Migration: chat d'équipe
-- Created: 2026-09-08
--
-- messages : conversations entre bénévoles de l'équipe

CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id   INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  content     TEXT,
  image       TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);