-- Migration: authentification multi-bénévoles + calendrier partagé de présences
-- Created: 2026-08-20
--
-- volunteers : les bénévoles de la boutique. La date de naissance fait office
--              de mot de passe (système simple pour une petite équipe interne).
-- presences  : statut déclaré par chaque bénévole, un par jour
--              (present / maybe / absent).

CREATE TABLE IF NOT EXISTS volunteers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  birth_date  TEXT NOT NULL,  -- format YYYY-MM-DD
  created_at  TEXT NOT NULL
);

-- Un seul compte par couple prénom + nom (insensible à la casse).
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteers_full_name
  ON volunteers(first_name COLLATE NOCASE, last_name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS presences (
  volunteer_id INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,  -- format YYYY-MM-DD
  status       TEXT NOT NULL CHECK (status IN ('present', 'maybe', 'absent')),
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (volunteer_id, date)
);

CREATE INDEX IF NOT EXISTS idx_presences_date ON presences(date);
