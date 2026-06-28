const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuBackdrop = document.querySelector('.mobile-menu-backdrop');
const themeButton = document.querySelector('.theme-toggle');
const AIONEX_RENDER_API = 'https://aionexnewmitkichat.onrender.com';
const AIONEX_IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const AIONEX_API_BASE = window.AIONEX_CHAT_API || (
  AIONEX_IS_LOCAL ? 'http://127.0.0.1:8000' : AIONEX_RENDER_API
);
const mobileNavQuery = window.matchMedia('(max-width: 640px)');
let lastNavScrollY = window.scrollY;
let navScrollTicking = false;

function syncThemeButton() {
  const isLight = document.documentElement.dataset.theme === 'light';
  themeButton?.setAttribute('aria-pressed', String(isLight));
  themeButton?.setAttribute(
    'aria-label',
    isLight ? 'Zur dunklen Ansicht wechseln' : 'Zur hellen Ansicht wechseln'
  );
  const label = themeButton?.querySelector('.theme-label');
  if (label) label.textContent = isLight ? 'Dark' : 'Light';
}

themeButton?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('aionex-theme', nextTheme);
  syncThemeButton();
});

syncThemeButton();

const leadModal = document.querySelector('#lead-modal');
const leadDialog = leadModal?.querySelector('.lead-modal-dialog');
const leadForm = document.querySelector('#lead-form');
let lastModalTrigger = null;

function getLeadValidationMessage(type) {
  const language = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase();
  const messages = {
    de: {
      consent: 'Bitte stimmen Sie der Verarbeitung Ihrer Daten zu, um fortzufahren.',
      required: 'Bitte füllen Sie dieses Feld aus.',
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    },
    en: {
      consent: 'Please agree to the processing of your data to continue.',
      required: 'Please fill out this field.',
      email: 'Please enter a valid email address.',
    },
    ru: {
      consent: 'Пожалуйста, согласитесь на обработку данных, чтобы продолжить.',
      required: 'Пожалуйста, заполните это поле.',
      email: 'Пожалуйста, введите корректный email.',
    },
  };
  return (messages[language] || messages.de)[type];
}

function updateLeadValidationMessage(input) {
  if (!input) return;
  input.setCustomValidity('');
  if (input.validity.valid) return;
  if (input.name === 'consent') {
    input.setCustomValidity(getLeadValidationMessage('consent'));
  } else if (input.validity.typeMismatch && input.type === 'email') {
    input.setCustomValidity(getLeadValidationMessage('email'));
  } else if (input.validity.valueMissing) {
    input.setCustomValidity(getLeadValidationMessage('required'));
  }
}

function syncLeadValidationMessages() {
  leadForm?.querySelectorAll('input').forEach(updateLeadValidationMessage);
}

function openLeadModal(trigger) {
  if (!leadModal) return;
  lastModalTrigger = trigger || document.activeElement;
  leadForm?.classList.remove('submitted');
  leadForm?.classList.remove('has-error');
  syncLeadValidationMessages();
  leadModal.classList.add('open');
  leadModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  window.setTimeout(() => leadModal.querySelector('input')?.focus(), 80);
}

function closeLeadModal() {
  if (!leadModal) return;
  leadModal.classList.remove('open');
  leadModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  lastModalTrigger?.focus?.();
}

document.querySelectorAll('.consultation-trigger').forEach(trigger => {
  trigger.addEventListener('click', event => {
    event.preventDefault();
    openLeadModal(trigger);
  });
});

leadForm?.querySelectorAll('input').forEach(input => {
  input.addEventListener('invalid', () => updateLeadValidationMessage(input));
  input.addEventListener('input', () => updateLeadValidationMessage(input));
  input.addEventListener('change', () => updateLeadValidationMessage(input));
});

leadForm?.querySelector('[type="submit"]')?.addEventListener('click', syncLeadValidationMessages);

leadModal?.querySelectorAll('[data-modal-close]').forEach(control => {
  control.addEventListener('click', closeLeadModal);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && leadModal?.classList.contains('open')) closeLeadModal();
  if (event.key === 'Escape' && mobileMenu?.classList.contains('open')) setMobileMenuOpen(false);
  if (event.key === 'Tab' && leadModal?.classList.contains('open')) {
    const focusable = [...leadDialog.querySelectorAll('button,input,a')].filter(el => !el.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

leadForm?.addEventListener('submit', async event => {
  event.preventDefault();
  syncLeadValidationMessages();
  if (!leadForm.reportValidity()) return;
  const submitButton = leadForm.querySelector('[type="submit"]');
  const formSuccess = leadForm.querySelector('.form-success');
  const data = Object.fromEntries(new FormData(leadForm).entries());
  const payload = {
    ...data,
    consent: data.consent === 'on',
  };

  const originalSubmitHtml = submitButton.innerHTML;
  const sendingText = (document.documentElement.lang || 'de').startsWith('en')
    ? 'Sending request...'
    : 'Anfrage wird gesendet...';
  submitButton.disabled = true;
  submitButton.textContent = sendingText;
  leadForm.classList.remove('has-error');
  if (formSuccess) formSuccess.textContent = sendingText;
  try {
    const response = await fetch(`${AIONEX_API_BASE}/api/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const leads = JSON.parse(localStorage.getItem('aionex-leads') || '[]');
    leads.push({ ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem('aionex-leads', JSON.stringify(leads));
    if (formSuccess) {
      formSuccess.textContent = 'Vielen Dank! Ihre Anfrage wurde gesendet. Wir melden uns innerhalb von 24 Stunden.';
    }
    leadForm.classList.add('submitted');
    leadForm.reset();
    window.setTimeout(closeLeadModal, 2600);
  } catch (error) {
    if (formSuccess) {
      formSuccess.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte kontaktieren Sie uns direkt per E-Mail: aionex.info@gmail.com';
    }
    leadForm.classList.add('has-error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalSubmitHtml;
  }
});

function setMobileMenuOpen(open) {
  mobileMenu?.classList.toggle('open', open);
  mobileMenuBackdrop?.classList.toggle('open', open);
  document.body.classList.toggle('mobile-menu-open', open);
  menuButton?.classList.toggle('open', open);
  menuButton?.setAttribute('aria-expanded', String(open));
}

menuButton?.addEventListener('click', () => {
  setMobileMenuOpen(!mobileMenu?.classList.contains('open'));
});

mobileMenuBackdrop?.addEventListener('click', () => setMobileMenuOpen(false));

mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  setMobileMenuOpen(false);
}));

function syncMobileNavOnScroll() {
  if (!mobileNavQuery.matches) {
    document.body.classList.remove('nav-hidden', 'nav-elevated');
    lastNavScrollY = window.scrollY;
    return;
  }

  const currentScrollY = window.scrollY;
  const scrollingDown = currentScrollY > lastNavScrollY + 8;
  const scrollingUp = currentScrollY < lastNavScrollY - 8;

  document.body.classList.toggle('nav-elevated', currentScrollY > 24);

  if (currentScrollY < 72 || mobileMenu?.classList.contains('open')) {
    document.body.classList.remove('nav-hidden');
  } else if (scrollingDown) {
    document.body.classList.add('nav-hidden');
  } else if (scrollingUp) {
    document.body.classList.remove('nav-hidden');
  }

  if (Math.abs(currentScrollY - lastNavScrollY) > 8) {
    lastNavScrollY = currentScrollY;
  }
}

window.addEventListener('scroll', () => {
  if (navScrollTicking) return;
  navScrollTicking = true;
  window.requestAnimationFrame(() => {
    syncMobileNavOnScroll();
    navScrollTicking = false;
  });
}, { passive: true });

mobileNavQuery.addEventListener?.('change', syncMobileNavOnScroll);
syncMobileNavOnScroll();

document.querySelectorAll('.accordion article').forEach(item => {
  item.querySelector('button').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.accordion article').forEach(other => other.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Premium Animation Logic
function animateValue(obj) {
  if (obj.classList.contains('animated')) return;
  obj.classList.add('animated');
  const target = parseFloat(obj.getAttribute('data-target'));
  const decimals = parseInt(obj.getAttribute('data-decimals') || '0', 10);
  const duration = 1200; // ms
  let startTimestamp = null;
  
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // easeOutCubic easing
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = easeOutCubic * target;
    obj.textContent = currentValue.toFixed(decimals);
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = target.toFixed(decimals);
    }
  };
  window.requestAnimationFrame(step);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains('reveal-stagger')) {
        const children = entry.target.querySelectorAll('.reveal-fade, .reveal-slide-up, .reveal-slide-down, .reveal-slide-left, .reveal-slide-right, .reveal-scale');
        children.forEach((child, index) => {
          child.style.transitionDelay = `${index * 110}ms`;
          child.classList.add('visible');
          if (child.classList.contains('premium-tilt-card')) {
            window.setTimeout(() => {
              child.style.transitionDelay = '0ms';
            }, 900 + index * 110);
          }
          
          // Animate nested stats
          child.querySelectorAll('.stat-count').forEach(animateValue);
          
          // Animate nested SVG draw paths
          child.querySelectorAll('.animate-draw').forEach(path => {
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            path.getBoundingClientRect(); // trigger reflow
            path.classList.add('drawn');
          });
        });
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.add('visible');
        
        // Animate stats directly in this element
        entry.target.querySelectorAll('.stat-count').forEach(animateValue);
        
        // Animate SVG draw paths directly in this element
        entry.target.querySelectorAll('.animate-draw').forEach(path => {
          const length = path.getTotalLength();
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          path.getBoundingClientRect(); // trigger reflow
          path.classList.add('drawn');
        });
      }
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

// Observe all reveal classes
const revealSelectors = [
  '.reveal',
  '.reveal-fade',
  '.reveal-slide-up',
  '.reveal-slide-down',
  '.reveal-slide-left',
  '.reveal-slide-right',
  '.reveal-scale',
  '.reveal-stagger'
];
document.querySelectorAll(revealSelectors.join(',')).forEach(element => observer.observe(element));

// 3D Tilt Hover Effects
document.querySelectorAll('.tilt-hover, .premium-tilt-card').forEach(card => {
  let frame = 0;
  let latestEvent = null;
  const isPremiumCard = card.classList.contains('premium-tilt-card');
  const maxTilt = isPremiumCard ? 7 : 9;
  const lift = isPremiumCard ? -5 : 0;
  if (isPremiumCard && card.classList.contains('visible')) {
    card.style.transitionDelay = '0ms';
  }

  function resetTilt() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    latestEvent = null;
    if (card.classList.contains('dashboard')) {
      card.style.transform = 'perspective(1000px) rotateY(-2deg)';
    } else {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  }

  function updateTilt() {
    frame = 0;
    if (!latestEvent) return;

    const rect = card.getBoundingClientRect();
    const x = latestEvent.clientX - rect.left;
    const y = latestEvent.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.transform = `perspective(1000px) translate3d(0, ${lift}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  card.addEventListener('mousemove', event => {
    if (isPremiumCard) card.style.transitionDelay = '0ms';
    latestEvent = event;
    if (!frame) frame = requestAnimationFrame(updateTilt);
  });

  card.addEventListener('mouseleave', resetTilt);
});


// AIONEX AI chat — adapted from the Corex ChatWidget API contract.
const aiChat = document.querySelector('#ai-chat');
const aiChatLaunch = aiChat?.querySelector('.ai-chat-launch');
const aiChatPanel = aiChat?.querySelector('.ai-chat-panel');
const aiChatClose = aiChat?.querySelector('.ai-chat-close');
const aiChatBody = aiChat?.querySelector('.ai-chat-body');
const aiChatMessages = aiChat?.querySelector('.ai-chat-messages');
const aiChatForm = aiChat?.querySelector('.ai-chat-form');
const aiChatInput = aiChatForm?.querySelector('input');
const aiChatTyping = aiChat?.querySelector('.ai-chat-typing');
const aiChatError = aiChat?.querySelector('.ai-chat-error');
const aiEngineStatus = aiChat?.querySelector('.ai-engine-status');
const AI_CHAT_STORAGE = 'aionex_chat_v2';
const AI_SESSION_STORAGE = 'aionex_chat_session';
const AI_LEAD_SENT_STORAGE = 'aionex_chat_lead_sent';
const AI_CHAT_API = AIONEX_API_BASE;
let aiMessages = [];
let aiStreaming = false;

function getAiSessionId() {
  let sessionId = localStorage.getItem(AI_SESSION_STORAGE);
  if (!sessionId) {
    sessionId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem(AI_SESSION_STORAGE, sessionId);
  }
  return sessionId;
}

function saveAiMessages() {
  localStorage.setItem(AI_CHAT_STORAGE, JSON.stringify(aiMessages.slice(-100)));
}

function sanitizeAiMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(message =>
      message
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
    )
    .map(message => ({
      role: message.role,
      content: message.content.trim().slice(0, 2000),
    }))
    .filter(message => message.content.length > 0);
}

function extractChatLead(messages) {
  const transcript = messages.map(message => message.content).join('\n');
  const email = transcript.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = transcript.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  if (!email || !phone) return null;

  const nameMatch = transcript.match(/(?:name|ich heiße|mein name ist|меня зовут|имя)\s*[:\-]?\s*([A-Za-zÀ-žА-Яа-яЁё\s'-]{2,60})/i);
  const fullName = nameMatch?.[1]?.trim().replace(/\s+/g, ' ') || '';
  const [firstName, ...lastNameParts] = fullName.split(' ').filter(Boolean);
  return {
    firstName: firstName || 'Chat',
    lastName: lastNameParts.join(' ') || 'Kontakt',
    phone,
    email,
    consent: true,
    source: 'AI Chat',
    message: transcript.slice(-1800),
  };
}

async function sendChatLeadIfReady() {
  const sessionId = getAiSessionId();
  if (localStorage.getItem(`${AI_LEAD_SENT_STORAGE}:${sessionId}`)) return;
  const lead = extractChatLead(aiMessages);
  if (!lead) return;

  try {
    const response = await fetch(`${AIONEX_API_BASE}/api/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    localStorage.setItem(`${AI_LEAD_SENT_STORAGE}:${sessionId}`, new Date().toISOString());
  } catch (error) {
    console.warn('AI chat lead email failed', error);
  }
}

function createAiMessage(message, streaming = false) {
  const row = document.createElement('div');
  row.className = `ai-message ai-message-${message.role}`;
  if (message.role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'ai-mini-avatar';
    avatar.innerHTML = '<svg><use href="#i-bot"/></svg>';
    row.appendChild(avatar);
  }
  const bubble = document.createElement('p');
  bubble.textContent = message.content;
  if (streaming) bubble.classList.add('streaming');
  row.appendChild(bubble);
  return { row, bubble };
}

function renderAiHistory() {
  if (!aiChatMessages) return;
  aiChatMessages.replaceChildren();
  aiMessages.forEach(message => aiChatMessages.appendChild(createAiMessage(message).row));
}

try {
  const stored = JSON.parse(localStorage.getItem(AI_CHAT_STORAGE) || '[]');
  aiMessages = sanitizeAiMessages(stored);
  if (!Array.isArray(stored) || stored.length !== aiMessages.length) saveAiMessages();
} catch {
  aiMessages = [];
  localStorage.removeItem(AI_CHAT_STORAGE);
}
renderAiHistory();

function isAiEnglish() {
  return (document.documentElement.lang || 'de').startsWith('en');
}

let aiHealthChecked = false;

function prewarmAiApi() {
  fetch(`${AI_CHAT_API}/api/health`).catch(() => {});
}

async function checkAiEngineHealth() {
  setAiEngineStatus();
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    await fetch(`${AI_CHAT_API}/api/health`, { signal: controller.signal });
    window.clearTimeout(timeout);
  } catch {
    window.setTimeout(prewarmAiApi, 2000);
  }
}

function setAiChatOpen(open) {
  aiChat?.classList.toggle('open', open);
  aiChatPanel?.setAttribute('aria-hidden', String(!open));
  aiChatLaunch?.setAttribute('aria-expanded', String(open));
  if (open) {
    if (!aiHealthChecked) {
      aiHealthChecked = true;
      checkAiEngineHealth();
    }
    window.setTimeout(() => aiChatInput?.focus(), 180);
  }
}

function scrollAiChat() {
  requestAnimationFrame(() => {
    if (aiChatBody) aiChatBody.scrollTop = aiChatBody.scrollHeight;
  });
}

function showAiError() {
  if (!aiChatError) return;
  aiChatError.textContent = '';
  aiChatError.hidden = true;
}

function setAiEngineStatus() {
  if (!aiEngineStatus) return;
  aiEngineStatus.textContent = isAiEnglish() ? 'OpenAI connected' : 'OpenAI verbunden';
}

function getAiGracefulReply() {
  return isAiEnglish()
    ? 'Thanks for your message. Please send your question again in a few seconds, or click "Book a free consultation" below and our team will get back to you within 24 hours.'
    : 'Vielen Dank für Ihre Nachricht. Bitte senden Sie Ihre Frage in wenigen Sekunden erneut, oder klicken Sie unten auf „Kostenlos beraten lassen". Das AIONEX Team meldet sich innerhalb von 24 Stunden.';
}

const AI_PRICE_QUESTION_PATTERN = /preis|kost|kosten|budget|price|cost|pricing|€|eur|was kostet|wie viel|сколько|стоим|цена/i;
const AI_PRICE_CONTENT_PATTERN = /\d[\d\s.,]*\s*(?:€|eur|euro)|(?:ab|from|starting at)\s*\d|\b990\b|\b1[\s.]?990\b|\b2[\s.]?990\b|\b3[\s.]?990\b/i;

function isAiPriceQuestion(text) {
  return AI_PRICE_QUESTION_PATTERN.test(text || '');
}

function containsAiPriceInfo(text) {
  return AI_PRICE_CONTENT_PATTERN.test(text || '');
}

function getAiConsultationReply() {
  return isAiEnglish()
    ? 'Pricing depends on your individual project scope, so we discuss that in a free consultation. Click "Book a free consultation" below, or share your name, email and phone number and the AIONEX team will get back to you within 24 hours.'
    : 'Preise hängen vom individuellen Projektumfang ab und besprechen wir am besten in einer kostenlosen Erstberatung. Klicken Sie unten auf „Kostenlos beraten lassen“ oder nennen Sie mir Name, E-Mail und Telefon – das AIONEX Team meldet sich innerhalb von 24 Stunden.';
}

function sanitizeAssistantReply(content, userQuestion) {
  if (isAiPriceQuestion(userQuestion) || containsAiPriceInfo(content)) {
    return getAiConsultationReply();
  }
  return content;
}

function removePartialAssistantMessage(assistantElements) {
  assistantElements?.row?.remove();
}

async function appendAssistantReply(content) {
  const assistantMessage = { role: 'assistant', content };
  const assistantElements = createAiMessage(assistantMessage);
  aiChatMessages.appendChild(assistantElements.row);
  aiMessages.push(assistantMessage);
  saveAiMessages();
  scrollAiChat();
}

async function consumeAiChatStream(response, assistantMessage, assistantElements) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let complete = false;

  while (!complete) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let event;
      try {
        event = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      if (event.error) throw new Error(event.error);
      if (event.done) {
        complete = true;
        break;
      }
      if (event.content) {
        if (!assistantElements) {
          aiChatTyping.hidden = true;
          assistantElements = createAiMessage(assistantMessage, true);
          aiChatMessages.appendChild(assistantElements.row);
        }
        assistantMessage.content += event.content;
        assistantElements.bubble.textContent = assistantMessage.content;
        scrollAiChat();
      }
    }
  }

  if (assistantElements) assistantElements.bubble.classList.remove('streaming');
  return { assistantMessage, assistantElements };
}

async function requestAiChat(body, maxAttempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);
      const response = await fetch(`${AI_CHAT_API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      window.clearTimeout(timeout);
      if (response.status === 422) throw new Error('INVALID_HISTORY');
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        prewarmAiApi();
      }
    }
  }
  throw lastError;
}

function initAiChat() {
  setAiEngineStatus();
  prewarmAiApi();
}

async function sendAiMessage(text) {
  const content = text.trim();
  if (!content || aiStreaming || !aiChatForm || !aiChatInput) return;

  aiStreaming = true;
  showAiError();
  aiChatInput.value = '';
  aiChatInput.disabled = true;
  const submitButton = aiChatForm.querySelector('button');
  if (submitButton) submitButton.disabled = true;
  aiChat?.querySelector('.ai-chat-starters')?.classList.add('hidden');

  const userMessage = { role: 'user', content };
  aiMessages = sanitizeAiMessages([...aiMessages, userMessage]);
  renderAiHistory();
  saveAiMessages();
  sendChatLeadIfReady();
  aiChatTyping.hidden = false;
  scrollAiChat();

  let assistantMessage = { role: 'assistant', content: '' };
  let assistantElements = null;

  try {
    const response = await requestAiChat({
      messages: aiMessages,
      sessionId: getAiSessionId(),
      language: document.documentElement.lang || 'de',
    });
    setAiEngineStatus();
    ({ assistantMessage, assistantElements } = await consumeAiChatStream(
      response,
      assistantMessage,
      assistantElements
    ));
    assistantMessage.content = sanitizeAssistantReply(assistantMessage.content, content);
    if (assistantElements) assistantElements.bubble.textContent = assistantMessage.content;
    if (assistantMessage.content.trim()) {
      aiMessages = sanitizeAiMessages([...aiMessages, assistantMessage]);
      renderAiHistory();
      saveAiMessages();
      sendChatLeadIfReady();
    }
  } catch (error) {
    if (String(error?.message) === 'INVALID_HISTORY') {
      aiMessages = sanitizeAiMessages([userMessage]);
      saveAiMessages();
      try {
        const retryResponse = await requestAiChat({
          messages: aiMessages,
          sessionId: getAiSessionId(),
          language: document.documentElement.lang || 'de',
        }, 1);
        setAiEngineStatus();
        ({ assistantMessage, assistantElements } = await consumeAiChatStream(
          retryResponse,
          assistantMessage,
          assistantElements
        ));
        assistantMessage.content = sanitizeAssistantReply(assistantMessage.content, content);
        if (assistantElements) assistantElements.bubble.textContent = assistantMessage.content;
        if (assistantMessage.content.trim()) {
          aiMessages = sanitizeAiMessages([...aiMessages, assistantMessage]);
          renderAiHistory();
          saveAiMessages();
          sendChatLeadIfReady();
        }
        return;
      } catch {
        // fall through to graceful reply
      }
    }
    removePartialAssistantMessage(assistantElements);
    await appendAssistantReply(getAiGracefulReply());
  } finally {
    aiStreaming = false;
    aiChatTyping.hidden = true;
    aiChatInput.disabled = false;
    if (submitButton) submitButton.disabled = false;
    aiChatInput.focus();
    scrollAiChat();
  }
}

aiChatLaunch?.addEventListener('click', () => setAiChatOpen(true));
aiChatClose?.addEventListener('click', () => setAiChatOpen(false));
aiChatForm?.addEventListener('submit', event => {
  event.preventDefault();
  sendAiMessage(aiChatInput.value);
});
aiChat?.querySelectorAll('.ai-chat-starters button').forEach(button => {
  button.addEventListener('click', () => sendAiMessage(button.textContent));
});
aiChat?.querySelector('.ai-chat-consultation')?.addEventListener('click', () => {
  setAiChatOpen(false);
  openLeadModal(aiChatLaunch);
});

initAiChat();
