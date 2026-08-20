-- Migration: notifications internes (cloche en haut de page)
-- Created: 2026-08-20
--
-- notifications     : journal des ajouts (bénévole, événement…)
-- notif_read_at     : horodatage de dernière lecture par bénévole —
--                     non-lus = notifications créées après cette date.

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id   INTEGER REFERENCES volunteers(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,  -- 'volunteer_added' | 'event_added'
  label      TEXT NOT NULL,  -- texte affiché, ex. "« Béhuard » ajouté au calendrier"
  href       TEXT,           -- lien direct vers l'objet concerné
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE volunteers ADD COLUMN notif_read_at TEXT;
