// All grammar rules in one place (cheat sheet). #rules or #rules-<topic>
import { h, rich } from '../lib/ui.js';
import { speak, SPEAKER } from '../lib/audio.js';

export function render(root, arg, { content }) {
  root.append(h('div', { class: 'row' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Cheat sheet'), h('h1', {}, 'Rules')), h('span', { class: 'spacer' }),
    h('button', { class: 'btn sm', onclick: () => window.print() }, 'Print')));
  root.append(h('div', { class: 'row', style: { margin: '12px 0 4px', gap: '6px' } }, content.modules.map(m =>
    h('a', { class: 'chip', href: '#rules', onclick: e => { e.preventDefault(); document.getElementById('r-' + m.id).scrollIntoView({ behavior: 'smooth' }); } }, m.title))));
  for (const m of content.modules) {
    root.append(h('h2', { id: 'r-' + m.id }, m.title),
      h('div', { class: 'card' }, m.rules.map(r => h('div', { class: 'rule' },
        h('p', { html: rich(r.rule) }),
        r.examples?.length ? h('div', { class: 'examples' }, r.examples.map(ex => h('button', { class: 'example sm', onclick: () => speak(ex) }, h('span', { class: 'say', html: SPEAKER }), h('span', {}, ex)))) : null)),
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('a', { class: 'btn sm', href: `#lesson-${m.id}` }, 'Lesson'), h('a', { class: 'btn sm primary', href: `#practice-${m.id}` }, 'Practice'))));
  }
  if (arg) setTimeout(() => document.getElementById('r-' + arg)?.scrollIntoView(), 50);
}
