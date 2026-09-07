# Plan — Sharing Fair

## Suivi des heures effectuées (2026-09-07)

### Fonctionnalité
Chaque bénévole présent peut déclarer le nombre d'heures effectuées chaque jour.
Les gérants valident ensuite ces heures depuis la vue calendrier du jour.

### Migration
- `migrations/0009_presence_hours.sql` : ajout des colonnes `hours`, `hours_verified`, `verified_by`, `verified_at` sur la table `presences`.

### Backend (`src/lib/volunteers.ts`)
- Type `PresenceWithName` étendu avec les champs heures/validation.
- `listPresencesBetween` : requête SQL mise à jour.
- `setHours(db, volunteerId, date, hours)` : déclare les heures ; réinitialise la validation si le montant change.
- `verifyHours(db, volunteerId, date, gerantId, verified)` : valide ou invalide les heures (gérant uniquement).

### UI (`src/pages/calendrier/[date].astro`)
- **Bénévole** : champ numérique (step 0.25, 0–24h) visible uniquement si statut = `present`. Désactivé après validation.
- **Gérant** : bouton ✓ vert sur chaque ligne de bénévole ayant des heures non validées. Badge « Validé » affiché après approbation.
- Toasts succès/erreur ajoutés pour les actions heures.

### Règles métier
- Une présence doit exister avant de pouvoir saisir des heures.
- Modifier les heures réinitialise automatiquement le statut de validation.
- Seul un gérant peut valider ; la validation est horodatée et signée par l'ID du gérant.