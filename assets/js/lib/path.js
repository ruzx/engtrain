// Learning path: each section is a coloured unit; each topic = Learn (rules) → Practice.
import { h } from './ui.js';
import { store } from './store.js';

export const UNIT_COLORS = [['#58cc02', '#58a700'], ['#1cb0f6', '#1899d6'], ['#ce82ff', '#a568cc'], ['#ff9600', '#d97c00'], ['#ff4b4b', '#ea2b2b']];
const ICO = {
  learn: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-3H6.5"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M3 9h2v6H3zM19 9h2v6h-2zM6 6h3v12H6zM15 6h3v12h-3zM9 11h6v2H9z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.4l7-.8z"/></svg>',
};
const OFFS = [0, 46, 70, 46, 0, -46, -70, -46];

export function nodesFor(m) {
  const done = store.setting('lessons') || {};
  return [
    { kind: 'learn', title: m.title, href: `#lesson-${m.id}`, done: !!done[m.id], module: m.id },
    { kind: 'practice', title: 'Practice', href: `#practice-${m.id}`, done: store.mastery(m.questions.map(q => q.id)) >= 0.5, module: m.id },
  ];
}
export function nextNode(modules) {
  for (const m of modules) { const n = nodesFor(m).find(x => !x.done); if (n) return { ...n, title: n.kind === 'learn' ? m.title : `${m.title}: practice` }; }
  return { title: 'Mixed practice', href: '#practice-all' };
}

export function renderSection(sec, modules, colorIdx) {
  const [c, cd] = UNIT_COLORS[colorIdx % UNIT_COLORS.length];
  const nodes = modules.flatMap(nodesFor);
  const firstOpen = nodes.findIndex(n => !n.done);
  const total = modules.reduce((a, m) => a + m.questions.length, 0);
  const wrap = h('div');
  wrap.append(h('div', { class: 'unit', style: { background: c } },
    h('div', {}, h('h3', {}, sec.title), h('p', {}, `${modules.length} topics · ${total} exercises`)),
    h('a', { class: 'btn sm', href: `#practice-${modules.map(m => m.id).join('--')}` }, 'Mix')));
  const path = h('div', { class: 'path' });
  nodes.forEach((n, i) => {
    const isNext = i === firstOpen;
    path.append(h('a', { class: 'node' + (n.done ? ' done' : '') + (isNext ? ' next' : ''), href: n.href, style: { transform: `translateX(${OFFS[i % OFFS.length]}px)`, color: c } },
      isNext ? h('span', { class: 'start' }, 'Start') : null,
      h('span', { class: 'disc', style: { background: c, borderBottomColor: cd }, html: n.done ? ICO.star : ICO[n.kind] }),
      h('span', { class: 'lbl' }, n.title)));
  });
  wrap.append(path);
  return wrap;
}
