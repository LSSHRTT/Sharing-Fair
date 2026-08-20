-- Migration: événements du calendrier partagé (ventes, crèches de Noël…)
-- Created: 2026-08-20
--
-- Un événement peut durer plusieurs jours (start_date → end_date) et porte les
-- informations de l'ordre du jour : horaires, bénévoles engagées (texte libre,
-- toutes ne sont pas sur l'app), personne contact et notes (réservation de
-- véhicule, relances à faire…).

CREATE TABLE IF NOT EXISTS events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  start_date      TEXT NOT NULL,  -- YYYY-MM-DD
  end_date        TEXT NOT NULL,  -- YYYY-MM-DD (>= start_date ; même jour si ponctuel)
  hours           TEXT,           -- ex. "14h à 18h", "toute la journée"
  volunteers_text TEXT,           -- ex. "Marta, Michelle, Geneviève B."
  contact         TEXT,           -- ex. "Marta — confirmation + attente feuille inscription"
  notes           TEXT,           -- ex. "réserver le véhicule RENAULT 9 PLACES"
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date   ON events(end_date);
