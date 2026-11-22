// Каркас «сессии» (урок, тренировка, повторение): полоса прогресса, крестик, комбо, нижняя панель, финал.
import { h } from './ui.js';
import { game, sound, confetti } from './game.js';

const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const FIRE = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#ff9600"/><path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1 1-2 1-3 1 1 2 0 2-2z" fill="#ffc800"/></svg>';

export function openSession(root, { onClose } = {}) {
  document.body.classList.add('in-session');
  game.resetCombo();
  const bar = h('i', { style: { width: '0%' } });
  const combo = h('div', { class: 'combo' });
  const top = h('div', { class: 'session-top' },
    h('button', { class: 'x', title: 'Exit', html: X, onclick: () => (onClose ? onClose() : (location.hash = '#home')) }),
    h('div', { class: 'bar' }, bar), combo);
  const stage = h('div');
  const dockSlot = h('div');
  root.append(top, stage, dockSlot);
  const s = {
    stage,
    progress(frac) { bar.style.width = Math.round(Math.min(1, frac) * 100) + '%'; },
    combo() {
      if (game.combo >= 2) { combo.innerHTML = FIRE + game.combo; combo.classList.remove('pop'); void combo.offsetWidth; combo.classList.add('pop'); }
      else combo.innerHTML = '';
    },
    dock(el) { dockSlot.replaceChildren(el || ''); },
    finish({ title = 'Great job!', xp = 0, acc = null, time = null, extra = [], buttons = [] }) {
      top.style.visibility = 'hidden';
      dockSlot.replaceChildren();
      sound('finish'); confetti();
      const tile = (color, head, val, icon) => h('div', { class: 'tile', style: { borderColor: color, background: color } }, h('div', { class: 'h' }, head), h('b', { style: { color } , html: (icon || '') + val }));
      stage.replaceChildren(h('div', { class: 'finish' },
        h('div', { class: 'trophy', html: TROPHY }),
        h('h1', {}, title),
        h('div', { class: 'tiles' },
          tile('#ffc800', 'XP', '+' + xp),
          acc != null ? tile(acc >= 80 ? '#58cc02' : acc >= 50 ? '#1cb0f6' : '#ff9600', 'Accuracy', acc + '%') : null,
          time != null ? tile('#1cb0f6', 'Time', time) : null),
        ...extra,
        h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } }, ...buttons)));
    },
  };
  return s;
}
export function closeSession() { document.body.classList.remove('in-session'); }

export function fmtTime(ms) { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

const TROPHY = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#fff4cc"/><path d="M38 30h44v18a22 22 0 0 1-44 0z" fill="#ffc800"/><path d="M38 34H26a12 12 0 0 0 14 16M82 34h12a12 12 0 0 1-14 16" fill="none" stroke="#e5a400" stroke-width="5" stroke-linecap="round"/><rect x="54" y="68" width="12" height="14" fill="#e5a400"/><rect x="42" y="82" width="36" height="10" rx="4" fill="#ffc800"/><path d="M50 40l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff" opacity=".85" transform="translate(6 -4) scale(.9)"/></svg>`;
