const COOKIE_NAME = 'sf_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
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

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const issued = Date.now().toString(36);
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
  const payload = `${issued}.${nonce}`;
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issued, nonce, sig] = parts;
  const expected = await hmac(secret, `${issued}.${nonce}`);
  if (!constantTimeEqual(sig, expected)) return false;
  const issuedAt = parseInt(issued, 36);
  if (!Number.isFinite(issuedAt)) return false;
  const ageSec = (Date.now() - issuedAt) / 1000;
  return ageSec >= 0 && ageSec < COOKIE_MAX_AGE;
}

export function sessionCookieName(): string {
  return COOKIE_NAME;
}

export function sessionCookieMaxAge(): number {
  return COOKIE_MAX_AGE;
}
