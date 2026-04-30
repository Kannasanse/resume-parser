const BASE = '/api/v1';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || res.statusText), { status: res.status, data: body });
  }
  return res;
}

export const uploadResume = async (file, jobId = null) => {
  const form = new FormData();
  form.append('resume', file);
  if (jobId) form.append('job_id', jobId);
  const res = await req('/resumes/upload', { method: 'POST', body: form });
  return { data: await res.json() };
};

export const getResumes = (page = 1, limit = 50, search = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  return req(`/resumes?${params}`).then(r => r.json());
};

export const getResume = (id) => req(`/resumes/${id}`).then(r => r.json());

export const deleteResume = (id) => req(`/resumes/${id}`, { method: 'DELETE' }).then(r => r.json());

export const bulkDeleteResumes = (ids) =>
  Promise.all(ids.map(id => deleteResume(id)));

export const exportResume = async (id, format = 'json') => {
  const res = await req(`/resumes/${id}/export?format=${format}`);
  const data = await res.blob();
  return { data };
};

export const reparseResume = (id) =>
  req(`/resumes/${id}/reparse`, { method: 'POST' }).then(r => r.json());

export const scoreResume = (resumeId, jobId) =>
  req(`/resumes/${resumeId}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  }).then(r => r.json());

// Job Profiles
export const parseJobSkills = (description) =>
  req('/jobs/parse-skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  }).then(r => r.json());

export const createJob = (payload) =>
  req('/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());

export const getJobs = () => req('/jobs').then(r => r.json());

export const getJob = (id) => req(`/jobs/${id}`).then(r => r.json());

export const updateJob = (id, payload) =>
  req(`/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());

export const deleteJob = (id) => req(`/jobs/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getJobCandidates = (jobId) => req(`/jobs/${jobId}/candidates`).then(r => r.json());

export const rescoreCandidate = (jobId, resumeId) =>
  req(`/jobs/${jobId}/score/${resumeId}`, { method: 'POST' }).then(r => r.json());

export const removeCandidateFromJob = (jobId, resumeId) =>
  req(`/jobs/${jobId}/candidates/${resumeId}`, { method: 'DELETE' }).then(r => r.json());

// Organizations
export const getOrganizations = () => req('/organizations').then(r => r.json());

export const createOrganization = (name) =>
  req('/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(r => r.json());
