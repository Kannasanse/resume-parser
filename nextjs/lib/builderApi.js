const BASE = '/api/v1/builder';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
  }
  return res.json();
}

// Builder resumes
export const getBuilderResumes = () => req('');
export const createBuilderResume = (payload) =>
  req('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const getBuilderResume = (id) => req(`/${id}`);
export const updateBuilderResume = (id, payload) =>
  req(`/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const deleteBuilderResume = (id) => req(`/${id}`, { method: 'DELETE' });

// Sections
export const getBuilderSections = (resumeId) => req(`/${resumeId}/sections`);
export const createBuilderSection = (resumeId, payload) =>
  req(`/${resumeId}/sections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const reorderBuilderSections = (resumeId, order) =>
  req(`/${resumeId}/sections`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) });
export const updateBuilderSection = (resumeId, sectionId, payload) =>
  req(`/${resumeId}/sections/${sectionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const deleteBuilderSection = (resumeId, sectionId) =>
  req(`/${resumeId}/sections/${sectionId}`, { method: 'DELETE' });

// Import
export const importResumeFile = (resumeId, file) => {
  const form = new FormData();
  form.append('file', file);
  return req(`/${resumeId}/import`, { method: 'POST', body: form });
};

// Duplicate
export const duplicateBuilderResume = (id) =>
  req(`/${id}/duplicate`, { method: 'POST' });
