const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuBackdrop = document.querySelector('.mobile-menu-backdrop');
const themeButton = document.querySelector('.theme-toggle');

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

  submitButton.disabled = true;
  leadForm.classList.remove('has-error');
  try {
    const response = await fetch('/api/lead', {
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
const AI_CHAT_API = window.AIONEX_CHAT_API || 'http://127.0.0.1:8000';
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
    const response = await fetch('/api/lead', {
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
  aiMessages = JSON.parse(localStorage.getItem(AI_CHAT_STORAGE) || '[]');
  if (!Array.isArray(aiMessages)) aiMessages = [];
} catch {
  aiMessages = [];
}
renderAiHistory();

function setAiChatOpen(open) {
  aiChat?.classList.toggle('open', open);
  aiChatPanel?.setAttribute('aria-hidden', String(!open));
  aiChatLaunch?.setAttribute('aria-expanded', String(open));
  if (open) window.setTimeout(() => aiChatInput?.focus(), 180);
}

function scrollAiChat() {
  requestAnimationFrame(() => {
    if (aiChatBody) aiChatBody.scrollTop = aiChatBody.scrollHeight;
  });
}

function showAiError(message) {
  if (!aiChatError) return;
  aiChatError.textContent = message;
  aiChatError.hidden = !message;
}

function setAiEngineStatus(mode) {
  if (!aiEngineStatus) return;
  aiEngineStatus.textContent =
    mode === 'openai' ? 'OpenAI verbunden' :
    mode === 'fallback' ? 'Lokaler Modus' :
    'Verbindung wird geprüft…';
}

function getFallbackAiResponse(input, history = aiMessages) {
  const message = input.toLowerCase().trim();
  const conversation = history.map(item => item.content).join(' ').toLowerCase();
  const russian = /[а-яё]/i.test(input) || /[а-яё]/i.test(conversation);
  const english = !russian && /\b(what|how|price|website|crm|automation|cost|need|hello|sales)\b/i.test(input);
  const salesContext = /продаж|конверси|заявк|клиент|лид|sales|conversion|leads|umsatz|anfragen/.test(conversation);
  const affirmative = /^(да|конечно|хочу|давайте|yes|sure|okay|ja|gerne)\b/.test(message);

  if (/улучш.*продаж|продаж.*улучш|повыс.*продаж|больше.*заяв|конверси|sales|umsatz|mehr anfragen/.test(message) || (salesContext && /вы.*улучш|можете|поможете|реально|как именно/.test(message))) {
    if (russian) {
      return 'Да. Мы улучшаем не просто внешний вид сайта, а весь путь до заявки: усиливаем оффер и CTA, убираем точки отказа, добавляем аналитику, быструю обработку лидов и автоматические follow-up сообщения. Чтобы предложить конкретный план, скажите: у вас сейчас мало посетителей или посетители есть, но редко оставляют заявки?';
    }
    if (english) {
      return 'Yes. We improve the full path from visitor to qualified lead: offer clarity, CTAs, conversion friction, analytics, instant lead handling, and automated follow-ups. Do you currently lack traffic, or do you have visitors who rarely submit an enquiry?';
    }
    return 'Ja. Wir optimieren nicht nur das Design, sondern den gesamten Weg vom Besucher zur qualifizierten Anfrage: Angebot, CTAs, Conversion-Hürden, Analytics, schnelle Lead-Bearbeitung und automatisierte Follow-ups. Fehlt aktuell eher Traffic oder kommen Besucher, die selten anfragen?';
  }

  if (salesContext && /посетител|трафик|заход|клики|traffic/.test(message)) {
    if (russian) return 'Понял: тогда сначала нужно определить качество и источник трафика, а затем проверить, соответствует ли страница ожиданиям посетителей. Мы настроим аналитику и предложим изменения по офферу, структуре и CTA. Примерно сколько посетителей приходит на сайт в месяц?';
    if (english) return 'Understood. We should first assess traffic quality and sources, then check whether the page matches visitor intent. We can set up analytics and improve the offer, structure, and CTAs. Roughly how many visitors do you receive per month?';
    return 'Verstanden. Dann prüfen wir zuerst Qualität und Quellen des Traffics und anschließend, ob die Seite die Erwartungen der Besucher erfüllt. Wir können Analytics einrichten und Angebot, Struktur und CTAs optimieren. Wie viele Besucher kommen ungefähr pro Monat?';
  }

  if (salesContext && /не остав|мало заяв|нет заяв|конверт|rarely|few leads|selten/.test(message)) {
    if (russian) return 'Тогда основная задача — повышение конверсии. Мы проанализируем первый экран, оффер, доверие, формы, CTA и скорость реакции после заявки, а затем внедрим измеримые улучшения. Пришлите адрес сайта или кратко опишите вашу услугу и целевую аудиторию.';
    if (english) return 'Then the main task is conversion improvement. We would review the hero, offer, trust signals, forms, CTAs, and response speed, then implement measurable changes. Share the website URL or briefly describe your service and target audience.';
    return 'Dann liegt der Schwerpunkt auf der Conversion. Wir analysieren Hero, Angebot, Vertrauenselemente, Formulare, CTAs und Reaktionszeit und setzen messbare Verbesserungen um. Teilen Sie die Website oder beschreiben Sie kurz Leistung und Zielgruppe.';
  }

  if (affirmative && salesContext) {
    if (russian) return 'Отлично. Для первого разбора мне нужны три вещи: чем занимается компания, кто ваш основной клиент и откуда сейчас приходят посетители. После этого я предложу наиболее подходящий сценарий улучшения продаж.';
    if (english) return 'Great. For an initial assessment I need three things: what your company offers, who the primary customer is, and where visitors currently come from. Then I can suggest the best sales-improvement approach.';
    return 'Sehr gut. Für eine erste Einschätzung brauche ich drei Dinge: Ihr Angebot, Ihre Hauptzielgruppe und die aktuellen Besucherquellen. Danach kann ich den passenden Ansatz zur Vertriebsoptimierung empfehlen.';
  }

  if (/preis|kost|price|cost|€|евро|стоим/.test(message)) {
    if (russian) return 'Лендинги и сайты начинаются от 990 €, AI-автоматизация и чат-боты — от 990 €, CRM — от 1 990 €, клиентские порталы — от 2 990 €, индивидуальные веб-приложения — от 3 990 €. Точная стоимость зависит от задачи и объёма.';
    if (english) return 'Landing pages and websites start at €990, AI automation and chatbots at €990, CRM systems at €1,990, customer portals at €2,990, and custom web apps at €3,990. Exact pricing depends on scope.';
    return 'Landingpages und Websites starten ab 990 €, KI-Automatisierung und Chatbots ab 990 €, CRM-Systeme ab 1.990 €, Kundenportale ab 2.990 € und individuelle Web-Apps ab 3.990 €. Der genaue Preis hängt vom Umfang ab.';
  }
  if (/crm|kundenportal|portal|портал/.test(message)) {
    if (russian) return 'Мы создаём CRM и клиентские порталы, которые объединяют заявки, клиентов, задачи и автоматические процессы в одном месте. Какие процессы вы сейчас ведёте вручную?';
    if (english) return 'We build CRM systems and customer portals that centralize leads, clients, tasks, and automated workflows. Which processes are currently handled manually?';
    return 'Wir entwickeln CRM-Systeme und Kundenportale, die Leads, Kunden, Aufgaben und automatisierte Abläufe zentral verbinden. Welche Prozesse laufen aktuell noch manuell?';
  }
  if (/automat|ki|ai|chatbot|prozess|автомат|бот/.test(message)) {
    if (russian) return 'AIONEX автоматизирует обработку заявок, квалификацию лидов, ответы клиентам, CRM, предложения и внутренние процессы. Какую повторяющуюся задачу ваша команда хотела бы убрать первой?';
    if (english) return 'AIONEX automates lead capture, qualification, customer replies, CRM updates, proposals, and internal workflows. Which repetitive task would your team like to eliminate first?';
    return 'AIONEX automatisiert Lead-Erfassung, Qualifizierung, Kundenantworten, CRM-Pflege, Angebote und interne Abläufe. Welche wiederkehrende Aufgabe möchten Sie zuerst eliminieren?';
  }
  if (/website|webseite|landing|лендинг|сайт/.test(message)) {
    if (russian) return 'Да, AIONEX создаёт сайты и лендинги с фокусом на заявки, доверие и конверсию. Какая главная цель сайта: больше обращений, продажа конкретной услуги или автоматизация обработки клиентов?';
    if (english) return 'Yes — AIONEX builds websites and landing pages focused on enquiries, trust, and conversion. Is the main goal more leads, selling a specific service, or automating customer handling?';
    return 'Ja – AIONEX entwickelt Websites und Landingpages mit Fokus auf Anfragen, Vertrauen und Conversion. Geht es primär um mehr Leads, den Verkauf einer Leistung oder die Automatisierung der Kundenbearbeitung?';
  }
  if (/beratung|termin|call|meeting|звон|консультац/.test(message)) {
    if (russian) return 'Конечно. Нажмите «Kostenlos beraten lassen» под чатом и оставьте имя, телефон и email. Команда AIONEX свяжется с вами в течение 24 часов.';
    if (english) return 'Of course. Click “Kostenlos beraten lassen” below the chat and leave your name, phone number, and email. The AIONEX team will contact you within 24 hours.';
    return 'Sehr gern. Klicken Sie unter dem Chat auf „Kostenlos beraten lassen“ und hinterlassen Sie Name, Telefonnummer und E-Mail. Das AIONEX Team meldet sich innerhalb von 24 Stunden.';
  }
  if (russian) return 'Я помогу подобрать решение AIONEX. Опишите желаемый результат для бизнеса — например, больше заявок, меньше ручной работы или единая система для клиентов — и я задам следующий конкретный вопрос.';
  if (english) return 'I can help identify the right AIONEX solution. Describe the business outcome you want — more leads, less manual work, or one central customer system — and I will ask the next specific question.';
  return 'Ich helfe Ihnen, die passende AIONEX Lösung zu finden. Beschreiben Sie das gewünschte Geschäftsergebnis – mehr Anfragen, weniger manuelle Arbeit oder ein zentrales Kundensystem – und ich stelle die nächste konkrete Frage.';
}

async function streamFallbackAiResponse(content, assistantMessage, assistantElements) {
  aiChatTyping.hidden = true;
  if (!assistantElements) {
    assistantElements = createAiMessage(assistantMessage, true);
    aiChatMessages.appendChild(assistantElements.row);
  } else {
    assistantMessage.content = '';
    assistantElements.bubble.textContent = '';
  }
  const words = content.split(' ');
  for (let index = 0; index < words.length; index += 1) {
    assistantMessage.content += `${index ? ' ' : ''}${words[index]}`;
    assistantElements.bubble.textContent = assistantMessage.content;
    if (index % 3 === 0) {
      scrollAiChat();
      await new Promise(resolve => setTimeout(resolve, 22));
    }
  }
  assistantElements.bubble.classList.remove('streaming');
  aiMessages.push(assistantMessage);
  saveAiMessages();
}

async function sendAiMessage(text) {
  const content = text.trim();
  if (!content || aiStreaming) return;

  aiStreaming = true;
  showAiError('');
  aiChatInput.value = '';
  aiChatInput.disabled = true;
  aiChatForm.querySelector('button').disabled = true;
  aiChat?.querySelector('.ai-chat-starters')?.classList.add('hidden');

  const userMessage = { role: 'user', content };
  aiMessages.push(userMessage);
  aiChatMessages.appendChild(createAiMessage(userMessage).row);
  saveAiMessages();
  sendChatLeadIfReady();
  aiChatTyping.hidden = false;
  scrollAiChat();

  let assistantMessage = { role: 'assistant', content: '' };
  let assistantElements = null;

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${AI_CHAT_API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages: aiMessages,
        sessionId: getAiSessionId(),
        language: document.documentElement.lang || 'de',
      }),
    });
    window.clearTimeout(timeout);
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
    setAiEngineStatus('openai');

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
        const event = JSON.parse(line.slice(6));
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
    if (assistantMessage.content) {
      aiMessages.push(assistantMessage);
      saveAiMessages();
      sendChatLeadIfReady();
    }
  } catch (error) {
    setAiEngineStatus('fallback');
    await streamFallbackAiResponse(
      getFallbackAiResponse(content, aiMessages),
      assistantMessage,
      assistantElements
    );
  } finally {
    aiStreaming = false;
    aiChatTyping.hidden = true;
    aiChatInput.disabled = false;
    aiChatForm.querySelector('button').disabled = false;
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
