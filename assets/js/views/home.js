import { h, icons } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allQuestions } from '../lib/content.js';
import { sync } from '../lib/sync.js';
import { game, DAILY_GOAL } from '../lib/game.js';
import { renderSection, nextNode } from '../lib/path.js';

export function render(root, _arg, { content }) {
  const ids = allQuestions(content).map(x => x.id);
  const due = store.dueIds(id => ids.includes(id)).length;

  if (sync.enabled && !store.setting('name')) {
    const inp = h('input', { class: 'text-input', placeholder: 'First and last name', style: { flex: 1, minWidth: '180px', width: 'auto', fontSize: '18px' } });
    root.append(h('div', { class: 'card', style: { marginBottom: '18px' } },
      h('h3', {}, 'What is your name?'),
      h('p', { class: 'meta', style: { marginTop: 0 } }, 'Your teacher will see your results under this name.'),
      h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', onclick: () => { if (inp.value.trim()) { store.setting('name', inp.value.trim()); location.reload(); } } }, 'Save'))));
  }

  const byId = Object.fromEntries(content.modules.map(m => [m.id, m]));
  const sections = content.manifest.sections || [{ title: 'Topics', modules: content.modules.map(m => m.id) }];
  const left = h('div');
  sections.forEach((s, i) => left.append(renderSection(s, s.modules.map(id => byId[id]).filter(Boolean), i)));

  const nxt = nextNode(sections.flatMap(s => s.modules.map(id => byId[id]).filter(Boolean)));
  const xp = game.xpToday, frac = Math.min(1, xp / DAILY_GOAL);
  root.append(h('div', { class: 'hero' }, left, h('div', { class: 'grid', style: { position: 'sticky', top: '84px' } },
    h('a', { class: 'btn green wide', href: nxt.href, style: { padding: '16px' } }, 'Continue: ', nxt.title),
    h('div', { class: 'card' },
      h('div', { class: 'goal' }, h('div', { class: 'ring', html: ring(frac) }),
        h('div', {}, h('h3', { style: { margin: 0 } }, 'Daily goal'), h('div', { class: 'meta' }, `${xp} / ${DAILY_GOAL} XP`))),
      h('div', { class: 'stats3', style: { marginTop: '14px' } }, stat('🔥 ' + store.streak(), 'day streak'), stat('⚡ ' + game.xpTotal, 'total XP'), stat('⭐ ' + game.level, 'level'))),
    h('div', { class: 'grid side-tools' },
      tool('#review', icons.repeat, '#ff9600', 'Review', due ? `${due} due today` : 'All caught up'),
      tool('#blitz', BOLT, '#ce82ff', 'Blitz', '10 questions, fast'),
      tool('#practice-all', icons.shuffle, '#1cb0f6', 'Mixed practice', 'All topics'),
      tool('#rules', icons.book, '#58cc02', 'Rules', 'All grammar notes')))));
}

function tool(href, ico, color, title, text) {
  return h('a', { class: 'card tool', href }, h('div', { class: 'ico', style: { background: color }, html: ico }), h('div', {}, h('h3', { style: { margin: 0 } }, title), h('div', { class: 'meta' }, text)));
}
const BOLT = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>';
function stat(v, l) { return h('div', { class: 'stat' }, h('b', {}, v), h('span', {}, l)); }
function ring(f) {
  const r = 30, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/><circle cx="36" cy="36" r="${r}" fill="none" stroke="#ffc800" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 36 36)"/><text x="36" y="42" text-anchor="middle" font-size="18" font-weight="900" fill="currentColor">${Math.round(f * 100)}%</text></svg>`;
}
