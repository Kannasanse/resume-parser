const BASE = '/api/v1/portfolios';

async function req(path, opts = {}) {
  const url = path.startsWith('/') ? path : `${BASE}${path ? '/' + path : ''}`;
  const res = await fetch(url.startsWith('http') ? url : `${BASE}${path.startsWith('/') ? path : '/' + path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body;
}

export const listPortfolios   = ()         => fetch(BASE, { headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
export const createPortfolio  = (data)     => fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const getPortfolio     = (id)       => fetch(`${BASE}/${id}`, { headers: { 'Content-Type': 'application/json' } }).then(r => r.json());
export const updatePortfolio  = (id, data) => fetch(`${BASE}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const deletePortfolio  = (id)       => fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(r => r.json());
export const checkSlug        = (slug, id) => fetch(`${BASE}/check-slug?slug=${encodeURIComponent(slug)}${id ? `&id=${id}` : ''}`).then(r => r.json());

export const listSections     = (pid)            => fetch(`${BASE}/${pid}/sections`).then(r => r.json());
export const createSection    = (pid, data)      => fetch(`${BASE}/${pid}/sections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const updateSection    = (pid, sid, data) => fetch(`${BASE}/${pid}/sections/${sid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteSection    = (pid, sid)       => fetch(`${BASE}/${pid}/sections/${sid}`, { method: 'DELETE' }).then(r => r.json());
export const reorderSections  = (pid, orders)    => fetch(`${BASE}/${pid}/sections/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders }) }).then(r => r.json());

export const listProjects     = (pid)            => fetch(`${BASE}/${pid}/projects`).then(r => r.json());
export const createProject    = (pid, data)      => fetch(`${BASE}/${pid}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const updateProject    = (pid, projId, data) => fetch(`${BASE}/${pid}/projects/${projId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteProject    = (pid, projId)       => fetch(`${BASE}/${pid}/projects/${projId}`, { method: 'DELETE' }).then(r => r.json());
