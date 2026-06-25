const COOKIE_CONSENT_KEY = 'aionex-cookie-consent-v1';

function readCookieConsent() {
  try { return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) || 'null'); }
  catch { return null; }
}

function saveCookieConsent(preferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
    necessary: true,
    preferences: Boolean(preferences),
    savedAt: new Date().toISOString(),
  }));
  document.documentElement.dataset.cookiePreferences = preferences ? 'allowed' : 'denied';
}

function createCookieUi() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <aside class="cookie-banner" aria-label="Cookie-Hinweis">
      <div><strong>Datenschutz-Einstellungen</strong>
      <p>Wir verwenden technisch notwendige Speicherungen sowie – mit Ihrer Zustimmung – Komfortfunktionen für Theme und Chatverlauf. Keine Werbe- oder Analyse-Cookies.</p></div>
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
        <p class="cookie-detail">Der KI-Chat kann Nachrichten an den AIONEX-Server und an OpenAI übertragen. Details finden Sie in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
        <button type="button" class="cookie-save cookie-primary">Auswahl speichern</button>
      </section>
    </div>`;
  document.body.appendChild(wrapper);

  const banner = document.querySelector('.cookie-banner');
  const modal = document.querySelector('.cookie-modal');
  const preferences = modal.querySelector('.cookie-preferences');
  const current = readCookieConsent();
  if (current) {
    banner.hidden = true;
    preferences.checked = Boolean(current.preferences);
    document.documentElement.dataset.cookiePreferences = current.preferences ? 'allowed' : 'denied';
  }

  const openSettings = () => {
    const consent = readCookieConsent();
    preferences.checked = Boolean(consent?.preferences);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };
  const closeSettings = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };
  const finish = value => {
    saveCookieConsent(value);
    banner.hidden = true;
    closeSettings();
  };

  document.querySelectorAll('.cookie-settings-trigger').forEach(button => button.addEventListener('click', openSettings));
  banner.querySelector('[data-cookie-action="necessary"]').addEventListener('click', () => finish(false));
  banner.querySelector('[data-cookie-action="all"]').addEventListener('click', () => finish(true));
  banner.querySelector('[data-cookie-action="settings"]').addEventListener('click', openSettings);
  modal.querySelector('.cookie-save').addEventListener('click', () => finish(preferences.checked));
  modal.querySelectorAll('[data-cookie-close]').forEach(item => item.addEventListener('click', closeSettings));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createCookieUi);
else createCookieUi();
