/**
 * Génère les icônes PWA (PNG) à partir du logo SVG.
 *
 * Usage : npm run icons:generate
 *
 * Produits dans public/icons/ :
 *  - icon-192.png / icon-512.png      → manifest (purpose "any")
 *  - maskable-192.png / maskable-512.png → manifest (purpose "maskable", zone de sécurité)
 *  - apple-touch-icon.png (180×180)   → iOS « Sur l'écran d'accueil » (fond opaque)
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const iconsDir = path.join(publicDir, 'icons');
const logoPath = path.join(publicDir, 'logo.svg');

/** Fond crème de l'app (ink-50) — plein cadre, sans transparence. */
const BACKGROUND = '#FAF7F2';

let logoSvg;

async function renderLogo(px) {
  // Rendu haute densité du SVG, réduit ensuite à la taille voulue (antialiasing propre).
  return sharp(logoSvg, { density: 384 }).resize(px, px, { fit: 'contain' }).png().toBuffer();
}

async function makeIcon(size, logoScale, file) {
  const logo = await renderLogo(Math.round(size * logoScale));
  await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, file));
  console.log(`${file}  ${size}x${size}  (logo ${Math.round(logoScale * 100)}%)`);
}

logoSvg = await readFile(logoPath);
await mkdir(iconsDir, { recursive: true });

// Icônes classiques (« any ») — logo généreux, le lanceur applique son propre masque.
await makeIcon(192, 0.84, 'icon-192.png');
await makeIcon(512, 0.84, 'icon-512.png');

// Icônes maskables — logo réduit pour rester dans la zone de sécurité (cercle à 80 %).
await makeIcon(192, 0.6, 'maskable-192.png');
await makeIcon(512, 0.6, 'maskable-512.png');

// Icône iOS — 180×180, fond opaque (iOS arrondit les coins lui-même).
await makeIcon(180, 0.78, 'apple-touch-icon.png');

console.log('Icônes PWA générées dans public/icons/');
