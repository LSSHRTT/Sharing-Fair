const COOKIE_NAME = 'sf_session';
// Plafond technique de validité d'un jeton (~13 mois). La durée réelle de la
// session dépend du cookie : session navigateur seule, ou cookie longue durée
// quand « Rester connecté » est coché.
const TOKEN_MAX_AGE = 60 * 60 * 24 * 400;
const REMEMBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(sig));
}

/**
 * Comparaison en temps constant — utilisée pour vérifier la signature de
 * session ainsi que la date de naissance (qui fait office de mot de passe).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Crée un jeton de session signé, lié à un bénévole (son id). */
export async function createSessionToken(secret: string, volunteerId: number): Promise<string> {
  const issued = Date.now().toString(36);
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
  const payload = `${issued}.${volunteerId}.${nonce}`;
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

/**
 * Vérifie un jeton de session. Retourne l'id du bénévole si le jeton est
 * valide et non expiré, sinon null.
 */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<number | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [issued, idStr, nonce, sig] = parts;
  const volunteerId = Number(idStr);
  if (!Number.isInteger(volunteerId) || volunteerId <= 0) return null;

  const expected = await hmac(secret, `${issued}.${idStr}.${nonce}`);
  if (!constantTimeEqual(sig, expected)) return null;

  const issuedAt = parseInt(issued, 36);
  if (!Number.isFinite(issuedAt)) return null;
  const ageSec = (Date.now() - issuedAt) / 1000;
  if (ageSec < 0 || ageSec >= TOKEN_MAX_AGE) return null;

  return volunteerId;
}

export function sessionCookieName(): string {
  return COOKIE_NAME;
}

/**
 * Durée du cookie de session.
 * - remember = true  → cookie persistant (~13 mois) : « Rester connecté ».
 * - remember = false → cookie de session navigateur (undefined = sans maxAge).
 */
export function sessionCookieMaxAge(remember: boolean): number | undefined {
  return remember ? REMEMBER_COOKIE_MAX_AGE : undefined;
}
