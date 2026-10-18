import { createClient } from '@libsql/client/web'

let client: ReturnType<typeof createClient> | null = null
let asD1: unknown = null

export function getTursoClient() {
  if (client) return client
  const url = (globalThis as any).process?.env?.TURSO_DATABASE_URL as string | undefined
  const authToken = (globalThis as any).process?.env?.TURSO_AUTH_TOKEN as string | undefined
  if (!url || !authToken) throw new Error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN manquants')
  client = createClient({ url, authToken })
  return client
}

export function getTursoAsD1() {
  if (asD1) return asD1 as D1Database
  const c = getTursoClient()
  const adapt = {
    prepare(sql: string) {
      let args: unknown[] = []
      const stmt = {
        bind(...a: unknown[]) { args = a; return stmt },
        async run() {
          const r = await c.execute({ sql, args: args as any })
          return { meta: { changes: r.rowsAffected ?? 0 } }
        },
        async all<T>() {
          const r = await c.execute({ sql, args: args as any })
          return { results: r.rows as T[] }
        },
        async first<T>() {
          const r = await c.execute({ sql, args: args as any })
          return (r.rows[0] as T) ?? null
        },
      }
      return stmt
    },
    async batch(stmts: any[]) {
      for (const s of stmts) await s.run()
      return []
    },
  }
  asD1 = adapt as unknown as D1Database
  return asD1 as D1Database
}
