const COOKIE_CONSENT_KEY = 'aionex-cookie-consent-v2';
const AIONEX_PIXEL_ID = '1039100638649248';
let aionexPixelLoaded = false;

function readCookieConsent() {
  try { return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) || 'null'); }
  catch { return null; }
}

function loadAionexPixel() {
  if (aionexPixelLoaded || !AIONEX_PIXEL_ID) return;
  aionexPixelLoaded = true;

  window.fbq = window.fbq || function fbq() {
    window.fbq.callMethod
      ? window.fbq.callMethod.apply(window.fbq, arguments)
      : window.fbq.queue.push(arguments);
  };
  if (!window._fbq) window._fbq = window.fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = window.fbq.queue || [];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', AIONEX_PIXEL_ID);
  window.fbq('track', 'PageView');
}

function applyCookieConsent(consent) {
  const preferences = Boolean(consent?.preferences);
  const marketing = Boolean(consent?.marketing);
  document.documentElement.dataset.cookiePreferences = preferences ? 'allowed' : 'denied';
  document.documentElement.dataset.cookieMarketing = marketing ? 'allowed' : 'denied';
  if (marketing) loadAionexPixel();
}

function saveCookieConsent(options) {
  const preferences = typeof options === 'object' ? options.preferences : options;
  const marketing = typeof options === 'object' ? options.marketing : false;
  const consent = {
    necessary: true,
    preferences: Boolean(preferences),
    marketing: Boolean(marketing),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
    ...consent,
  }));
  applyCookieConsent(consent);
}

function createCookieUi() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <aside class="cookie-banner" aria-label="Cookie-Hinweis">
      <div><strong>Datenschutz-Einstellungen</strong>
      <p>Wir verwenden technisch notwendige Speicherungen sowie – mit Ihrer Zustimmung – Komfortfunktionen und den AIONEX Pixel zur Messung von Kampagnen.</p></div>
      <div class="cookie-actions">
        <button type="button" data-cookie-action="necessary">Nur notwendige</button>
        <button type="button" data-cookie-action="settings">Einstellungen</button>
        <button type="button" class="cookie-primary" data-cookie-action="all">Alle akzeptieren</button>
      </div>
    </aside>
    <div class="cookie-modal" aria-hidden="true">
      <div class="cookie-backdrop" data-cookie-close></div>
      <section class="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
        <button type="button" class="cookie-close" data-cookie-close aria-label="Schließen">×</button>
        <span>Datenschutz</span><h2 id="cookie-title">Cookie-Einstellungen</h2>
        <p>Sie entscheiden, welche optionalen Speicherungen erlaubt sind. Ihre Auswahl kann jederzeit im Footer geändert werden.</p>
        <label class="cookie-option"><span><b>Technisch notwendig</b><small>Speichert Ihre Einwilligungsentscheidung und ermöglicht grundlegende Funktionen.</small></span><input type="checkbox" checked disabled></label>
        <label class="cookie-option"><span><b>Komfort & Präferenzen</b><small>Speichert Theme-Auswahl, Chat-Sitzung und Chatverlauf lokal in Ihrem Browser.</small></span><input class="cookie-preferences" type="checkbox"></label>
        <label class="cookie-option"><span><b>Marketing & AIONEX Pixel</b><small>Erlaubt den Meta Pixel mit Dataset ID 1039100638649248 zur Kampagnenmessung.</small></span><input class="cookie-marketing" type="checkbox" checked></label>
        <p class="cookie-detail">Der KI-Chat kann Nachrichten an den AIONEX-Server und an OpenAI übertragen. Der AIONEX Pixel wird nur nach Zustimmung geladen. Details finden Sie in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
        <button type="button" class="cookie-save cookie-primary">Auswahl speichern</button>
      </section>
    </div>`;
  document.body.appendChild(wrapper);

  const banner = document.querySelector('.cookie-banner');
  const modal = document.querySelector('.cookie-modal');
  const preferences = modal.querySelector('.cookie-preferences');
  const marketing = modal.querySelector('.cookie-marketing');
  const current = readCookieConsent();
  if (current) {
    banner.hidden = true;
    preferences.checked = Boolean(current.preferences);
    marketing.checked = Boolean(current.marketing);
    applyCookieConsent(current);
  }

  const openSettings = () => {
    const consent = readCookieConsent();
    preferences.checked = Boolean(consent?.preferences);
    marketing.checked = consent ? Boolean(consent.marketing) : true;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };
  const closeSettings = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };
  const finish = value => {
    saveCookieConsent(typeof value === 'object' ? value : { preferences: value, marketing: value });
    banner.hidden = true;
    closeSettings();
  };

  document.querySelectorAll('.cookie-settings-trigger').forEach(button => button.addEventListener('click', openSettings));
  banner.querySelector('[data-cookie-action="necessary"]').addEventListener('click', () => finish({ preferences: false, marketing: false }));
  banner.querySelector('[data-cookie-action="all"]').addEventListener('click', () => finish({ preferences: true, marketing: true }));
  banner.querySelector('[data-cookie-action="settings"]').addEventListener('click', openSettings);
  modal.querySelector('.cookie-save').addEventListener('click', () => finish({ preferences: preferences.checked, marketing: marketing.checked }));
  modal.querySelectorAll('[data-cookie-close]').forEach(item => item.addEventListener('click', closeSettings));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createCookieUi);
else createCookieUi();
