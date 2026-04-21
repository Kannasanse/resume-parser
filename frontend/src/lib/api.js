import axios from 'axios';

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1` });

export const uploadResume = (file, jobId = null) => {
  const form = new FormData();
  form.append('resume', file);
  if (jobId) form.append('job_id', jobId);
  return api.post('/resumes/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getResumes = (page = 1, limit = 10) =>
  api.get('/resumes', { params: { page, limit } }).then(r => r.data);

export const getResume = (id) => api.get(`/resumes/${id}`).then(r => r.data);

export const deleteResume = (id) => api.delete(`/resumes/${id}`).then(r => r.data);

export const exportResume = (id, format = 'json') =>
  api.get(`/resumes/${id}/export`, { params: { format }, responseType: 'blob' });

export const reparseResume = (id) => api.post(`/resumes/${id}/reparse`).then(r => r.data);

export const scoreResume = (resumeId, jobId) =>
  api.post(`/resumes/${resumeId}/score`, { job_id: jobId }).then(r => r.data);

// Job Profiles
export const parseJobSkills = (description) =>
  api.post('/jobs/parse-skills', { description }).then(r => r.data);

export const createJob = (payload) => api.post('/jobs', payload).then(r => r.data);

export const getJobs = () => api.get('/jobs').then(r => r.data);

export const getJob = (id) => api.get(`/jobs/${id}`).then(r => r.data);

export const updateJob = (id, payload) => api.put(`/jobs/${id}`, payload).then(r => r.data);

export const deleteJob = (id) => api.delete(`/jobs/${id}`).then(r => r.data);

export const getJobCandidates = (jobId) =>
  api.get(`/jobs/${jobId}/candidates`).then(r => r.data);

export const rescoreCandidate = (jobId, resumeId) =>
  api.post(`/jobs/${jobId}/score/${resumeId}`).then(r => r.data);
