-- ⚠️ NE PAS SUPPRIMER CE FICHIER — migration « placeholder » sans effet.
--
-- Ce fichier a historiquement été appliqué par `wrangler d1 migrations apply`
-- (tout .sql du dossier migrations/ est traité comme une migration). Le garder
-- présent évite une erreur wrangler « migration appliquée mais absente ».
--
-- Les données de démonstration pour le développement local ne vivent PAS ici
-- (elles effaceraient les données de production) mais dans :
--     scripts/seed.sql   →  exécuté via `npm run db:seed:local`
SELECT 1;
