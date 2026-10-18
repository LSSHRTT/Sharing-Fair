import { getTursoAsD1 } from './turso.js'

export function getEnv(locals: any): Env {
  const runtimeEnv = (locals as any)?.runtime?.env as Env | undefined
  if (runtimeEnv?.DB) return runtimeEnv
  // Vercel fallback
  if ((globalThis as any).process?.env?.TURSO_DATABASE_URL) {
    const e = (globalThis as any).process.env
    return {
      DB: getTursoAsD1(),
      AUTH_SECRET: e.AUTH_SECRET ?? '',
      VAPID_PUBLIC_KEY: e.VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_JWK: e.VAPID_PRIVATE_JWK,
      VAPID_SUBJECT: e.VAPID_SUBJECT,
    } as unknown as Env
  }
  if (runtimeEnv) return runtimeEnv
  throw new Error('Env DB non disponible (ni Cloudflare runtime ni TURSO_DATABASE_URL)')
}
