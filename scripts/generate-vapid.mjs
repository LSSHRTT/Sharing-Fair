/**
 * Génère une paire de clés VAPID (EC P-256) pour Web Push.
 *
 * Usage : npm run vapid:generate
 *
 * Affiche :
 *  - VAPID_PUBLIC_KEY  : clé publique base64url (à exposer au client, NON secrète)
 *  - VAPID_PRIVATE_JWK : clé privée au format JWK JSON (SECRET — jamais côté client)
 */
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

const pub = publicKey.export({ format: 'jwk' }); // { kty, crv, x, y }
const priv = privateKey.export({ format: 'jwk' }); // { kty, crv, x, y, d }

const fromB64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const toB64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Clé publique « application server key » : 0x04 || X(32) || Y(32), encodée base64url.
const rawPublic = Buffer.concat([Buffer.from([4]), fromB64url(pub.x), fromB64url(pub.y)]);

console.log('# --- VAPID (à ajouter dans .dev.vars EN LOCAL) ---');
console.log(`VAPID_PUBLIC_KEY=${toB64url(rawPublic)}`);
console.log(`VAPID_PRIVATE_JWK=${JSON.stringify(priv)}`);
console.log('');
console.log('# Production :');
console.log('#   echo "<VAPID_PRIVATE_JWK>" | npx wrangler pages secret put VAPID_PRIVATE_JWK');
console.log('#   echo "<VAPID_PUBLIC_KEY>"  | npx wrangler pages secret put VAPID_PUBLIC_KEY');
