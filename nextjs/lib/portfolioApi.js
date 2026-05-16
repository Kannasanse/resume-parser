import { authHeaders } from './authToken.js';

const BASE = '/api/v1/portfolios';

async function req(path, opts = {}) {
  const url = `${BASE}${path.startsWith('/') ? path : path ? '/' + path : ''}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...authHeaders(), ...opts.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body;
}

export const listPortfolios   = ()         => req('');
export const createPortfolio  = (data)     => req('', { method: 'POST', body: JSON.stringify(data) });
export const getPortfolio     = (id)       => req(`/${id}`);
export const updatePortfolio  = (id, data) => req(`/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePortfolio  = (id)       => req(`/${id}`, { method: 'DELETE' });
export const checkSlug        = (slug, id) => req(`/check-slug?slug=${encodeURIComponent(slug)}${id ? `&id=${id}` : ''}`);

export const listSections     = (pid)            => req(`/${pid}/sections`);
export const createSection    = (pid, data)      => req(`/${pid}/sections`, { method: 'POST', body: JSON.stringify(data) });
export const updateSection    = (pid, sid, data) => req(`/${pid}/sections/${sid}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSection    = (pid, sid)       => req(`/${pid}/sections/${sid}`, { method: 'DELETE' });
export const reorderSections  = (pid, orders)    => req(`/${pid}/sections/reorder`, { method: 'POST', body: JSON.stringify({ orders }) });

export const listProjects     = (pid)               => req(`/${pid}/projects`);
export const createProject    = (pid, data)         => req(`/${pid}/projects`, { method: 'POST', body: JSON.stringify(data) });
export const updateProject    = (pid, projId, data) => req(`/${pid}/projects/${projId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProject    = (pid, projId)       => req(`/${pid}/projects/${projId}`, { method: 'DELETE' });

// Analytics (no auth needed — public endpoint)
export async function trackEvent(portfolioId, eventType, extras = {}) {
  return fetch('/api/v1/portfolios/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolio_id: portfolioId, event_type: eventType, referrer: document.referrer, ...extras }),
  }).then(r => r.json());
}

// AI features
export const generateBio               = (payload) => req('/ai/bio', { method: 'POST', body: JSON.stringify(payload) });
export const generateTaglines          = (payload) => req('/ai/tagline', { method: 'POST', body: JSON.stringify(payload) });
export const enhanceProjectDescription = (payload) => req('/ai/project-description', { method: 'POST', body: JSON.stringify(payload) });
export const analyseSkillsGap          = (payload) => req('/ai/skills-gap', { method: 'POST', body: JSON.stringify(payload) });
export const generateSeoSuggestions   = (payload) => req('/ai/seo', { method: 'POST', body: JSON.stringify(payload) });

// Revalidate ISR cache
export const revalidatePortfolio = (slug) => req('/revalidate', { method: 'POST', body: JSON.stringify({ slug }) });
