// Service worker: offline use. Code — cache first with background refresh; content and pages — network first.
// New topics listed in content/manifest.json are cached automatically. Audio files are cached as they are played.
const CACHE = 'eng-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'assets/css/style.css', 'assets/js/app.js',
  'assets/js/lib/ui.js', 'assets/js/lib/store.js', 'assets/js/lib/content.js', 'assets/js/lib/game.js', 'assets/js/lib/session.js',
  'assets/js/lib/sync.js', 'assets/js/lib/quiz.js', 'assets/js/lib/english.js', 'assets/js/lib/audio.js', 'assets/js/lib/path.js',
  'assets/js/views/home.js', 'assets/js/views/lesson.js', 'assets/js/views/practice.js', 'assets/js/views/review.js',
  'assets/js/views/blitz.js', 'assets/js/views/rules.js', 'assets/js/views/progress.js',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'content/manifest.json',
];
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(SHELL);
  try {
    const m = await (await fetch('content/manifest.json', { cache: 'no-cache' })).json();
    const ids = m.modules || (m.sections || []).flatMap(s => s.modules);
    await c.addAll(ids.map(id => `content/modules/${id}.json`));
  } catch {}
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const netFirstReq = e.request.mode === 'navigate' || url.pathname.includes('/content/');
  e.respondWith(netFirstReq ? netFirst(e.request) : cacheFirst(e.request));
});
async function netFirst(req) {
  const c = await caches.open(CACHE);
  try { const res = await fetch(req, { cache: 'no-cache' }); if (res.ok) c.put(req, res.clone()); return res; }
  catch { return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html')); }
}
async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req, { ignoreSearch: true });
  const update = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await update) || new Response('', { status: 504 });
}
