// Progress: topics, confidence calibration, settings, report for the teacher, data transfer.
import { h, copyText, toast, rich } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { sync } from '../lib/sync.js';
import { game } from '../lib/game.js';
import { audioOn, setAudio } from '../lib/audio.js';

export function render(root, _arg, { content }) {
  const log = store.data.log;
  root.append(h('div', { class: 'eyebrow' }, 'Progress'), h('h1', {}, 'Progress'));

  // Settings
  const sw = (label, get, set) => { const c = h('input', { type: 'checkbox' }); c.checked = get(); c.onchange = () => set(c.checked); return h('label', { class: 'unsure', style: { marginTop: 0, color: 'var(--text)' } }, c, label); };
  root.append(h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'row', style: { gap: '22px' } },
    sw('Sound effects', () => game.soundOn, v => { if (v !== game.soundOn) game.toggleSound(); }),
    sw('Read sentences aloud', audioOn, setAudio))));

  if (!log.length) { root.append(h('p', { class: 'muted', style: { marginTop: '20px' } }, 'No answers yet. Start with a lesson.'), h('a', { class: 'btn primary', href: '#home' }, 'Start')); return; }

  const week = Date.now() - 7 * 864e5;
  const recent = log.filter(l => l.t >= week);
  const acc = arr => arr.length ? Math.round(arr.reduce((s, l) => s + l.ok, 0) / arr.length * 100) : 0;
  root.append(h('div', { class: 'grid g4', style: { marginTop: '16px' } },
    stat(String(log.length), 'answers'), stat(String(recent.length), 'this week'), stat(`${acc(recent.length ? recent : log)}%`, 'accuracy this week'), stat('🔥 ' + store.streak(), 'day streak')));

  root.append(h('h2', {}, 'Topics'));
  const card = h('div', { class: 'card' });
  const rows = content.modules.map(m => { const t = log.filter(l => l.module === m.id && l.kind !== 'l').slice(-30); return { m, mastery: store.mastery(m.questions.map(q => q.id)), acc: acc(t), n: t.length }; });
  for (const r of rows) card.append(h('div', { class: 'skill-row' },
    h('a', { href: `#practice-${r.m.id}` }, r.m.title),
    h('div', { class: 'bar thin' }, h('i', { style: { width: Math.round(r.mastery * 100) + '%', background: r.n && r.acc < 60 ? 'var(--red)' : undefined } })),
    h('span', { class: 'muted' }, r.n ? `${r.acc}%` : '—')));
  card.append(h('p', { class: 'meta', style: { marginTop: '8px' } }, 'Bar: exercises you know well (answered correctly after spaced review). Number: accuracy of recent answers.'));
  root.append(card);

  const c = { sr: 0, sw: 0, ur: 0, uw: 0 };
  for (const l of log.slice(-300)) { if (l.kind === 'l') continue; if (l.sure) l.ok === 1 ? c.sr++ : c.sw++; else l.ok === 1 ? c.ur++ : c.uw++; }
  root.append(h('h2', {}, 'Confidence'), h('div', { class: 'card' },
    h('div', { class: 'calib' },
      h('div', { class: 'h' }), h('div', { class: 'h' }, 'Correct'), h('div', { class: 'h' }, 'Wrong'),
      h('div', { class: 'h', style: { textAlign: 'right' } }, 'Sure'), h('div', {}, String(c.sr)), h('div', { class: c.sw ? 'danger' : '' }, String(c.sw)),
      h('div', { class: 'h', style: { textAlign: 'right' } }, 'Not sure'), h('div', {}, String(c.ur)), h('div', {}, String(c.uw))),
    h('p', { class: 'meta', style: { marginTop: '10px' } }, 'Confident mistakes matter most — they show a rule learnt wrongly. They come back for review the same day.')));

  const qmap = new Map(content.modules.flatMap(m => m.questions).map(q => [q.id, q]));
  const hard = Object.entries(store.data.items).filter(([id, it]) => qmap.has(id) && !it.lastOk).map(([id]) => qmap.get(id)).slice(0, 8);
  if (hard.length) root.append(h('h2', {}, 'Recent mistakes'), h('div', { class: 'card' },
    h('ul', { class: 'clean' }, hard.map(q => h('li', { class: 'small', html: rich(q.text.replace(/%\d/g, '…')) + ' → <b>' + q.answer[0] + '</b>' }))),
    h('div', { class: 'actions', style: { marginTop: '10px' } }, h('a', { class: 'btn primary', href: '#review' }, 'Review'))));

  root.append(h('h2', {}, 'Report and data'), h('div', { class: 'card' },
    sync.enabled ? h('p', { style: { marginTop: 0 } }, `Results are sent to your teacher automatically${store.setting('name') ? ' (' + store.setting('name') + ')' : ''}.`,
      sync.pending() ? h('span', { class: 'muted' }, ` Waiting to send: ${sync.pending()}.`) : null, ' ',
      h('button', { class: 'btn sm ghost', onclick: () => { store.setting('name', ''); location.hash = '#home'; } }, 'Change name')) : null,
    h('p', { class: 'meta', style: { marginTop: 0 } }, 'Progress is stored in this browser. Copy the report for your teacher or move your data to another device.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => copyText(report(rows, c, recent, log)) }, 'Copy report'),
      h('button', { class: 'btn', onclick: () => copyText(store.export()) }, 'Copy data'),
      h('button', { class: 'btn', onclick: importData }, 'Load data'))));

  root.append(h('p', { class: 'meta', style: { marginTop: '24px' } }, 'Exercises based on ', h('a', { href: 'https://github.com/Areso/English-exercises', target: '_blank', rel: 'noopener' }, 'Areso/English-exercises'), ' (AGPL-3.0), reviewed and edited.'));

  function importData() {
    const box = h('textarea', { style: { width: '100%', height: '110px', marginTop: '10px', font: 'inherit', fontSize: '13px' }, placeholder: 'Paste your data here' });
    root.lastChild.append(box, h('button', { class: 'btn primary sm', style: { marginTop: '8px' }, onclick: () => { try { store.import(box.value); toast('Loaded'); setTimeout(() => location.reload(), 500); } catch { toast('Wrong format'); } } }, 'Load'));
  }
}
function stat(v, l) { return h('div', { class: 'stat' }, h('b', {}, v), h('span', {}, l)); }
function report(rows, c, recent, log) {
  const lines = [`English progress — ${new Date().toLocaleDateString()}`, `Answers this week: ${recent.length}, total: ${log.length}`, '', 'Topics (known / recent accuracy):'];
  for (const r of rows) if (r.n) lines.push(`• ${r.m.title}: ${Math.round(r.mastery * 100)}% / ${r.acc}%`);
  lines.push('', `Confident mistakes: ${c.sw}; correct but unsure: ${c.ur}`);
  return lines.join('\n');
}
