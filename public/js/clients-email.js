// Logique d'envoi groupé de mails — chargée par src/pages/clients/index.astro
// Sélection de clients → regroupement des adresses → ouverture de Roundcube.

// ============================================================
// Configuration — adaptez si votre webmail OVH a une autre URL
// ============================================================
const ROUNDCUBE_BASE = 'https://webmail.mail.ovh.net/';
const BCC_LIMIT = 40; // nombre d'adresses pré-remplies dans l'URL Roundcube (le reste passe par la copie)

// ============================================================
// Éléments du DOM
// ============================================================
const modal = document.getElementById('email-modal');
const bccList = document.getElementById('bcc-list');
const selCount = document.getElementById('sel-count');
const modalCount = document.getElementById('modal-count');
const statusEl = document.getElementById('mail-status');
const selectionBar = document.getElementById('selection-bar');

const allEmails = JSON.parse(document.getElementById('all-emails-data').textContent);

// La sélection = les cases cochées (visible ci-dessous) ∪ les emails ajoutés via « Tout sélectionner »
const extraEmails = new Set();

function pageCheckedEmails() {
  return Array.from(document.querySelectorAll('[data-email-checkbox]:checked')).map(cb => cb.value);
}

function selectedEmails() {
  return [...new Set([...pageCheckedEmails(), ...extraEmails])];
}

// ============================================================
// UI helpers
// ============================================================
function updateFooterBar() {
  const n = selectedEmails().length;
  selCount.textContent = n;
  selectionBar.classList.toggle('hidden', n === 0);
  selectionBar.classList.toggle('flex', n > 0);
}

function refreshModal() {
  const emails = selectedEmails();
  bccList.value = emails.join(', ');
  modalCount.textContent = emails.length + (emails.length > 1 ? ' adresses' : ' adresse');
  statusEl.classList.add('hidden');
  updateFooterBar();
}

function showStatus(message, ok) {
  statusEl.textContent = message;
  statusEl.className = 'text-sm font-medium ' + (ok ? 'text-success-600' : 'text-danger-600');
}

function openModal() {
  refreshModal();
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ============================================================
// Événements
// ============================================================
document.getElementById('open-email-modal').addEventListener('click', openModal);
document.getElementById('toolbar-open-modal').addEventListener('click', openModal);

document.getElementById('toolbar-clear').addEventListener('click', () => {
  document.querySelectorAll('[data-email-checkbox]:checked').forEach(cb => (cb.checked = false));
  extraEmails.clear();
  updateFooterBar();
});

document.getElementById('modal-close-btn').addEventListener('click', closeModal);
modal.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// Les cases des cartes client mettent à jour la barre flottante
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-email-checkbox]')) updateFooterBar();
});

// « Tout sélectionner » : ajoute TOUS les emails de la base (au-delà de la page affichée)
document.getElementById('modal-select-all').addEventListener('click', () => {
  extraEmails.clear();
  allEmails.forEach(e => extraEmails.add(e));
  document.querySelectorAll('[data-email-checkbox]').forEach(cb => (cb.checked = true));
  refreshModal();
});

document.getElementById('modal-select-none').addEventListener('click', () => {
  extraEmails.clear();
  document.querySelectorAll('[data-email-checkbox]:checked').forEach(cb => (cb.checked = false));
  refreshModal();
});

// Copie dans le presse-papier
document.getElementById('copy-emails').addEventListener('click', async () => {
  const emails = selectedEmails();
  if (!emails.length) { showStatus('Aucune adresse à copier.', false); return; }
  try {
    await navigator.clipboard.writeText(emails.join(', '));
    showStatus(emails.length + ' adresse(s) copiée(s) dans le presse-papier ✅', true);
  } catch {
    bccList.select();
    document.execCommand('copy');
    showStatus(emails.length + ' adresse(s) copiée(s) ✅', true);
  }
});

// Ouverture de Roundcube avec BCC pré-rempli
document.getElementById('open-roundcube').addEventListener('click', async () => {
  const emails = selectedEmails();
  if (!emails.length) { showStatus('Sélectionnez au moins une adresse.', false); return; }

  const shown = emails.slice(0, BCC_LIMIT);
  const hidden = emails.slice(BCC_LIMIT);

  // Copie systématique (secours si le pré-remplissage échoue côté Roundcube)
  try { await navigator.clipboard.writeText(emails.join(', ')); } catch { /* non bloquant */ }

  const url = ROUNDCUBE_BASE + '?_task=mail&_action=compose&_bcc=' + encodeURIComponent(shown.join(', '));
  window.open(url, '_blank', 'noopener');

  if (hidden.length) {
    showStatus(BCC_LIMIT + ' adresses pré-remplies dans Roundcube ; les ' + hidden.length + ' restantes sont dans votre presse-papier — collez-les dans le champ « Cci ».', true);
  } else {
    showStatus(emails.length + ' adresse(s) envoyée(s) vers Roundcube (et copiées dans le presse-papier) ✅', true);
  }
});
