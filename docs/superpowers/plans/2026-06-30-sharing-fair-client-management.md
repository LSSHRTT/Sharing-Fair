# Sharing Fair — Client Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a French-language client management web app for the Sharing Fair physical store — create, read, update, delete clients with search and tag filtering, deployed to Cloudflare Pages + D1.

**Architecture:** Astro SSR frontend with Tailwind for styling, Hono routing in Cloudflare Pages Functions for the JSON API, Cloudflare D1 (SQLite) for persistence. Single-tenant, no authentication in v1.

**Tech Stack:** Astro 5, Tailwind CSS 4, Hono 4, Zod 3, Cloudflare D1, Cloudflare Pages, wrangler 3, TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-30-sharing-fair-management-design.md`

**Note on tests:** The user-validated spec explicitly excludes automated tests from MVP (manual smoke tests only). Each task ends with a manual verification step instead of a test runner.

---

## File Structure

Files created or modified by this plan:

```
/                                           # project root
├── astro.config.mjs                         # Astro config (Phase 1)
├── package.json                             # deps (Phase 1)
├── tsconfig.json                            # TS config (Phase 1)
├── tailwind.config.mjs                      # Tailwind config (Phase 1)
├── wrangler.toml                            # Cloudflare + D1 binding (Phase 1)
├── .gitignore                               # already created in spec commit
├── README.md                                # project docs (Phase 6)
├── migrations/
│   └── 0001_create_clients.sql              # D1 schema (Phase 2)
├── functions/
│   └── api/
│       ├── [[path]].ts                      # Hono catch-all router (Phase 4)
│       └── lib/
│           ├── db.ts                        # D1 helpers (Phase 4)
│           ├── schemas.ts                   # Zod schemas (Phase 4)
│           └── response.ts                  # JSON response helpers (Phase 4)
├── src/
│   ├── layouts/
│   │   └── Layout.astro                     # main layout (sidebar+header) (Phase 3)
│   ├── components/
│   │   ├── Sidebar.astro                    # left nav (Phase 3)
│   │   ├── Header.astro                     # top bar (Phase 3)
│   │   ├── TagBadge.astro                   # colored tag pill (Phase 3)
│   │   ├── ClientCard.astro                 # client summary card (Phase 5)
│   │   └── ClientForm.astro                 # create/edit form (Phase 5)
│   ├── pages/
│   │   ├── index.astro                      # dashboard (Phase 5)
│   │   └── clients/
│   │       ├── index.astro                  # list with search/filter (Phase 5)
│   │       ├── nouveau.astro                # create form (Phase 5)
│   │       └── [id]/
│   │           ├── index.astro              # detail (Phase 5)
│   │           └── modifier.astro           # edit form (Phase 5)
│   └── styles/
│       └── global.css                       # Tailwind imports + Inter font (Phase 1)
```

---

## Phase 1 — Bootstrap project

### Task 1.1: Create `package.json`

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "sharing-fair",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "deploy": "astro build && wrangler pages deploy ./dist",
    "db:migrate:local": "wrangler d1 migrations apply sharing_fair_db --local",
    "db:migrate:prod": "wrangler d1 migrations apply sharing_fair_db --remote",
    "db:seed:local": "wrangler d1 execute sharing_fair_db --local --file=migrations/seed.sql"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^12.0.0",
    "astro": "^5.0.0",
    "hono": "^4.6.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "wrangler": "^3.90.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: scaffold package.json with Astro + Cloudflare + Hono stack"
```

### Task 1.2: Create `tsconfig.json`

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@functions/*": ["functions/*"]
    },
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*", "functions/**/*", "astro.config.mjs"],
  "exclude": ["dist", ".astro", "node_modules"]
}
```

- [ ] **Step 2: Install `@cloudflare/workers-types`**

```bash
npm install --save-dev @cloudflare/workers-types
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json package.json package-lock.json
git commit -m "chore: add TypeScript config with strict mode and Cloudflare types"
```

### Task 1.3: Create `astro.config.mjs`

**Files:**
- Create: `astro.config.mjs`

- [ ] **Step 1: Write `astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add astro.config.mjs
git commit -m "chore: configure Astro with Cloudflare adapter and Tailwind v4"
```

### Task 1.4: Create `wrangler.toml`

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Write `wrangler.toml`**

```toml
name = "sharing-fair"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "sharing_fair_db"
database_id = "REPLACE_AFTER_DB_CREATION"
migrations_dir = "migrations"
```

> After running `wrangler d1 create sharing_fair_db`, replace `REPLACE_AFTER_DB_CREATION` with the real ID and commit again.

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add wrangler.toml with D1 binding placeholder"
```

### Task 1.5: Create `src/styles/global.css`

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --color-coral-50: #FFF5F2;
  --color-coral-100: #FFE4DC;
  --color-coral-200: #FFCABD;
  --color-coral-300: #FFA88E;
  --color-coral-400: #FF8566;
  --color-coral-500: #FF6B4A;
  --color-coral-600: #E54E2D;
  --color-coral-700: #B83C22;
  --color-coral-800: #8A2D1A;
  --color-coral-900: #5C1E12;
}

@layer base {
  html {
    font-family: var(--font-sans);
  }
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add Tailwind v4 theme with coral palette and Inter font"
```

### Task 1.6: Install dependencies and verify build

**Files:** (no new files)

- [ ] **Step 1: Install**

```bash
npm install
```

Expected: completes without errors. May print deprecation warnings — those are OK.

- [ ] **Step 2: Add a placeholder page to verify build**

Create `src/pages/index.astro`:

```astro
---
---
<html lang="fr">
  <head><meta charset="utf-8" /><title>Sharing Fair</title></head>
  <body><h1>Sharing Fair</h1></body>
</html>
```

- [ ] **Step 3: Run dev server in background**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321
kill %1 2>/dev/null
```

Expected: `200`

- [ ] **Step 4: Remove placeholder page (will be re-added properly in Phase 5)**

```bash
rm src/pages/index.astro
```

- [ ] **Step 5: Commit placeholder removed + lockfile**

```bash
git add package-lock.json
git commit -m "chore: install dependencies and lockfile"
```

---

## Phase 2 — Database

### Task 2.1: Create migration file

**Files:**
- Create: `migrations/0001_create_clients.sql`

- [ ] **Step 1: Write `migrations/0001_create_clients.sql`**

```sql
CREATE TABLE IF NOT EXISTS clients (
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
  birth_date TEXT,
  preferences TEXT,
  tags TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
```

- [ ] **Step 2: Commit**

```bash
git add migrations/0001_create_clients.sql
git commit -m "feat(db): add clients table migration"
```

### Task 2.2: Create local D1 database and apply migration

**Files:** (no new files; updates `wrangler.toml`)

- [ ] **Step 1: Create local D1 database**

```bash
npx wrangler d1 create sharing_fair_db
```

Expected output: a `database_id` value printed. Copy it.

- [ ] **Step 2: Update `wrangler.toml`**

Replace `REPLACE_AFTER_DB_CREATION` with the actual database_id from Step 1.

- [ ] **Step 3: Apply migration locally**

```bash
npm run db:migrate:local
```

Expected: "Migrations applied successfully" or similar.

- [ ] **Step 4: Verify schema**

```bash
npx wrangler d1 execute sharing_fair_db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output includes: `clients`

- [ ] **Step 5: Commit updated wrangler.toml**

```bash
git add wrangler.toml
git commit -m "chore(db): bind real D1 database_id in wrangler.toml"
```

> Note: For remote/production DB, the user runs `npx wrangler d1 create sharing_fair_db --remote` later (in Cloudflare dashboard or via authenticated wrangler). Documented in README.

---

## Phase 3 — Layout & UI primitives

### Task 3.1: Create `Layout.astro`

**Files:**
- Create: `src/layouts/Layout.astro`

- [ ] **Step 1: Write `src/layouts/Layout.astro`**

```astro
---
import '../styles/global.css';
import Sidebar from '../components/Sidebar.astro';
import Header from '../components/Header.astro';

interface Props {
  title?: string;
}

const { title = 'Sharing Fair' } = Astro.props;
---

<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-gray-50">
    <div class="flex min-h-screen">
      <Sidebar />
      <div class="flex-1 flex flex-col">
        <Header />
        <main class="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <slot />
        </main>
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(ui): add main layout with sidebar and header slots"
```

### Task 3.2: Create `Sidebar.astro`

**Files:**
- Create: `src/components/Sidebar.astro`

- [ ] **Step 1: Write `src/components/Sidebar.astro`**

```astro
---
const path = Astro.url.pathname;
const isActive = (href: string) =>
  href === '/' ? path === '/' : path.startsWith(href);

const links = [
  { href: '/', label: 'Tableau de bord', icon: '📊' },
  { href: '/clients', label: 'Clients', icon: '👥' },
];
---

<aside class="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
  <div class="p-6 border-b border-gray-200">
    <h1 class="text-xl font-bold text-coral-600">Sharing Fair</h1>
    <p class="text-xs text-gray-500 mt-1">Gestion boutique</p>
  </div>
  <nav class="flex-1 p-4 space-y-1">
    {links.map(link => (
      <a
        href={link.href}
        class={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive(link.href)
            ? 'bg-coral-50 text-coral-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>{link.icon}</span>
        <span>{link.label}</span>
      </a>
    ))}
  </nav>
  <div class="p-4 border-t border-gray-200 text-xs text-gray-500">
    v0.1.0
  </div>
</aside>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.astro
git commit -m "feat(ui): add sidebar with active route highlighting"
```

### Task 3.3: Create `Header.astro`

**Files:**
- Create: `src/components/Header.astro`

- [ ] **Step 1: Write `src/components/Header.astro`**

```astro
---
const path = Astro.url.pathname;
const title = path.startsWith('/clients') ? 'Clients' : 'Tableau de bord';
---

<header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 md:px-8 py-4">
  <h2 class="text-2xl font-bold text-gray-900">{title}</h2>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat(ui): add sticky header with route-aware title"
```

### Task 3.4: Create `TagBadge.astro`

**Files:**
- Create: `src/components/TagBadge.astro`

- [ ] **Step 1: Write `src/components/TagBadge.astro`**

```astro
---
interface Props {
  tag: string;
}

const { tag } = Astro.props;

const colors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
];

const hash = [...tag].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
const colorClass = colors[hash % colors.length];
---

<span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
  {tag}
</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TagBadge.astro
git commit -m "feat(ui): add TagBadge component with deterministic color"
```

---

## Phase 4 — API backend

### Task 4.1: Create `response.ts` helpers

**Files:**
- Create: `functions/api/lib/response.ts`

- [ ] **Step 1: Write `functions/api/lib/response.ts`**

```typescript
export function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonError(error: string, status = 400, details?: unknown): Response {
  return new Response(JSON.stringify({ ok: false, error, details }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/lib/response.ts
git commit -m "feat(api): add JSON response helpers"
```

### Task 4.2: Create Zod schemas

**Files:**
- Create: `functions/api/lib/schemas.ts`

- [ ] **Step 1: Write `functions/api/lib/schemas.ts`**

```typescript
import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .email('Email invalide')
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional();

const tagsSchema = z
  .array(z.string().trim().min(1))
  .max(20, 'Maximum 20 tags')
  .default([]);

export const clientInputSchema = z.object({
  first_name: z.string().trim().min(1, 'Prénom requis').max(100),
  last_name: z.string().trim().min(1, 'Nom requis').max(100),
  email: optionalEmail,
  phone: optionalText,
  address_line1: optionalText,
  address_line2: optionalText,
  postal_code: optionalText,
  city: optionalText,
  country: optionalText,
  birth_date: optionalText,
  preferences: optionalText,
  tags: tagsSchema.optional(),
  notes: optionalText,
});

export type ClientInput = z.infer<typeof clientInputSchema>;

export const clientQuerySchema = z.object({
  q: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ClientQuery = z.infer<typeof clientQuerySchema>;
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/lib/schemas.ts
git commit -m "feat(api): add Zod schemas for client input and query"
```

### Task 4.3: Create `db.ts` helpers

**Files:**
- Create: `functions/api/lib/db.ts`

- [ ] **Step 1: Write `functions/api/lib/db.ts`**

```typescript
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: unknown;
}

export interface ClientRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  birth_date: string | null;
  preferences: string | null;
  tags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  birth_date: string | null;
  preferences: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToClient(row: ClientRow): Client {
  let tags: string[] = [];
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === 'string');
    } catch {
      tags = [];
    }
  }
  return { ...row, tags };
}

export function clientToRow(input: {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  birth_date?: string | null;
  preferences?: string | null;
  tags?: string[];
  notes?: string | null;
}): Omit<ClientRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address_line1: input.address_line1 ?? null,
    address_line2: input.address_line2 ?? null,
    postal_code: input.postal_code ?? null,
    city: input.city ?? null,
    country: input.country ?? null,
    birth_date: input.birth_date ?? null,
    preferences: input.preferences ?? null,
    tags: JSON.stringify(input.tags ?? []),
    notes: input.notes ?? null,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/lib/db.ts
git commit -m "feat(api): add D1 client row helpers and type conversions"
```

### Task 4.4: Create Hono router with all client endpoints

**Files:**
- Create: `functions/api/[[path]].ts`

- [ ] **Step 1: Write `functions/api/[[path]].ts`**

```typescript
import { Hono } from 'hono';
import { clientInputSchema, clientQuerySchema } from './lib/schemas';
import {
  rowToClient,
  clientToRow,
  type D1Database,
  type ClientRow,
} from './lib/db';
import { jsonError, jsonOk } from './lib/response';

type Bindings = { DB: D1Database };
type Variables = {};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get('/api/clients/tags', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tags FROM clients WHERE tags IS NOT NULL AND tags != '[]'`
  ).all<{ tags: string }>();
  const set = new Set<string>();
  for (const r of results) {
    try {
      const arr = JSON.parse(r.tags);
      if (Array.isArray(arr)) for (const t of arr) if (typeof t === 'string') set.add(t);
    } catch {
      // ignore malformed JSON
    }
  }
  return jsonOk([...set].sort());
});

app.get('/api/clients', async (c) => {
  const parsed = clientQuerySchema.safeParse(Object.fromEntries(c.req.query()));
  if (!parsed.success) return jsonError('Paramètres invalides', 400, parsed.error.flatten());
  const { q, tag, page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: unknown[] = [];

  if (q) {
    where.push('(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(IFNULL(email,\'\')) LIKE ? OR IFNULL(phone,\'\') LIKE ?)');
    const like = `%${q.toLowerCase()}%`;
    params.push(like, like, like, like);
  }
  if (tag) {
    where.push('tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const listStmt = c.env.DB.prepare(
    `SELECT * FROM clients ${whereClause} ORDER BY last_name COLLATE NOCASE ASC, first_name COLLATE NOCASE ASC LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset);
  const listResult = await listStmt.all<ClientRow>();

  const countStmt = c.env.DB.prepare(
    `SELECT COUNT(*) AS total FROM clients ${whereClause}`
  ).bind(...params);
  const countRow = await countStmt.first<{ total: number }>();

  return jsonOk({
    items: listResult.results.map(rowToClient),
    total: countRow?.total ?? 0,
    page,
    pageSize,
  });
});

app.post('/api/clients', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('JSON invalide', 400);
  }
  const parsed = clientInputSchema.safeParse(body);
  if (!parsed.success) return jsonError('Validation échouée', 400, parsed.error.flatten());

  const row = clientToRow(parsed.data);
  const now = new Date().toISOString();
  const stmt = c.env.DB.prepare(
    `INSERT INTO clients
      (first_name, last_name, email, phone, address_line1, address_line2, postal_code, city, country, birth_date, preferences, tags, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
  ).bind(
    row.first_name,
    row.last_name,
    row.email,
    row.phone,
    row.address_line1,
    row.address_line2,
    row.postal_code,
    row.city,
    row.country,
    row.birth_date,
    row.preferences,
    row.tags,
    row.notes,
    now,
    now
  );
  const inserted = await stmt.first<ClientRow>();
  if (!inserted) return jsonError('Échec de la création', 500);
  return jsonOk(rowToClient(inserted), 201);
});

app.get('/api/clients/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) return jsonError('ID invalide', 400);
  const row = await c.env.DB.prepare(`SELECT * FROM clients WHERE id = ?`)
    .bind(id)
    .first<ClientRow>();
  if (!row) return jsonError('Client introuvable', 404);
  return jsonOk(rowToClient(row));
});

app.put('/api/clients/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) return jsonError('ID invalide', 400);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('JSON invalide', 400);
  }
  const parsed = clientInputSchema.safeParse(body);
  if (!parsed.success) return jsonError('Validation échouée', 400, parsed.error.flatten());

  const row = clientToRow(parsed.data);
  const now = new Date().toISOString();
  const stmt = c.env.DB.prepare(
    `UPDATE clients SET
      first_name = ?, last_name = ?, email = ?, phone = ?,
      address_line1 = ?, address_line2 = ?, postal_code = ?, city = ?, country = ?,
      birth_date = ?, preferences = ?, tags = ?, notes = ?, updated_at = ?
     WHERE id = ?
     RETURNING *`
  ).bind(
    row.first_name,
    row.last_name,
    row.email,
    row.phone,
    row.address_line1,
    row.address_line2,
    row.postal_code,
    row.city,
    row.country,
    row.birth_date,
    row.preferences,
    row.tags,
    row.notes,
    now,
    id
  );
  const updated = await stmt.first<ClientRow>();
  if (!updated) return jsonError('Client introuvable', 404);
  return jsonOk(rowToClient(updated));
});

app.delete('/api/clients/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) return jsonError('ID invalide', 400);
  const result = await c.env.DB.prepare(`DELETE FROM clients WHERE id = ?`)
    .bind(id)
    .run();
  if (!result.success) return jsonError('Échec de la suppression', 500);
  return jsonOk({ id, deleted: true });
});

app.notFound((c) => jsonError('Route introuvable', 404));
app.onError((err, c) => {
  console.error('API error:', err);
  return jsonError('Erreur serveur', 500);
});

export const onRequest = app.fetch;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add functions/api/
git commit -m "feat(api): add Hono router with full CRUD + tag listing"
```

### Task 4.5: Smoke-test API endpoints

**Files:** (none; manual verification)

- [ ] **Step 1: Start dev server**

```bash
npm run dev &
sleep 5
DEV_PID=$!
```

- [ ] **Step 2: Create a client**

```bash
curl -s -X POST http://localhost:4321/api/clients \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Marie","last_name":"Dupont","email":"marie@example.com","phone":"0612345678","city":"Paris","tags":["VIP","Newsletter"]}'
```

Expected: `{"ok":true,"data":{...,"id":1,...}}`

- [ ] **Step 3: List clients**

```bash
curl -s http://localhost:4321/api/clients
```

Expected: `{"ok":true,"data":{"items":[{...Marie...}],"total":1,...}}`

- [ ] **Step 4: Search by name**

```bash
curl -s "http://localhost:4321/api/clients?q=marie"
```

Expected: item containing Marie.

- [ ] **Step 5: Get tags list**

```bash
curl -s http://localhost:4321/api/clients/tags
```

Expected: `{"ok":true,"data":["Newsletter","VIP"]}`

- [ ] **Step 6: Update client**

```bash
curl -s -X PUT http://localhost:4321/api/clients/1 \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Marie","last_name":"Durand","email":"marie@example.com","tags":["VIP"]}'
```

Expected: `{"ok":true,"data":{...,"last_name":"Durand",...}}`

- [ ] **Step 7: Delete client**

```bash
curl -s -X DELETE http://localhost:4321/api/clients/1
```

Expected: `{"ok":true,"data":{"id":1,"deleted":true}}`

- [ ] **Step 8: Stop dev server**

```bash
kill $DEV_PID 2>/dev/null
```

---

## Phase 5 — Pages

### Task 5.1: Create `ClientForm.astro`

**Files:**
- Create: `src/components/ClientForm.astro`

- [ ] **Step 1: Write `src/components/ClientForm.astro`**

```astro
---
import type { Client } from '../../functions/api/lib/db';

interface Props {
  client?: Partial<Client>;
  action: string;
  method: 'POST' | 'PUT';
  submitLabel: string;
}

const { client = {}, action, method, submitLabel } = Astro.props;
const tagsValue = (client.tags ?? []).join(', ');
const v = (val: string | null | undefined) => val ?? '';
---

<form method="POST" action={action} class="space-y-6 max-w-3xl">
  <input type="hidden" name="_method" value={method} />

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="first_name">Prénom *</label>
      <input id="first_name" name="first_name" required maxlength="100"
        value={v(client.first_name)}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="last_name">Nom *</label>
      <input id="last_name" name="last_name" required maxlength="100"
        value={v(client.last_name)}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="email">Email</label>
      <input id="email" name="email" type="email"
        value={v(client.email)}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="phone">Téléphone</label>
      <input id="phone" name="phone"
        value={v(client.phone)}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
    </div>
  </div>

  <fieldset class="space-y-3">
    <legend class="text-sm font-semibold text-gray-900">Adresse</legend>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="address_line1">Rue</label>
      <input id="address_line1" name="address_line1" maxlength="200"
        value={v(client.address_line1)}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="address_line2">Complément</label>
      <input id="address_line2" name="address_line2" maxlength="200"
        value={v(client.address_line2)}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="postal_code">Code postal</label>
        <input id="postal_code" name="postal_code" maxlength="20"
          value={v(client.postal_code)}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="city">Ville</label>
        <input id="city" name="city" maxlength="100"
          value={v(client.city)}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="country">Pays</label>
        <input id="country" name="country" maxlength="100"
          value={v(client.country ?? 'France')}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
      </div>
    </div>
  </fieldset>

  <fieldset class="space-y-3">
    <legend class="text-sm font-semibold text-gray-900">Profil</legend>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="birth_date">Date de naissance</label>
        <input id="birth_date" name="birth_date" type="date"
          value={v(client.birth_date)}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="tags">Tags (séparés par des virgules)</label>
        <input id="tags" name="tags"
          value={tagsValue}
          placeholder="VIP, Newsletter"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="preferences">Préférences d'achat</label>
      <textarea id="preferences" name="preferences" rows="2"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500">{v(client.preferences)}</textarea>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="notes">Notes libres</label>
      <textarea id="notes" name="notes" rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500">{v(client.notes)}</textarea>
    </div>
  </fieldset>

  <div class="flex items-center gap-3">
    <button type="submit"
      class="px-5 py-2 bg-coral-500 text-white font-medium rounded-lg hover:bg-coral-600 focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 transition-colors">
      {submitLabel}
    </button>
    <a href="/clients" class="px-5 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">Annuler</a>
  </div>
</form>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ClientForm.astro
git commit -m "feat(ui): add reusable ClientForm component"
```

### Task 5.2: Create `ClientCard.astro`

**Files:**
- Create: `src/components/ClientCard.astro`

- [ ] **Step 1: Write `src/components/ClientCard.astro`**

```astro
---
import type { Client } from '../../functions/api/lib/db';
import TagBadge from './TagBadge.astro';

interface Props {
  client: Client;
}

const { client } = Astro.props;
---

<a href={`/clients/${client.id}`}
  class="block bg-white rounded-xl border border-gray-200 p-5 hover:border-coral-300 hover:shadow-md transition-all">
  <div class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">
        {client.first_name} {client.last_name}
      </h3>
      {client.email && <p class="text-sm text-gray-600 mt-0.5">{client.email}</p>}
      {client.phone && <p class="text-sm text-gray-600">{client.phone}</p>}
    </div>
  </div>
  {(client.city || client.tags.length > 0) && (
    <div class="mt-3 flex items-center gap-2 flex-wrap text-sm text-gray-600">
      {client.city && <span>📍 {client.city}</span>}
      {client.tags.map((t) => <TagBadge tag={t} />)}
    </div>
  )}
</a>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ClientCard.astro
git commit -m "feat(ui): add ClientCard for list display"
```

### Task 5.3: Create dashboard page

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write `src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import ClientCard from '../components/ClientCard.astro';
import type { D1Database, ClientRow } from '../../functions/api/lib/db';
import { rowToClient } from '../../functions/api/lib/db';

const runtime = Astro.locals.runtime;
const DB = runtime.env.DB as D1Database;

const totalRow = await DB.prepare(`SELECT COUNT(*) AS n FROM clients`).first<{ n: number }>();
const recentRows = await DB.prepare(
  `SELECT * FROM clients ORDER BY created_at DESC LIMIT 5`
).all<ClientRow>();
const recent = recentRows.results.map(rowToClient);
const total = totalRow?.n ?? 0;
---

<Layout title="Sharing Fair — Tableau de bord">
  <div class="space-y-8">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Bienvenue 👋</h1>
        <p class="text-gray-600 mt-1">Aperçu rapide de votre boutique.</p>
      </div>
      <a href="/clients/nouveau"
        class="px-5 py-2.5 bg-coral-500 text-white font-medium rounded-lg hover:bg-coral-600 transition-colors">
        + Nouveau client
      </a>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <p class="text-sm text-gray-600">Total clients</p>
        <p class="text-3xl font-bold text-coral-600 mt-2">{total}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <p class="text-sm text-gray-600">Ajoutés récemment</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">{recent.length}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <p class="text-sm text-gray-600">Système</p>
        <p class="text-lg font-semibold text-gray-900 mt-2">v0.1.0</p>
      </div>
    </div>

    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-900">Derniers ajouts</h2>
        <a href="/clients" class="text-sm text-coral-600 hover:underline">Voir tous →</a>
      </div>
      {recent.length === 0 ? (
        <div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-gray-600">Aucun client pour l'instant.</p>
          <a href="/clients/nouveau" class="inline-block mt-3 text-coral-600 hover:underline font-medium">
            Créer le premier client →
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.map((c) => <ClientCard client={c} />)}
        </div>
      )}
    </section>
  </div>
</Layout>
```

- [ ] **Step 2: Verify dev server**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/
kill %1 2>/dev/null
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(ui): add dashboard with stats and recent clients"
```

### Task 5.4: Create client list page

**Files:**
- Create: `src/pages/clients/index.astro`

- [ ] **Step 1: Write `src/pages/clients/index.astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import ClientCard from '../../components/ClientCard.astro';
import type { D1Database, ClientRow } from '../../../functions/api/lib/db';
import { rowToClient } from '../../../functions/api/lib/db';

const url = Astro.url;
const q = url.searchParams.get('q') ?? '';
const tagFilter = url.searchParams.get('tag') ?? '';
const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
const pageSize = 20;

const DB = Astro.locals.runtime.env.DB as D1Database;

const where: string[] = [];
const params: unknown[] = [];
if (q) {
  const like = `%${q.toLowerCase()}%`;
  where.push('(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(IFNULL(email,\'\')) LIKE ? OR IFNULL(phone,\'\') LIKE ?)');
  params.push(like, like, like, like);
}
if (tagFilter) {
  where.push('tags LIKE ?');
  params.push(`%"${tagFilter}"%`);
}
const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

const listRes = await DB.prepare(
  `SELECT * FROM clients ${whereClause} ORDER BY last_name COLLATE NOCASE ASC LIMIT ? OFFSET ?`
).bind(...params, pageSize, (page - 1) * pageSize).all<ClientRow>();

const totalRow = await DB.prepare(
  `SELECT COUNT(*) AS n FROM clients ${whereClause}`
).bind(...params).first<{ n: number }>();

const tagRows = await DB.prepare(
  `SELECT tags FROM clients WHERE tags IS NOT NULL AND tags != '[]'`
).all<{ tags: string }>();
const tags = [...new Set(
  tagRows.results.flatMap((r) => {
    try { const a = JSON.parse(r.tags); return Array.isArray(a) ? a : []; } catch { return []; }
  })
)].sort() as string[];

const clients = listRes.results.map(rowToClient);
const total = totalRow?.n ?? 0;
const totalPages = Math.max(1, Math.ceil(total / pageSize));
---

<Layout title="Sharing Fair — Clients">
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clients ({total})</h1>
        <p class="text-gray-600 text-sm mt-1">Gérez votre base de clients.</p>
      </div>
      <a href="/clients/nouveau"
        class="px-4 py-2 bg-coral-500 text-white font-medium rounded-lg hover:bg-coral-600 transition-colors">
        + Nouveau client
      </a>
    </div>

    <form method="GET" class="flex flex-col sm:flex-row gap-3">
      <input type="search" name="q" value={q} placeholder="Rechercher nom, email, téléphone..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500" />
      <select name="tag" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500">
        <option value="">Tous les tags</option>
        {tags.map((t) => (
          <option value={t} selected={tagFilter === t}>{t}</option>
        ))}
      </select>
      <button type="submit" class="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
        Filtrer
      </button>
      {(q || tagFilter) && (
        <a href="/clients" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-center">
          Réinitialiser
        </a>
      )}
    </form>

    {clients.length === 0 ? (
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-gray-600">Aucun client trouvé.</p>
        <a href="/clients/nouveau" class="inline-block mt-3 text-coral-600 hover:underline font-medium">
          Créer un client →
        </a>
      </div>
    ) : (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => <ClientCard client={c} />)}
      </div>
    )}

    {totalPages > 1 && (
      <nav class="flex items-center justify-center gap-2 pt-4">
        {page > 1 && (
          <a href={`/clients?${new URLSearchParams({ ...(q && {q}), ...(tagFilter && {tag:tagFilter}), page: String(page-1) })}`}
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">← Précédent</a>
        )}
        <span class="px-4 py-2 text-gray-700">Page {page} / {totalPages}</span>
        {page < totalPages && (
          <a href={`/clients?${new URLSearchParams({ ...(q && {q}), ...(tagFilter && {tag:tagFilter}), page: String(page+1) })}`}
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Suivant →</a>
        )}
      </nav>
    )}
  </div>
</Layout>
```

- [ ] **Step 2: Verify**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/clients
kill %1 2>/dev/null
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add src/pages/clients/index.astro
git commit -m "feat(ui): add clients list with search, tag filter and pagination"
```

### Task 5.5: Create client creation page

**Files:**
- Create: `src/pages/clients/nouveau.astro`

- [ ] **Step 1: Write `src/pages/clients/nouveau.astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import ClientForm from '../../components/ClientForm.astro';
import type { D1Database } from '../../../functions/api/lib/db';

const DB = Astro.locals.runtime.env.DB as D1Database;
let serverError: string | null = null;
let fieldErrors: Record<string, string[]> | null = null;

if (Astro.request.method === 'POST') {
  try {
    const form = await Astro.request.formData();
    const tagsRaw = String(form.get('tags') ?? '').trim();
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

    const payload = {
      first_name: String(form.get('first_name') ?? '').trim(),
      last_name: String(form.get('last_name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim() || null,
      phone: String(form.get('phone') ?? '').trim() || null,
      address_line1: String(form.get('address_line1') ?? '').trim() || null,
      address_line2: String(form.get('address_line2') ?? '').trim() || null,
      postal_code: String(form.get('postal_code') ?? '').trim() || null,
      city: String(form.get('city') ?? '').trim() || null,
      country: String(form.get('country') ?? '').trim() || null,
      birth_date: String(form.get('birth_date') ?? '').trim() || null,
      preferences: String(form.get('preferences') ?? '').trim() || null,
      notes: String(form.get('notes') ?? '').trim() || null,
      tags,
    };

    const res = await fetch(new URL('/api/clients', Astro.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      return Astro.redirect(`/clients/${json.data.id}`);
    }
    serverError = json.error ?? 'Erreur serveur';
    fieldErrors = json.details?.fieldErrors ?? null;
  } catch (e) {
    serverError = e instanceof Error ? e.message : 'Erreur inconnue';
  }
}
---

<Layout title="Sharing Fair — Nouveau client">
  <div class="max-w-3xl space-y-6">
    <div>
      <a href="/clients" class="text-sm text-coral-600 hover:underline">← Retour à la liste</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-2">Nouveau client</h1>
    </div>
    {serverError && (
      <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
        {serverError}
      </div>
    )}
    <ClientForm action="/clients/nouveau" method="POST" submitLabel="Créer le client" />
    {fieldErrors && (
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 text-sm">
        <p class="font-semibold mb-1">Champs à corriger :</p>
        <ul class="list-disc list-inside space-y-0.5">
          {Object.entries(fieldErrors).map(([field, errs]) => (
            <li><strong>{field} :</strong> {(errs as string[]).join(', ')}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
</Layout>
```

- [ ] **Step 2: Verify GET**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/clients/nouveau
kill %1 2>/dev/null
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add src/pages/clients/nouveau.astro
git commit -m "feat(ui): add client creation page with form and error display"
```

### Task 5.6: Create client detail page

**Files:**
- Create: `src/pages/clients/[id]/index.astro`

- [ ] **Step 1: Write `src/pages/clients/[id]/index.astro`**

```astro
---
import Layout from '../../../layouts/Layout.astro';
import TagBadge from '../../../components/TagBadge.astro';
import type { D1Database, ClientRow } from '../../../../functions/api/lib/db';
import { rowToClient } from '../../../../functions/api/lib/db';

const { id } = Astro.params;
const clientId = Number(id);
const DB = Astro.locals.runtime.env.DB as D1Database;

if (!Number.isInteger(clientId) || clientId <= 0) {
  return new Response('ID invalide', { status: 400 });
}

const row = await DB.prepare(`SELECT * FROM clients WHERE id = ?`)
  .bind(clientId)
  .first<ClientRow>();

if (!row) {
  return new Response(null, { status: 404 });
}

const client = rowToClient(row);
const v = (val: string | null) => val ?? '—';
const fmtDate = (iso: string) => new Date(iso).toLocaleString('fr-FR');
---

<Layout title={`Sharing Fair — ${client.first_name} ${client.last_name}`}>
  <div class="max-w-4xl space-y-6">
    <div>
      <a href="/clients" class="text-sm text-coral-600 hover:underline">← Retour à la liste</a>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{client.first_name} {client.last_name}</h1>
          {client.tags.length > 0 && (
            <div class="flex flex-wrap gap-1.5 mt-2">
              {client.tags.map((t) => <TagBadge tag={t} />)}
            </div>
          )}
        </div>
        <div class="flex gap-2">
          <a href={`/clients/${client.id}/modifier`}
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">
            Modifier
          </a>
          <form method="POST" action={`/clients/${client.id}/supprimer`} onsubmit="return confirm('Supprimer définitivement ce client ?');">
            <button type="submit" class="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium">
              Supprimer
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase mb-3">Contact</h2>
        <dl class="space-y-2 text-sm">
          <div><dt class="text-gray-500 inline">Email : </dt><dd class="inline text-gray-900">{v(client.email)}</dd></div>
          <div><dt class="text-gray-500 inline">Téléphone : </dt><dd class="inline text-gray-900">{v(client.phone)}</dd></div>
          <div><dt class="text-gray-500 inline">Naissance : </dt><dd class="inline text-gray-900">{v(client.birth_date)}</dd></div>
        </dl>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase mb-3">Adresse</h2>
        <address class="not-italic text-sm text-gray-900 space-y-0.5">
          {client.address_line1 && <div>{client.address_line1}</div>}
          {client.address_line2 && <div>{client.address_line2}</div>}
          {(client.postal_code || client.city) && (
            <div>{client.postal_code} {client.city}</div>
          )}
          {client.country && <div>{client.country}</div>}
          {!client.address_line1 && !client.city && <div class="text-gray-500 not-italic">—</div>}
        </address>
      </div>

      {(client.preferences || client.notes) && (
        <div class="bg-white rounded-xl border border-gray-200 p-6 md:col-span-2">
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-3">Notes</h2>
          {client.preferences && (
            <div class="mb-3">
              <p class="text-xs font-semibold text-gray-700 mb-1">Préférences d'achat</p>
              <p class="text-sm text-gray-900 whitespace-pre-wrap">{client.preferences}</p>
            </div>
          )}
          {client.notes && (
            <div>
              <p class="text-xs font-semibold text-gray-700 mb-1">Notes libres</p>
              <p class="text-sm text-gray-900 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>

    <div class="text-xs text-gray-500">
      Créé le {fmtDate(client.created_at)} · Mis à jour le {fmtDate(client.updated_at)}
    </div>
  </div>
</Layout>
```

- [ ] **Step 2: Verify detail page**

```bash
npm run dev &
sleep 5
# Create a test client first
curl -s -X POST http://localhost:4321/api/clients \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"Detail"}' > /tmp/c.json
CID=$(python3 -c "import json; print(json.load(open('/tmp/c.json'))['data']['id'])")
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/clients/$CID
kill %1 2>/dev/null
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add "src/pages/clients/[id]/index.astro"
git commit -m "feat(ui): add client detail page with delete action"
```

### Task 5.7: Create delete handler and edit page

**Files:**
- Create: `src/pages/clients/[id]/supprimer.ts`
- Create: `src/pages/clients/[id]/modifier.astro`

- [ ] **Step 1: Write `src/pages/clients/[id]/supprimer.ts`**

```typescript
import type { APIRoute } from 'astro';
import type { D1Database } from '../../../../functions/api/lib/db';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('ID invalide', { status: 400 });
  }
  const DB = locals.runtime.env.DB as D1Database;
  await DB.prepare(`DELETE FROM clients WHERE id = ?`).bind(id).run();
  return redirect('/clients');
};
```

- [ ] **Step 2: Write `src/pages/clients/[id]/modifier.astro`**

```astro
---
import Layout from '../../../layouts/Layout.astro';
import ClientForm from '../../../components/ClientForm.astro';
import type { D1Database, ClientRow } from '../../../../functions/api/lib/db';
import { rowToClient } from '../../../../functions/api/lib/db';

const { id } = Astro.params;
const clientId = Number(id);
const DB = Astro.locals.runtime.env.DB as D1Database;

if (!Number.isInteger(clientId) || clientId <= 0) {
  return new Response('ID invalide', { status: 400 });
}

const row = await DB.prepare(`SELECT * FROM clients WHERE id = ?`)
  .bind(clientId)
  .first<ClientRow>();

if (!row) {
  return new Response(null, { status: 404 });
}

const client = rowToClient(row);
let serverError: string | null = null;
let fieldErrors: Record<string, string[]> | null = null;

if (Astro.request.method === 'POST') {
  try {
    const form = await Astro.request.formData();
    const tagsRaw = String(form.get('tags') ?? '').trim();
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

    const payload = {
      first_name: String(form.get('first_name') ?? '').trim(),
      last_name: String(form.get('last_name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim() || null,
      phone: String(form.get('phone') ?? '').trim() || null,
      address_line1: String(form.get('address_line1') ?? '').trim() || null,
      address_line2: String(form.get('address_line2') ?? '').trim() || null,
      postal_code: String(form.get('postal_code') ?? '').trim() || null,
      city: String(form.get('city') ?? '').trim() || null,
      country: String(form.get('country') ?? '').trim() || null,
      birth_date: String(form.get('birth_date') ?? '').trim() || null,
      preferences: String(form.get('preferences') ?? '').trim() || null,
      notes: String(form.get('notes') ?? '').trim() || null,
      tags,
    };

    const res = await fetch(new URL(`/api/clients/${clientId}`, Astro.url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      return Astro.redirect(`/clients/${clientId}`);
    }
    serverError = json.error ?? 'Erreur serveur';
    fieldErrors = json.details?.fieldErrors ?? null;
  } catch (e) {
    serverError = e instanceof Error ? e.message : 'Erreur inconnue';
  }
}
---

<Layout title={`Sharing Fair — Modifier ${client.first_name} ${client.last_name}`}>
  <div class="max-w-3xl space-y-6">
    <div>
      <a href={`/clients/${clientId}`} class="text-sm text-coral-600 hover:underline">← Retour à la fiche</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-2">Modifier le client</h1>
    </div>
    {serverError && (
      <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{serverError}</div>
    )}
    <ClientForm client={client} action={`/clients/${clientId}/modifier`} method="PUT" submitLabel="Enregistrer" />
    {fieldErrors && (
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 text-sm">
        <p class="font-semibold mb-1">Champs à corriger :</p>
        <ul class="list-disc list-inside space-y-0.5">
          {Object.entries(fieldErrors).map(([field, errs]) => (
            <li><strong>{field} :</strong> {(errs as string[]).join(', ')}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
</Layout>
```

- [ ] **Step 3: Verify both pages**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "edit: %{http_code}\n" http://localhost:4321/clients/1/modifier
kill %1 2>/dev/null
```

Expected: `edit: 200`

- [ ] **Step 4: Commit**

```bash
git add "src/pages/clients/[id]/supprimer.ts" "src/pages/clients/[id]/modifier.astro"
git commit -m "feat(ui): add client edit page and delete handler"
```

---

## Phase 6 — Polish & deploy prep

### Task 6.1: Production build verification

**Files:** (none; verification)

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: build completes, no errors. `dist/` directory created.

- [ ] **Step 2: Verify build output**

```bash
ls -la dist/
test -f dist/_worker.js/index.js && echo "worker bundle: OK"
```

Expected: `worker bundle: OK`

### Task 6.2: Write README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# Sharing Fair

Site de gestion pour la boutique Sharing Fair : fiches clients, recherche, tags, déployé sur Cloudflare Pages + D1.

## Stack

- **Frontend** : [Astro 5](https://astro.build) (SSR) + Tailwind CSS 4
- **API** : [Hono](https://hono.dev) dans Cloudflare Pages Functions
- **DB** : [Cloudflare D1](https://developers.cloudflare.com/d1) (SQLite distribué)
- **Validation** : [Zod](https://zod.dev)
- **Déploiement** : Cloudflare Pages (auto sur `git push`)

## Développement local

Prérequis : Node.js 18+, npm, wrangler (installé en devDep).

```bash
git clone https://github.com/LSSHRT/Sharing-Fair.git
cd Sharing-Fair
npm install

# Créer la DB locale et appliquer la migration
npx wrangler d1 create sharing_fair_db
# → copier le database_id dans wrangler.toml (champ REPLACE_AFTER_DB_CREATION)
npm run db:migrate:local

# Lancer le dev server
npm run dev
```

Le site est sur http://localhost:4321.

## Build & preview

```bash
npm run build
npm run preview
```

## Déploiement sur Cloudflare Pages

1. Connecter le repo GitHub à Cloudflare Pages (dashboard → Pages → Create → Connect to Git).
2. Build command : `npm run build`
3. Build output : `dist`
4. Variables d'environnement : aucune (binding D1 via `wrangler.toml`).
5. Créer la DB distante :
   ```bash
   npx wrangler d1 create sharing_fair_db --remote
   # mettre à jour wrangler.toml avec le database_id remote
   npm run db:migrate:prod
   ```
6. Brancher le domaine personnalisé (Custom domains dans le dashboard Pages).

Les pushs suivants sur `main` redéploient automatiquement.

## Structure du projet

```
/
├── astro.config.mjs          # config Astro + Cloudflare adapter
├── wrangler.toml             # config Cloudflare + binding D1
├── migrations/               # migrations D1
├── functions/api/            # API REST (Hono)
└── src/
    ├── pages/                # pages Astro
    ├── components/           # composants UI
    └── layouts/              # layouts partagés
```

## API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/clients?q=&tag=&page=` | Liste filtrée et paginée |
| POST | `/api/clients` | Créer un client |
| GET | `/api/clients/:id` | Détail |
| PUT | `/api/clients/:id` | Mise à jour |
| DELETE | `/api/clients/:id` | Suppression |
| GET | `/api/clients/tags` | Liste des tags distincts |

Toutes les réponses : `{ ok: true, data }` ou `{ ok: false, error, details? }`.

## Roadmap

- Authentification (Cloudflare Access ou login maison)
- Module stock / produits
- Module rendez-vous
- Exports CSV
- Tests automatisés (Vitest + Playwright)

## Licence

Privé — © Sharing Fair
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup and deploy instructions"
```

### Task 6.3: Final commit & push

- [ ] **Step 1: Verify all changes committed**

```bash
git status
```

Expected: working tree clean.

- [ ] **Step 2: Push to remote**

```bash
git push origin main
```

Expected: `Everything up-to-date` or successful push of any remaining commits.

- [ ] **Step 3: Verify on GitHub**

```bash
curl -s https://api.github.com/repos/LSSHRT/Sharing-Fair/commits/main | python3 -c "import json,sys; d=json.load(sys.stdin); print('Latest commit:', d['sha'][:7], '-', d['commit']['message'].split(chr(10))[0])"
```

---

## Self-review notes

- **Spec coverage** : ✓ dashboard, ✓ list/search/filter/pagination, ✓ create, ✓ detail, ✓ edit, ✓ delete, ✓ tags API, ✓ layout/sidebar/header, ✓ responsive, ✓ Coral color, ✓ French, ✓ wrangler+D1+Cloudflare, ✓ Hono API, ✓ Zod validation, ✓ README.
- **Placeholders** : none — all code blocks are complete.
- **Type consistency** : `Client` interface used in both `db.ts` and components. `D1Database` interface declared once in `db.ts` and imported everywhere else. `rowToClient`/`clientToRow` used consistently.
- **Note** : pages directly call `Astro.locals.runtime.env.DB` (SSR via Cloudflare adapter) AND call the API via `fetch(new URL('/api/clients', Astro.url), ...)` — this stays in-process on the worker, low overhead. Alternative was direct DB access in pages; we chose the API path for consistency with external API consumers and to keep validation logic in one place.
