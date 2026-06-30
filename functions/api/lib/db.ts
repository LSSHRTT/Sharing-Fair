/// <reference types="@cloudflare/workers-types" />

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
  tags: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client extends Omit<ClientRow, "tags"> {
  tags: string[];
}

export interface ClientInput {
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
}

export function rowToClient(row: ClientRow): Client {
  let tags: string[] = [];
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === "string");
      }
    } catch {
      tags = [];
    }
  }
  return { ...row, tags };
}

export function inputToRow(
  input: ClientInput,
): Omit<ClientRow, "id" | "created_at" | "updated_at"> {
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

export interface ListParams {
  q?: string;
  tag?: string;
  page: number;
  pageSize: number;
}

export interface ListResult {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildWhere(q?: string, tag?: string): { sql: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];

  if (q && q.trim()) {
    const like = `%${q.trim().toLowerCase()}%`;
    where.push(
      "(LOWER(first_name) LIKE ?1 OR LOWER(last_name) LIKE ?1 OR LOWER(IFNULL(email, '')) LIKE ?1 OR IFNULL(phone, '') LIKE ?1 OR LOWER(IFNULL(city, '')) LIKE ?1)",
    );
    params.push(like);
  }
  if (tag && tag.trim()) {
    where.push(`tags LIKE ?${params.length + 1}`);
    params.push(`%"${tag.trim()}"%`);
  }

  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export async function listClients(
  db: D1Database,
  { q, tag, page, pageSize }: ListParams,
): Promise<ListResult> {
  const { sql: whereSql, params } = buildWhere(q, tag);
  const offset = (page - 1) * pageSize;

  const listRes = await db
    .prepare(
      `SELECT * FROM clients ${whereSql}
       ORDER BY last_name COLLATE NOCASE ASC, first_name COLLATE NOCASE ASC
       LIMIT ? OFFSET ?`,
    )
    .bind(...params, pageSize, offset)
    .all<ClientRow>();

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS total FROM clients ${whereSql}`)
    .bind(...params)
    .first<{ total: number }>();

  const total = countRow?.total ?? 0;
  return {
    items: listRes.results.map(rowToClient),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function countClients(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM clients")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function recentClients(
  db: D1Database,
  limit = 5,
): Promise<Client[]> {
  const res = await db
    .prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<ClientRow>();
  return res.results.map(rowToClient);
}

export async function getClient(
  db: D1Database,
  id: number,
): Promise<Client | null> {
  const row = await db
    .prepare("SELECT * FROM clients WHERE id = ?")
    .bind(id)
    .first<ClientRow>();
  return row ? rowToClient(row) : null;
}

export async function createClient(
  db: D1Database,
  input: ClientInput,
): Promise<Client> {
  const row = inputToRow(input);
  const now = new Date().toISOString();
  const inserted = await db
    .prepare(
      `INSERT INTO clients
        (first_name, last_name, email, phone, address_line1, address_line2,
         postal_code, city, country, birth_date, preferences, tags, notes,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
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
      now,
    )
    .first<ClientRow>();

  if (!inserted) throw new Error("Insertion échouée");
  return rowToClient(inserted);
}

export async function updateClient(
  db: D1Database,
  id: number,
  input: ClientInput,
): Promise<Client | null> {
  const row = inputToRow(input);
  const now = new Date().toISOString();
  const updated = await db
    .prepare(
      `UPDATE clients SET
         first_name = ?, last_name = ?, email = ?, phone = ?,
         address_line1 = ?, address_line2 = ?, postal_code = ?, city = ?, country = ?,
         birth_date = ?, preferences = ?, tags = ?, notes = ?, updated_at = ?
       WHERE id = ?
       RETURNING *`,
    )
    .bind(
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
      id,
    )
    .first<ClientRow>();
  return updated ? rowToClient(updated) : null;
}

export async function deleteClient(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const res = await db
    .prepare("DELETE FROM clients WHERE id = ?")
    .bind(id)
    .run();
  return res.success && (res.meta?.changes ?? 0) > 0;
}

export async function listDistinctTags(db: D1Database): Promise<string[]> {
  const res = await db
    .prepare("SELECT tags FROM clients WHERE tags IS NOT NULL AND tags != '[]'")
    .all<{ tags: string }>();
  const set = new Set<string>();
  for (const r of res.results) {
    try {
      const arr = JSON.parse(r.tags);
      if (Array.isArray(arr)) {
        for (const t of arr) {
          if (typeof t === "string" && t.trim()) set.add(t.trim());
        }
      }
    } catch {
      // ignore
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}
