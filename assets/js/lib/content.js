// Content: content/manifest.json → sections → content/modules/<id>.json
let cache = null;

export async function loadContent() {
  if (cache) return cache;
  const manifest = await fetch('content/manifest.json', { cache: 'no-cache' }).then(r => r.json());
  manifest.modules = manifest.modules || (manifest.sections || []).flatMap(s => s.modules);
  const modules = await Promise.all(manifest.modules.map(id =>
    fetch(`content/modules/${id}.json`, { cache: 'no-cache' }).then(r => r.json()).then(m => normalize({ ...m, id: m.id || id }))
      .catch(e => { console.error('Module failed to load:', id, e); return null; })));
  cache = { manifest, modules: modules.filter(Boolean) };
  return cache;
}

function normalize(m) {
  m.rules = m.rules || [];
  m.questions = (m.questions || []).map((q, i) => ({ ...q, id: q.id || `${m.id}-q${i + 1}`, module: m.id, points: q.points || 1 }));
  return m;
}


export function allQuestions(content) { return content.modules.flatMap(m => m.questions); }
