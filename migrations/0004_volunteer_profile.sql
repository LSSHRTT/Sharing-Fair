-- Migration: profil bénévole — coordonnées, photo, mot de passe personnalisé
-- Created: 2026-08-20
--
-- email / phone : coordonnées du bénévole (facultatives).
-- photo         : photo de profil en data URL (JPEG redimensionné côté client,
--                 quelques dizaines de Ko — suffisant pour une petite équipe).
-- password      : mot de passe personnalisé. NULL → la date de naissance
--                 fait toujours office de mot de passe (rétrocompatibilité).

ALTER TABLE volunteers ADD COLUMN email TEXT;
ALTER TABLE volunteers ADD COLUMN phone TEXT;
ALTER TABLE volunteers ADD COLUMN photo TEXT;
ALTER TABLE volunteers ADD COLUMN password TEXT;
