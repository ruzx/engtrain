// Мелкие помощники интерфейса: создание элементов, формулы, пробирки.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Формула в разметке: Fe2(SO4)3, Fe^3+, SO4^2-, ->, v (осадок) , ^ (газ) не используются — пишем ↓ ↑.
// Цифра — индекс, если стоит после буквы, ) или ]. ^… — заряд до пробела.
export function fmt(src) {
  let out = '', i = 0;
  const s = String(src);
  while (i < s.length) {
    const ch = s[i];
    if (ch === '^') {
      let j = i + 1, z = '';
      while (j < s.length && /[0-9+\-−]/.test(s[j])) { z += s[j]; j++; }
      out += '<sup>' + esc(z.replace(/-/g, '−')) + '</sup>';
      i = j; continue;
    }
    if (/[0-9]/.test(ch) && i > 0 && /[A-Za-z)\]]/.test(s[i - 1])) {
      let j = i, d = '';
      while (j < s.length && /[0-9]/.test(s[j])) { d += s[j]; j++; }
      out += '<sub>' + d + '</sub>';
      i = j; continue;
    }
    if (ch === '-' && s[i + 1] === '>') { out += '→'; i += 2; continue; }
    out += esc(ch); i++;
  }
  return out;
}

// Text markup: **bold**, *italic*, `highlight`, "..." = blank
export function rich(text) {
  if (text == null) return '';
  return esc(String(text))
    .replace(/`(.+?)`/g, '<b class="hl">$1</b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br>');
}
export const R = (tag, text, attrs = {}) => h(tag, { ...attrs, html: rich(text) });
export const F = (formula, tag = 'span') => h(tag, { class: 'f', html: fmt(formula) });

export function toast(msg, ms = 1800) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function copyText(text) {
  try { navigator.clipboard.writeText(text).then(() => toast('Copied'), () => fallbackCopy(text)); }
  catch { fallbackCopy(text); }
}
function fallbackCopy(text) {
  const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }, text);
  document.body.append(ta); ta.select();
  try { document.execCommand('copy'); toast('Copied'); } catch { toast('Could not copy'); }
  ta.remove();
}

export const icons = {
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>',
};
