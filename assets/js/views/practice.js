// Practice: 10 questions; due first; interleaved. #practice-all · #practice-<topic> · #practice-<a>--<b>
import { h } from '../lib/ui.js';
import { allQuestions } from '../lib/content.js';
import { renderQuestion, buildSession } from '../lib/quiz.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

export function render(root, arg, { content }) {
  const ids = (arg || 'all').split('--');
  const pool = ids[0] === 'all' ? allQuestions(content) : content.modules.filter(m => ids.includes(m.id)).flatMap(m => m.questions);
  start();
  function start() {
    root.replaceChildren();
    const s = openSession(root);
    const list = buildSession(pool, Math.min(10, pool.length));
    if (!list.length) { s.stage.append(h('p', { class: 'muted' }, 'No exercises yet.')); return; }
    const st = { score: 0, xp: 0, sureWrong: 0, t0: Date.now() };
    let i = 0;
    const next = () => {
      s.progress(i / list.length);
      if (i >= list.length) return finish();
      s.stage.replaceChildren(renderQuestion(list[i], { session: s, onNext: r => { st.score += r.score; st.xp += r.xp; if (!r.full && r.sure) st.sureWrong++; i++; next(); } }));
      window.scrollTo({ top: 0 });
    };
    next();
    function finish() {
      const acc = Math.round(st.score / list.length * 100);
      s.finish({
        title: acc >= 80 ? 'Excellent practice!' : acc >= 50 ? 'Good work!' : 'Practice complete',
        xp: st.xp, acc, time: fmtTime(Date.now() - st.t0),
        extra: st.sureWrong ? [h('p', { class: 'muted' }, `Confident mistakes: ${st.sureWrong}. They will come back for review today.`)] : [],
        buttons: [h('a', { class: 'btn', href: '#home' }, 'Done'), h('button', { class: 'btn primary', onclick: start }, '10 more')],
      });
    }
  }
  return closeSession;
}
