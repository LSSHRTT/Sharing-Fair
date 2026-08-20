-- Migration: rôle gérant, permissions par onglet, jeton d'abonnement calendrier
-- Created: 2026-08-20
--
-- role               : 'gerant' | 'benevole' — le gérant voit tout et gère l'équipe.
-- access_calendrier  : 1 = l'onglet Calendrier est visible pour ce bénévole.
-- access_clients     : 1 = l'onglet Clients est visible.
-- access_equipe      : 1 = l'onglet Équipe (annuaire) est visible.
-- feed_token         : jeton secret du lien d'abonnement calendrier (généré côté app).

ALTER TABLE volunteers ADD COLUMN role TEXT NOT NULL DEFAULT 'benevole';
ALTER TABLE volunteers ADD COLUMN access_calendrier INTEGER NOT NULL DEFAULT 1;
ALTER TABLE volunteers ADD COLUMN access_clients INTEGER NOT NULL DEFAULT 1;
ALTER TABLE volunteers ADD COLUMN access_equipe INTEGER NOT NULL DEFAULT 1;
ALTER TABLE volunteers ADD COLUMN feed_token TEXT;

-- Le plus ancien compte devient gérant par défaut.
UPDATE volunteers
   SET role = 'gerant'
 WHERE id = (SELECT MIN(id) FROM volunteers);
