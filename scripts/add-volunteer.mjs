/**
 * Ajoute un bénévole dans la base D1 (compte de connexion).
 *
 * Usage :
 *   npm run benevole:add -- --prenom Marie --nom Dupont --naissance 1988-04-12
 *   npm run benevole:add -- --prenom Marie --nom Dupont --naissance 1988-04-12 --remote
 *
 * Sans --remote : base locale (développement).
 * Avec --remote : base de production Cloudflare.
 *
 * La date de naissance fait office de mot de passe du bénévole.
 *
 * NB : wrangler est appelé directement via node (node_modules/wrangler/bin/wrangler.js)
 *      — passer par npx.cmd est bloqué par les versions récentes de Node sous Windows.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function arg(name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? (args[i + 1] ?? null) : null;
}

const prenom = arg('prenom');
const nom = arg('nom');
const naissance = arg('naissance');
const remote = args.includes('--remote');
const targetArgs = remote ? ['--remote'] : ['--local'];

function usage() {
  console.error('Usage : npm run benevole:add -- --prenom <Prénom> --nom <Nom> --naissance <AAAA-MM-JJ> [--remote]');
}

if (!prenom || !nom || !naissance) {
  usage();
  process.exit(1);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(naissance)) {
  console.error(`Date de naissance invalide : « ${naissance} » — format attendu AAAA-MM-JJ.`);
  usage();
  process.exit(1);
}

// Échappement minimal des apostrophes SQL (O'Neil → O''Neil).
const esc = (s) => s.replace(/'/g, "''");
const sql =
  `INSERT OR IGNORE INTO volunteers (first_name, last_name, birth_date, created_at) ` +
  `VALUES ('${esc(prenom.trim())}', '${esc(nom.trim())}', '${naissance}', '${new Date().toISOString()}');`;

console.log(`Ajout de ${prenom} ${nom} (naissance ${naissance}) → base ${remote ? 'PRODUCTION' : 'locale'}…`);

// Appelle wrangler via node, sans passer par npx.cmd (bloqué par Node ≥ 18.20.2 sous Windows).
const wranglerJs = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
if (!existsSync(wranglerJs)) {
  console.error('Wrangler introuvable dans node_modules — lancez d’abord « npm install ».');
  process.exit(1);
}

const r = spawnSync(
  process.execPath,
  [wranglerJs, 'd1', 'execute', 'sharing_fair_db', ...targetArgs, '--command', sql],
  { encoding: 'utf8' },
);

if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);

if (r.error) {
  console.error(`Échec du lancement de wrangler : ${r.error.message}`);
  process.exit(1);
}
if (r.status !== 0) {
  console.error('\nÉchec de l’insertion (voir la sortie wrangler ci-dessus).');
  if ((r.stderr || '').includes('no such table') || (r.stdout || '').includes('no such table')) {
    console.error(
      `💡 La table est absente : appliquez d'abord les migrations avec « npm run ${remote ? 'db:migrate:prod' : 'db:migrate:local'} ».`,
    );
  }
  process.exit(r.status ?? 1);
}
console.log('✅ Terminé. Si le bénévole existait déjà (même prénom/nom), l’insertion a été ignorée.');
