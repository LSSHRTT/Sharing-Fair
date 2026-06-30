# Sharing Fair — Site de gestion boutique

**Date** : 2026-06-30
**Statut** : Design validé
**Auteur** : Kimchi (assistant IA) avec LSSHRT

## Contexte et objectifs

Sharing Fair est une boutique physique qui a besoin d'un petit site de gestion accessible depuis n'importe où (en boutique, à distance). Ce site doit permettre de gérer les fiches clients : créer, consulter, modifier, supprimer.

L'objectif de cette première version est de poser des fondations propres — un système client fonctionnel et bien structuré — sur lequel ajouter plus tard d'autres modules (caisse, stock, rendez-vous, etc.).

## Hors-périmètre (YAGNI)

Cette version ne couvre **pas** :

- L'authentification / connexion (à ajouter plus tard, RGPD en tête)
- La gestion des produits / stock / commandes
- La caisse / paiement
- Les rendez-vous
- Les exports CSV / PDF
- Le multi-boutique
- L'envoi d'emails / SMS
- Le tableau de bord analytique avancé

## Contraintes

- **Hébergement** : Cloudflare Pages (gratuit, illimité pour un site de cette taille)
- **Base de données** : Cloudflare D1 (SQLite distribué, 5 Go gratuits)
- **Domaine** : domaine personnalisé à brancher dans le dashboard Cloudflare
- **Déploiement** : automatique sur `git push` vers `main`
- **Langue** : interface en français
- **Responsive** : utilisable sur mobile et tablette (vendeurs en boutique)

## Décisions techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Framework frontend | **Astro** | SSR/SSG, Tailwind intégré, léger, rapide |
| Style | **Tailwind CSS** | Pas de CSS à maintenir à la main, design system cohérent |
| API | **Hono** dans Pages Functions | Microframework TypeScript, parfait pour Workers |
| Validation | **Zod** | Schémas TS, validation côté serveur |
| DB | **Cloudflare D1** | SQL, gratuit, edge, pas de froid start |
| Déploiement | **Cloudflare Pages** | `git push` → déploiement auto |

## Modèle de données

### Table `clients`

```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  birth_date TEXT,           -- ISO YYYY-MM-DD
  preferences TEXT,          -- texte libre, préférences d'achat
  tags TEXT,                 -- JSON array: '["VIP","Newsletter"]'
  notes TEXT,                -- notes libres
  created_at TEXT NOT NULL,  -- ISO timestamp
  updated_at TEXT NOT NULL   -- ISO timestamp
);

CREATE INDEX idx_clients_last_name ON clients(last_name);
CREATE INDEX idx_clients_email ON clients(email);
```

## Routes & pages

| Route | Type | Description |
|---|---|---|
| `/` | SSR | Dashboard : nb total de clients, 5 derniers ajoutés, recherche rapide |
| `/clients` | SSR | Liste paginée (20 par page) avec recherche (nom/email/téléphone) et filtre par tag |
| `/clients/nouveau` | SSR | Formulaire de création |
| `/clients/[id]` | SSR | Fiche client détaillée + boutons Modifier/Supprimer |
| `/clients/[id]/modifier` | SSR | Formulaire d'édition (pré-rempli) |

Toutes les pages partagent un layout : sidebar à gauche, header avec logo et nom "Sharing Fair", zone principale.

## API REST

Toutes les réponses : `{ ok: true, data: ... }` ou `{ ok: false, error: "..." }`.

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/clients?q=&tag=&page=` | Liste filtrée et paginée |
| `POST` | `/api/clients` | Créer un client (body validé par Zod) |
| `GET` | `/api/clients/:id` | Détail d'un client |
| `PUT` | `/api/clients/:id` | Mise à jour complète |
| `DELETE` | `/api/clients/:id` | Suppression |
| `GET` | `/api/clients/tags` | Liste des tags distincts (pour alimenter le filtre) |

Codes HTTP : 200/201 en succès, 400 pour validation, 404 si introuvable, 500 pour erreur serveur.

## Design visuel

- **Couleur principale** : coral `#FF6B4A` (chaleureux, évoque le partage)
- **Couleur secondaire** : gris foncé `#1F2937` pour le texte
- **Fond** : blanc `#FFFFFF` + gris clair `#F9FAFB` pour les zones de repos
- **Typo** : Inter (sans-serif, lisible, support des caractères français)
- **Composants** : cartes avec ombre légère, badges colorés pour les tags, boutons arrondis
- **Layout** : sidebar à gauche (Dashboard, Clients), header sticky, contenu principal
- **Responsive** : sidebar repliable sur mobile, formulaires pleine largeur

## Architecture des fichiers

```
/
├── astro.config.mjs           # config Astro + intégration Cloudflare
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
├── wrangler.toml              # config Cloudflare (binding D1)
├── README.md                  # instructions install + deploy
├── .gitignore
├── migrations/
│   └── 0001_create_clients.sql
├── functions/
│   └── api/
│       ├── [[path]].ts        # route catch-all Hono
│       └── lib/
│           ├── db.ts          # helpers D1
│           ├── schemas.ts     # schémas Zod
│           └── response.ts    # helpers de réponse JSON
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # layout principal (sidebar + header)
│   ├── components/
│   │   ├── Sidebar.astro
│   │   ├── Header.astro
│   │   ├── ClientCard.astro
│   │   ├── ClientForm.astro
│   │   └── TagBadge.astro
│   ├── pages/
│   │   ├── index.astro        # dashboard
│   │   └── clients/
│   │       ├── index.astro    # liste
│   │       ├── nouveau.astro  # création
│   │       └── [id]/
│   │           ├── index.astro   # détail
│   │           └── modifier.astro
│   └── styles/
│       └── global.css         # imports Tailwind + Inter
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-30-sharing-fair-management-design.md
```

## Flux de déploiement

1. Code pushé sur `main` du repo GitHub
2. Cloudflare Pages détecte le push via GitHub App
3. Build automatique (`npm install && npm run build`)
4. Migration D1 appliquée (`wrangler d1 migrations apply`)
5. Site live sur `https://sharing-fair.tondomaine`

## Gestion d'erreurs

- **Formulaires** : erreurs Zod affichées sous chaque champ en coral
- **404 client** : page dédiée avec lien retour à la liste
- **Erreur serveur** : message générique + log côté Cloudflare (à voir dans le dashboard)
- **Toast de confirmation** : "Client créé", "Client modifié", "Client supprimé"

## Tests manuels (MVP)

Pour cette première version, on vérifie en navigateur que :

1. La home charge et affiche 0 client (DB vide)
2. On peut créer un client avec tous les champs
3. On le voit dans la liste
4. La recherche le retrouve
5. On peut le modifier
6. On peut le supprimer
7. Le filtre par tag fonctionne
8. La page est utilisable sur mobile

L'automatisation des tests (Vitest / Playwright) est hors-périmètre pour l'instant — à ajouter dans une version ultérieure.

## Critères de succès

- Le site est accessible en HTTPS sur le domaine personnalisé
- On peut créer, lire, modifier, supprimer un client
- La liste permet recherche par nom/email/téléphone et filtre par tag
- Le design est propre, moderne, responsive
- Le déploiement est automatique sur `git push`
- Tous les commits sont poussés sur le repo GitHub `LSSHRT/Sharing-Fair`
- README explique comment cloner, installer localement, configurer le binding D1, déployer
