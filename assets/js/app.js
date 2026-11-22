// Router. Address: #view or #view-argument (e.g. #lesson-articles, #practice-all).
// New view = file assets/js/views/<view>.js exporting render(root, arg, ctx) + its name in VIEWS.
import { loadContent } from './lib/content.js';
import { h } from './lib/ui.js';
import { store } from './lib/store.js';
import { sync } from './lib/sync.js';
import { refreshTop } from './lib/game.js';
import { initAudio } from './lib/audio.js';

const VIEWS = ['home', 'lesson', 'practice', 'review', 'blitz', 'rules', 'progress'];
const app = document.getElementById('app');
const nativeAppend = app.append.bind(app);
app.append = (...n) => nativeAppend(...n.filter(x => x != null && x !== false));
let cleanup = null;

// Personal link: ?s=Name — student name for reports
try {
  const q = new URLSearchParams(location.search);
  if (q.get('s')) { store.setting('name', q.get('s').trim().slice(0, 80)); history.replaceState(null, '', location.pathname + location.hash); }
} catch {}

const themeKey = 'eng-theme';
function applyTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem(themeKey, t); } catch {} }
let theme; try { theme = localStorage.getItem(themeKey); } catch {}
applyTheme(theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
document.getElementById('themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

function parse() {
  const raw = decodeURIComponent(location.hash.slice(1)) || 'home';
  const i = raw.indexOf('-');
  const view = i < 0 ? raw : raw.slice(0, i), arg = i < 0 ? '' : raw.slice(i + 1);
  return VIEWS.includes(view) ? { view, arg } : { view: 'home', arg: '' };
}

let ready = false;
async function route() {
  const { view, arg } = parse();
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  if (typeof cleanup === 'function') { try { cleanup(); } catch {} }
  cleanup = null;
  document.body.classList.remove('in-session');
  refreshTop();
  try {
    const content = await loadContent();
    if (!ready) {
      ready = true;
      initAudio(content.manifest.audio);
      sync.init(content.manifest.reportUrl, () => store.setting('name'));
      store.onRecord(ev => { const m = content.modules.find(x => x.id === ev.module); sync.push({ ...ev, moduleName: m ? m.title : ev.module, skillName: m ? m.title : ev.skill }); });
    }
    const mod = await import(`./views/${view}.js`);
    app.replaceChildren();
    cleanup = await mod.render(app, arg, { content });
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    app.replaceChildren(h('div', { class: 'card' }, h('h3', {}, 'Could not load the page'),
      h('p', { class: 'muted small' }, 'Open the site through a web server (GitHub Pages or python -m http.server), not as a local file. Check content/manifest.json for JSON errors.'),
      h('pre', { class: 'small muted' }, String(e && e.message || e))));
  }
}
addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
