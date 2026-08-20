/// <reference types="@cloudflare/workers-types" />

/**
 * Web Push — notifications sur le téléphone (FCM Android, Apple Push…).
 *
 * Stratégie « tickle » : on envoie un push SANS payload (juste signé VAPID),
 * le service worker du navigateur se réveille et récupère le détail de la
 * dernière notification via l'API (authentifiée par le cookie de session).
 * → pas besoin d'implémenter le chiffrement de payload (RFC 8291).
 */

export interface PushSubscriptionRow {
  id: number;
  volunteer_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// ---------------------------------------------------------------- DB

export async function saveSubscription(
  db: D1Database,
  volunteerId: number,
  sub: { endpoint: string; p256dh: string; auth: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO push_subscriptions (volunteer_id, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET
         volunteer_id = excluded.volunteer_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`,
    )
    .bind(volunteerId, sub.endpoint, sub.p256dh, sub.auth, new Date().toISOString())
    .run();
}

export async function removeSubscription(db: D1Database, endpoint: string): Promise<void> {
  await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
}

export async function listOtherSubscriptions(
  db: D1Database,
  excludeVolunteerId: number | null,
): Promise<PushSubscriptionRow[]> {
  const res = await db
    .prepare(
      excludeVolunteerId === null
        ? 'SELECT * FROM push_subscriptions'
        : 'SELECT * FROM push_subscriptions WHERE volunteer_id != ?',
    )
    .bind(...(excludeVolunteerId === null ? [] : [excludeVolunteerId]))
    .all<PushSubscriptionRow>();
  return res.results;
}

// ---------------------------------------------------------------- VAPID

function b64url(bytes: Uint8Array | ArrayBuffer): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const b64urlText = (s: string) => b64url(new TextEncoder().encode(s));

/** JWT VAPID (ES256) signé avec la clé privée du serveur. */
async function vapidJwt(endpoint: string, privateJwk: JsonWebKey, subject: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = b64urlText(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64urlText(
    JSON.stringify({
      aud,
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
      sub: subject,
    }),
  );
  const data = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(data),
  );
  // WebCrypto retourne la signature brute r||s (64 octets) — exactement ce que JWS attend.
  return `${data}.${b64url(sig)}`;
}

export function pushConfigured(env: {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_JWK?: string;
  VAPID_SUBJECT?: string;
}): boolean {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_JWK && env.VAPID_SUBJECT);
}

/**
 * Envoie un « tickle » (push sans payload) vers toutes les abonnements
 * (sauf ceux de l'auteur de l'action). Les abonnements expirés (404/410)
 * sont supprimés de la base. Ne lève jamais d'erreur.
 */
export async function sendPushTickle(
  db: D1Database,
  env: { VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_JWK?: string; VAPID_SUBJECT?: string },
  excludeVolunteerId: number | null,
): Promise<void> {
  try {
    if (!pushConfigured(env)) return;
    const privateJwk = JSON.parse(env.VAPID_PRIVATE_JWK!) as JsonWebKey;
    const subject = env.VAPID_SUBJECT!;
    const publicKey = env.VAPID_PUBLIC_KEY!;

    const subs = await listOtherSubscriptions(db, excludeVolunteerId);
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const jwt = await vapidJwt(sub.endpoint, privateJwk, subject);
          const res = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              Authorization: `vapid t=${jwt},k=${publicKey}`,
              TTL: '86400',
              Urgency: 'high',
              'Content-Length': '0',
            },
          });
          // Abonnement mort (navigateur désinstallé / permission révoquée) → nettoyage.
          if (res.status === 404 || res.status === 410) {
            await removeSubscription(db, sub.endpoint);
          }
        } catch {
          /* service push injoignable : ignoré */
        }
      }),
    );
  } catch {
    /* jamais bloquant pour la requête utilisateur */
  }
}
