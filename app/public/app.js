// Tiny client helper: live price preview for the booking form.
// Everything is re-validated and re-priced on the server — this is only a preview.

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const form = document.querySelector('[data-quote-form]');
const box = document.getElementById('quote');

// "Booking for someone else" clears the name that was pre-filled from the
// signed-in account, so a member can reserve for another person. Without JS the
// field is simply editable, which already allows the same thing.
const nameInput = document.querySelector('[data-prefilled-name]');
const someoneElse = document.querySelector('[data-for-someone-else]');
if (nameInput && someoneElse) {
  const accountName = nameInput.value;
  someoneElse.addEventListener('change', () => {
    if (someoneElse.checked) {
      nameInput.value = '';
      nameInput.focus();
    } else {
      nameInput.value = accountName;
    }
  });
}

if (form && box) {
  const slug = box.dataset.slug;

  const update = async () => {
    const fd = new FormData(form);
    const params = new URLSearchParams({
      slug,
      option: fd.get('optionId') || '',
      adults: fd.get('adults') || '1',
      children: fd.get('children') || '0',
      extras: fd.getAll('extraIds').join(','),
    });

    try {
      const res = await fetch(`/api/quote?${params.toString()}`);
      const data = await res.json();
      if (!data.ok) {
        box.innerHTML = `<h3>Your price</h3><p class="muted">${esc(data.error || 'Enter your details')}</p>`;
        return;
      }
      box.innerHTML = `<h3>Your price</h3>
        <ul class="quote-lines">
          ${data.lines.map((l) => `<li><span>${esc(l.label)}</span><span>${esc(l.amount)}</span></li>`).join('')}
        </ul>
        <p class="quote-total"><span>Total</span><strong>${esc(data.total)}</strong></p>
        <p class="muted small">Deposit ${esc(data.deposit)} · Balance ${esc(data.balance)}</p>`;
    } catch {
      box.innerHTML = '<h3>Your price</h3><p class="muted">Could not update the price.</p>';
    }
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
}

// --------------------------------------------------------------- install app
// Makes the site downloadable to the home screen. The browser decides when the
// site is installable and fires `beforeinstallprompt`; we hold that event and
// hand it back on a real tap. iOS Safari never fires it, so there we explain
// the Share -> Add to Home Screen route instead.

const DISMISS_KEY = 'bonfire:install-dismissed';

const banner = document.getElementById('install-banner');
const hint = document.getElementById('install-hint');
const installNow = document.getElementById('install-now');
const installLater = document.getElementById('install-later');
const headerBtn = document.getElementById('install-header');

let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Installability is a bonus; never let registration break the page. */
    });
  });
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

function dismissed() {
  try { return window.localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

function rememberDismiss() {
  try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
}

function openBanner(message) {
  if (!banner || isStandalone() || dismissed()) return;
  // With no native prompt available (iOS), the banner is instruction-only.
  if (!deferredPrompt && isIos() && installNow) installNow.hidden = true;
  if (message && hint) hint.textContent = message;
  banner.hidden = false;
}

function closeBanner() {
  if (banner) banner.hidden = true;
}

async function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (headerBtn) headerBtn.hidden = true;
    if (outcome === 'accepted') rememberDismiss();
    closeBanner();
    return;
  }
  if (isIos()) {
    openBanner('Tap the Share button, then “Add to Home Screen”.');
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (headerBtn) headerBtn.hidden = false;
  openBanner();
});

window.addEventListener('appinstalled', () => {
  rememberDismiss();
  deferredPrompt = null;
  closeBanner();
});

if (installNow) installNow.addEventListener('click', install);
if (installLater) installLater.addEventListener('click', () => { rememberDismiss(); closeBanner(); });
if (headerBtn) headerBtn.addEventListener('click', install);

// iOS has no install event: offer the manual route, but only after the visitor
// has actually looked around rather than on the first paint.
if (isIos() && !isStandalone() && !dismissed()) {
  window.setTimeout(() => openBanner('Tap the Share button, then “Add to Home Screen”.'), 12000);
}
