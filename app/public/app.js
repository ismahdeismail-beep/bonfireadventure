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

// ------------------------------------------------------ hero video + motion
// Design rule for everything below: motion is decoration, never a gate. The page
// must be fully readable and tappable if any of this fails, is blocked, or is
// switched off by the visitor.

const prefersReduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroVideo = document.getElementById('hero-video');
const heroPlay = document.getElementById('hero-play');

if (heroVideo) {
  // The video is muted + looping + playsinline, so browsers allow it to autoplay
  // as soon as it has data. `preload="none"` keeps it off the critical path: we
  // only ask for bytes once we know motion is welcome.
  const wantsMotion = !prefersReduced();

  const start = () => {
    if (!wantsMotion) return;
    const p = heroVideo.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  // Fade the video in only after it genuinely renders a frame — this is what
  // prevents a black box in place of the hero photo.
  heroVideo.addEventListener('playing', () => {
    heroVideo.classList.add('is-playing');
    heroVideo.closest('.hero')?.classList.add('has-video');
  }, { once: false });

  heroVideo.addEventListener('loadeddata', start);

  // Don't burn bandwidth or battery off-screen. This is the single biggest
  // "still feels operable" win: a video decoding behind a scrolled-away hero
  // makes the whole page janky on a phone.
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) start();
        else heroVideo.pause();
      }
    }, { threshold: 0.15 });
    visibility.observe(heroVideo);
  }

  // Same for the tab being backgrounded.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) heroVideo.pause();
    else start(); // the observer will re-pause it if it is off-screen
  });

  // Kick off the download only once the page is genuinely settled and the
  // network can afford it. This is the difference between a hero that decorates
  // the page and one that delays it: a phone on a slow connection should never
  // spend its first seconds on a 3MB video it did not ask for.
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const cheapEnough = (() => {
    if (!connection) return true;                       // unknown: assume fine
    if (connection.saveData) return false;               // explicit opt-out
    const t = connection.effectiveType || '';
    return t === '' || /(^|-)4g$/.test(t) || t === 'wifi';
  })();

  const warm = () => {
    if (warmed) return;
    warmed = true;
    heroVideo.preload = 'auto';
    heroVideo.load();
    start();
  };
  let warmed = false;

  // Wait for `load` (every image/CSS done) AND a real quiet gap after it. An
  // idle callback alone fires within milliseconds on a fast connection, which
  // put the video request at ~500ms and made it compete with first paint.
  if (wantsMotion && cheapEnough) {
    const afterLoad = () => {
      const settle = () => {
        if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 3000 });
        else warm();
      };
      // One animation frame + a short beat past `load`: the first paint has
      // happened and nothing is queued ahead of us. Kept deliberately short so
      // the hero still comes alive quickly.
      requestAnimationFrame(() => setTimeout(settle, 120));
    };
    // Always go through the `load` listener. Checking `readyState` here can be
    // true while the load event is still queued, which let the video request
    // slip out ~90ms ahead of load.
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
  } else if (wantsMotion) {
    // Save-data or a slow link: keep the still photo, and let the button be the
    // only way to pull the video down.
    if (heroPlay) {
      heroPlay.addEventListener('click', () => {
        heroVideo.preload = 'auto';
        heroVideo.load();
        heroVideo.muted = false;
        heroVideo.play().catch(() => {});
      }, { once: true });
    }
  }

  // The hero video already autoplays muted, so a play/pause toggle would be
  // confusing: the visitor taps "play" on something already moving and it stops.
  // Instead the button owns SOUND, which is the thing the visitor actually
  // controls here. Label always states the next action.
  if (heroPlay) {
    heroPlay.hidden = false;
    const setLabel = () => {
      const audible = !heroVideo.muted && !heroVideo.paused;
      heroPlay.textContent = audible ? heroPlay.dataset.stopLabel : heroPlay.dataset.playLabel;
      heroPlay.setAttribute('aria-pressed', audible ? 'true' : 'false');
    };
    setLabel();

    heroPlay.addEventListener('click', () => {
      const audible = !heroVideo.muted && !heroVideo.paused;
      if (audible) {
        heroVideo.muted = true;
        heroVideo.pause();
      } else {
        // An explicit tap is a user gesture, so unmuting is permitted here.
        heroVideo.muted = false;
        const p = heroVideo.play();
        if (p && typeof p.catch === 'function') {
          // If playback with sound is refused, fall back to muted rather than
          // leaving the visitor staring at a frozen frame.
          p.catch(() => { heroVideo.muted = true; heroVideo.play().catch(() => {}); });
        }
      }
      setLabel();
    });

    // Keep the label honest if playback state changes for any other reason
    // (scrolling it out of view pauses it, the tab is backgrounded, etc.).
    heroVideo.addEventListener('play', setLabel);
    heroVideo.addEventListener('pause', setLabel);
  }

  // If the visitor turns reduced-motion on mid-session, honour it immediately.
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      if (mq.matches) {
        heroVideo.pause();
        heroVideo.classList.remove('is-playing');
        heroVideo.closest('.hero')?.classList.remove('has-video');
        if (heroPlay) heroPlay.textContent = heroPlay.dataset.playLabel;
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }
} else if (heroPlay) {
  // No video in the DOM (JS/lazy failure): the button would be a dead end, so
  // remove it rather than leave a control that does nothing.
  heroPlay.hidden = true;
}

// ---------------------------------------------------------------- scroll reveal
// Reveals content as it enters the viewport. Everything is visible by default;
// `.js-reveal` on <html> is what opts into hiding, and it is only added when we
// can actually observe and reveal. Cards above the fold are marked visible
// immediately so nothing the visitor is already reading ever fades in late.
if (!prefersReduced() && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll(
    '.section-head, .card, .dest-card, .promise-stats div, .step, .tier'
  );
  if (targets.length) {
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // reveal once, then get out of the way
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (const el of targets) {
      const box = el.getBoundingClientRect();
      // Already on screen at load -> show straight away, no animation.
      if (box.top < window.innerHeight) el.classList.add('is-visible');
      else { el.classList.add('reveal'); io.observe(el); }
    }
  }
}
