-- Migration: permissions granulaires par capacité (sans rôle gérant)
-- Created: 2026-08-20
--
-- Chaque capacité (1/0) autorise une action précise à un bénévole sans lui
-- donner le rôle gérant. Le rôle gérant conserve TOUS les droits (dont la
-- suppression de bénévoles et la gestion des permissions, qui restent
-- exclusives au gérant).

ALTER TABLE volunteers ADD COLUMN can_manage_events INTEGER NOT NULL DEFAULT 0; -- créer/modifier/supprimer événements
ALTER TABLE volunteers ADD COLUMN can_add_clients INTEGER NOT NULL DEFAULT 0;    -- créer des clients (+ import)
ALTER TABLE volunteers ADD COLUMN can_edit_clients INTEGER NOT NULL DEFAULT 0;   -- modifier des clients
ALTER TABLE volunteers ADD COLUMN can_delete_clients INTEGER NOT NULL DEFAULT 0; -- supprimer des clients
ALTER TABLE volunteers ADD COLUMN can_send_mail INTEGER NOT NULL DEFAULT 0;      -- envois groupés
ALTER TABLE volunteers ADD COLUMN can_add_volunteer INTEGER NOT NULL DEFAULT 0;  -- ajouter des bénévoles
