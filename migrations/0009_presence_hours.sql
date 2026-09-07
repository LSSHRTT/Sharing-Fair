-- Migration: suivi des heures effectuées + validation gérant
-- Created: 2026-09-07
--
-- hours          : nombre d'heures déclarées par le bénévole (NULL = pas encore renseigné)
-- hours_verified : 1 = validé par un gérant, 0 = en attente de validation
-- verified_by    : id du gérant qui a validé (NULL si pas encore validé)
-- verified_at    : date/heure de la validation

ALTER TABLE presences ADD COLUMN hours REAL;
ALTER TABLE presences ADD COLUMN hours_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE presences ADD COLUMN verified_by INTEGER REFERENCES volunteers(id);
ALTER TABLE presences ADD COLUMN verified_at TEXT;

CREATE INDEX IF NOT EXISTS idx_presences_hours_verified ON presences(hours_verified);