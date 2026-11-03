(() => {
  'use strict';

  const API_URL = '/api/chat';
  const ROOT_ID = 'blackstone-ai-root';

  // Remove any older Blackstone Signature Properties & Investments widget versions so desktop and mobile use one design.
  [
    '#blackstone-ai-widget',
    '#blackstone-ai-chat',
    '.blackstone-ai-widget',
    '.blackstone-ai-chat',
    '.bs-ai-widget',
    '.ai-chat-widget'
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.id !== ROOT_ID) node.remove();
    });
  });

  if (document.getElementById(ROOT_ID)) return;

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <button class="bsai-launcher" type="button" aria-label="Open Blackstone Signature Properties & Investments AI">
      <span class="bsai-spark">✦</span> Ask Blackstone Signature Properties & Investments AI
    </button>
    <section class="bsai-panel" aria-label="Blackstone Signature Properties & Investments AI Concierge" aria-hidden="true">
      <header class="bsai-header">
        <img src="/assets/logo.png" alt="Blackstone Signature Properties & Investments logo" class="bsai-logo">
        <div>
          <strong>Blackstone Signature Properties & Investments</strong>
          <span>AI Concierge · Online 24/7</span>
        </div>
        <button class="bsai-close" type="button" aria-label="Close">×</button>
      </header>
      <div class="bsai-messages" aria-live="polite">
        <div class="bsai-message assistant">Hi! I’m the Blackstone Signature Properties & Investments AI Concierge. Ask about buying, selling, mortgage payments, investing, rentals, or property management.</div>
      </div>
      <div class="bsai-actions">
        <a href="/search.html">⌕ <span>Search for Homes</span></a>
        <a href="/home-value.html">$ <span>What’s My Home Worth?</span></a>
        <a href="/sellers.html">◆ <span>I Want to Sell My Home</span></a>
        <a class="featured" href="/property-management.html">▦ <span>Property Management</span></a>
        <a href="/contact.html">▣ <span>Schedule a Showing</span></a>
        <a href="/properties.html">↗ <span>Investment Property Analysis</span></a>
      </div>
      <form class="bsai-form">
        <label class="bsai-mic" aria-hidden="true">🎤</label>
        <input class="bsai-input" type="text" autocomplete="off" placeholder="Type a message…" aria-label="Message">
        <button class="bsai-send" type="submit" aria-label="Send">➤</button>
      </form>
      <p class="bsai-disclaimer">General information only. Contact Sal for advice specific to your situation.</p>
    </section>`;

  document.body.appendChild(root);

  const launcher = root.querySelector('.bsai-launcher');
  const panel = root.querySelector('.bsai-panel');
  const close = root.querySelector('.bsai-close');
  const form = root.querySelector('.bsai-form');
  const input = root.querySelector('.bsai-input');
  const messages = root.querySelector('.bsai-messages');
  const history = [];

  function setOpen(open) {
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) setTimeout(() => input.focus(), 50);
  }

  const APPROVED_LINK_HOSTS = new Set([
    'blackstonesignatureproperty.com',
    'www.blackstonesignatureproperty.com',
    'zillow.com',
    'www.zillow.com',
    'realtor.com',
    'www.realtor.com',
    'redfin.com',
    'www.redfin.com',
    'maps.google.com',
    'www.google.com'
  ]);

  function linkifyApprovedUrls(container, text) {
    const urlPattern = /(https:\/\/[^\s<>"']+)/gi;
    let lastIndex = 0;
    let match;

    while ((match = urlPattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) container.appendChild(document.createTextNode(before));

      let urlText = match[1];
      const trailing = urlText.match(/[),.!?;:]+$/)?.[0] || '';
      if (trailing) urlText = urlText.slice(0, -trailing.length);

      try {
        const url = new URL(urlText);
        if (APPROVED_LINK_HOSTS.has(url.hostname.toLowerCase())) {
          const link = document.createElement('a');
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = url.hostname.replace(/^www\./, '');
          link.className = 'bsai-inline-link';
          container.appendChild(link);
        } else {
          container.appendChild(document.createTextNode(urlText));
        }
      } catch {
        container.appendChild(document.createTextNode(urlText));
      }

      if (trailing) container.appendChild(document.createTextNode(trailing));
      lastIndex = match.index + match[1].length;
    }

    const rest = text.slice(lastIndex);
    if (rest) container.appendChild(document.createTextNode(rest));
  }

  function addMessage(text, role) {
    const item = document.createElement('div');
    item.className = `bsai-message ${role}`;

    if (role === 'assistant') {
      linkifyApprovedUrls(item, text);
    } else {
      item.textContent = text;
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  launcher.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));

  const savedLeads = new Set();
  function leadBits(message) {
    const email = (message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0].toLowerCase();
    const phoneRaw = (message.match(/(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/) || [''])[0];
    let phone = phoneRaw.replace(/\D/g, '');
    if (phone.length === 11 && phone.startsWith('1')) phone = phone.slice(1);
    if (phone.length !== 10) phone = '';
    return {
      email: email === 'gharibyar61@gmail.com' ? '' : email,
      phone: phone === '9257225144' ? '' : phone
    };
  }
  function leadName(message) {
    const match = message.match(/\b(?:my name is|i am|i'm|this is)\s+([A-Za-z][A-Za-z'’.-]{1,40}(?:\s+[A-Za-z][A-Za-z'’.-]{1,40}){0,2})/i);
    return match ? match[1].replace(/\s+/g, ' ').trim() : '';
  }
  function emailChatLead(fields) {
    let frame = document.getElementById('blackstone-email-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = frame.name = 'blackstone-email-frame';
      frame.hidden = true;
      frame.setAttribute('aria-hidden', 'true');
      document.body.appendChild(frame);
    }
    const formEl = document.createElement('form');
    formEl.method = 'POST';
    formEl.action = 'https://formsubmit.co/gharibyar61@gmail.com';
    formEl.target = 'blackstone-email-frame';
    formEl.hidden = true;
    const add = (key, value) => {
      const inputEl = document.createElement('input');
      inputEl.type = 'hidden';
      inputEl.name = key;
      inputEl.value = value;
      formEl.appendChild(inputEl);
    };
    add('_subject', 'Blackstone Signature Properties & Investments Website - Chatbot Lead');
    add('_template', 'table');
    add('_captcha', 'false');
    Object.entries(fields).forEach(([key, value]) => { if (value) add(key, value); });
    document.body.appendChild(formEl);
    HTMLFormElement.prototype.submit.call(formEl);
    setTimeout(() => formEl.remove(), 4000);
  }
  function mailtoFallback(fields) {
    const item = document.createElement('div');
    item.className = 'bsai-message assistant';
    item.append('We could not save your contact details automatically. Please ');
    const link = document.createElement('a');
    let body = '';
    Object.entries(fields).forEach(([key, value]) => { if (value) body += `${key}: ${value}\n`; });
    link.href = 'mailto:gharibyar61@gmail.com?subject=' + encodeURIComponent('Chatbot lead') + '&body=' + encodeURIComponent(body);
    link.textContent = 'email Sal';
    item.append(link, document.createTextNode('.'));
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }
  function captureChatLead(message) {
    const bits = leadBits(message);
    if (!bits.email && !bits.phone) return;
    const key = (bits.email || '') + '|' + (bits.phone || '');
    if (savedLeads.has(key)) return;
    savedLeads.add(key);
    const name = leadName(message) || 'Chatbot visitor';
    const fields = { name, email: bits.email, phone: bits.phone, message: message.slice(0, 2000), source: 'chatbot' };
    const body = {
      name, email: bits.email, phone: bits.phone, message: fields.message,
      page: location.pathname, source: 'chatbot', lead_type: 'contact', consent_to_contact: true, fields
    };
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        savedLeads.delete(key);
        throw new Error(result.error || 'save failed');
      }
      if (result.preview) {
        addMessage(result.message || 'Preview mode: the lead was not saved.', 'assistant');
        return;
      }
      emailChatLead(fields);
      addMessage('Thank you. Sal received your contact details and will follow up.', 'assistant');
    }).catch(() => {
      savedLeads.delete(key);
      mailtoFallback(fields);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';
    input.disabled = true;
    captureChatLead(message);

    const loading = addMessage('Thinking…', 'assistant loading');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });

      let data = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const reply = data.reply || 'I’m sorry, I could not create a response.';
      loading.textContent = '';
      linkifyApprovedUrls(loading, reply);
      loading.classList.remove('loading');

      history.push({ role: 'user', text: message });
      history.push({ role: 'assistant', text: reply });
      if (history.length > 12) history.splice(0, history.length - 12);
    } catch (error) {
      loading.textContent = `The AI connection failed: ${error.message}`;
      loading.classList.remove('loading');
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
})();
