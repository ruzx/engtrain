// Spaced review: everything that is due, mixed across topics.
import { h, shuffle } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allQuestions } from '../lib/content.js';
import { renderQuestion } from '../lib/quiz.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

export function render(root, _arg, { content }) {
  const qs = allQuestions(content);
  const byId = new Map(qs.map(q => [q.id, q]));
  let queue = shuffle(store.dueIds(id => byId.has(id)).map(id => byId.get(id))).slice(0, 20);
  let fresh = false;
  if (!queue.length) { queue = shuffle(qs.filter(q => !store.seen(q.id))).slice(0, 8); fresh = true; }
  if (!queue.length) {
    root.append(h('div', { class: 'card done-card' }, h('h1', {}, 'All caught up'), h('p', { class: 'muted' }, 'New reviews will appear on schedule.'), h('a', { class: 'btn primary', href: '#practice-all' }, 'Extra practice')));
    return;
  }
  const s = openSession(root);
  if (fresh) s.stage.before(h('p', { class: 'muted', style: { textAlign: 'center', margin: '-10px 0 16px' } }, 'Nothing due — here are some new exercises.'));
  let i = 0, right = 0, xp = 0;
  const t0 = Date.now(), total = queue.length;
  const next = () => {
    s.progress(i / total);
    if (i >= total) return s.finish({ title: 'Review complete!', xp, acc: Math.round(right / total * 100), time: fmtTime(Date.now() - t0), buttons: [h('a', { class: 'btn primary', href: '#home' }, 'Continue')] });
    s.stage.replaceChildren(renderQuestion(queue[i], { session: s, onNext: r => { if (r.full) right++; xp += r.xp; i++; next(); } }));
    window.scrollTo({ top: 0 });
  };
  next();
  return closeSession;
}
