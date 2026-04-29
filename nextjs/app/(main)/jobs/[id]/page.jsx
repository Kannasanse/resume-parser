'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import OrganizationSelect from '@/components/OrganizationSelect';
import { getJob, deleteJob, updateJob, getJobCandidates, rescoreCandidate, getResumes, scoreResume } from '@/lib/api';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import RichTextEditor from '@/components/RichTextEditor';
import HoldToDeleteComponent from '@/components/HoldToDelete';

const PROFICIENCY_OPTIONS = ['Expert', 'Advanced', 'Intermediate', 'Beginner', 'Nice-to-have'];
const PROFICIENCY_COLORS  = {
  Expert:        'bg-purple-50 text-purple-700',
  Advanced:      'bg-secondary-light text-secondary',
  Intermediate:  'bg-ds-successLight text-ds-success',
  Beginner:      'bg-ds-warningLight text-ds-warning',
  'Nice-to-have':'bg-ds-bg text-ds-textMuted',
};
const PROFICIENCY_BORDER = {
  Expert:        'bg-purple-50 text-purple-700 border-purple-200',
  Advanced:      'bg-secondary-light text-secondary border-secondary',
  Intermediate:  'bg-ds-successLight text-ds-success border-ds-success',
  Beginner:      'bg-ds-warningLight text-ds-warning border-ds-warning',
  'Nice-to-have':'bg-ds-bg text-ds-textMuted border-ds-border',
};

const ROLE_TYPES       = ['technical', 'entry-level', 'specialized'];
const SENIORITIES      = ['entry', 'junior', 'mid', 'senior'];
const DEGREES          = ['None', 'HS', 'Associates', 'Bachelors', 'Masters', 'PhD'];
const SENIORITY_LABELS = { entry: 'Entry', junior: 'Junior', mid: 'Mid', senior: 'Senior' };
const ROLE_TYPE_LABELS = { technical: 'Technical', 'entry-level': 'Entry-level', specialized: 'Specialized' };
const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

const BAND_STYLES = {
  'Strong Match':   'bg-ds-successLight text-ds-success',
  'Good Match':     'bg-secondary-light text-secondary',
  'Moderate Match': 'bg-ds-warningLight text-ds-warning',
  'Weak Match':     'bg-ds-dangerLight text-ds-danger',
};

const WEIGHTS_TABLE = {
  'technical.senior':   { skills: 30, experience: 30, title: 15, projects: 10, education: 5,  certs: 5,  quality: 5  },
  'technical.mid':      { skills: 30, experience: 25, title: 15, projects: 10, education: 10, certs: 5,  quality: 5  },
  'technical.junior':   { skills: 25, experience: 20, title: 5,  projects: 15, education: 20, certs: 5,  quality: 10 },
  'technical.entry':    { skills: 25, experience: 10, title: 5,  projects: 20, education: 25, certs: 5,  quality: 10 },
  'specialized.senior': { skills: 25, experience: 25, title: 10, projects: 5,  education: 10, certs: 20, quality: 5  },
  'entry-level.entry':  { skills: 25, experience: 10, title: 5,  projects: 20, education: 25, certs: 5,  quality: 10 },
};

const COMPARE_BAND_COLORS = {
  'Strong Match': '#177A17', 'Good Match': '#0B8BC8',
  'Moderate Match': '#A26412', 'Weak Match': '#A01535',
};
const COMPARE_FACTORS = ['skills', 'experience', 'education', 'title', 'certs', 'projects', 'quality'];
const COMPARE_FACTOR_LABELS = {
  skills: 'Skills', experience: 'Experience', education: 'Education',
  title: 'Title', certs: 'Certs', projects: 'Projects', quality: 'Quality',
};

function CompareGauge({ score }) {
  if (!score) return null;
  const p = Math.round((score.overall_score ?? 0) * 100);
  const color = COMPARE_BAND_COLORS[score.band] || '#A01535';
  const r = 22, sw = 4, size = 52;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7ED" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={sw} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-heading text-ds-text">{p}</span>
    </div>
  );
}

function CompareModal({ candidates, onClose }) {
  const [a, b] = candidates;
  const cols = [a, b];

  const factorPct = (c, key) => c.score ? Math.round((c.score[`${key}_score`] ?? 0) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ds-border flex-shrink-0">
          <h2 className="font-heading font-bold text-ds-text">Compare Candidates</h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Candidate headers */}
          <div className="grid grid-cols-2 border-b border-ds-border">
            {cols.map((c, i) => (
              <div key={i} className={`px-6 py-5 flex items-start gap-4 ${i === 0 ? 'border-r border-ds-border' : ''}`}>
                <CompareGauge score={c.score} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ds-text truncate">{c.candidate_name || c.file_name}</p>
                  {c.email && <p className="text-xs text-ds-textMuted mt-0.5">{c.email}</p>}
                  {c.score && (
                    <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-btn ${BAND_STYLES[c.score.band] || ''}`}>
                      {c.score.band}
                    </span>
                  )}
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {c.score?.candidate_years != null && (
                      <p className="text-xs text-ds-textMuted font-mono">{c.score.candidate_years.toFixed(1)} yrs exp</p>
                    )}
                    {c.score?.scored_at && (
                      <p className="text-xs text-ds-textMuted">
                        Scored {new Date(c.score.scored_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Score breakdown face-off */}
          <div className="border-b border-ds-border">
            <div className="px-6 py-3 bg-ds-bg border-b border-ds-border">
              <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">Score Breakdown</p>
            </div>
            {COMPARE_FACTORS.map(key => {
              const pa = factorPct(a, key);
              const pb = factorPct(b, key);
              const aWins = pa != null && pb != null && pa > pb;
              const bWins = pa != null && pb != null && pb > pa;
              return (
                <div key={key} className="grid grid-cols-[1fr_72px_1fr] items-center border-b border-ds-border last:border-0">
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <span className={`text-xs font-mono w-7 text-right flex-shrink-0 ${aWins ? 'font-bold text-ds-success' : 'text-ds-textMuted'}`}>
                      {pa != null ? pa : '—'}
                    </span>
                    <div className="flex-1 bg-ds-bg rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${pa ?? 0}%`, backgroundColor: COMPARE_BAND_COLORS[a.score?.band] || '#A01535' }} />
                    </div>
                    {aWins && <span className="text-ds-success text-xs flex-shrink-0">▲</span>}
                  </div>
                  <div className="border-l border-r border-ds-border text-center py-2.5 px-1">
                    <p className="text-xs font-medium text-ds-textMuted">{COMPARE_FACTOR_LABELS[key]}</p>
                  </div>
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    {bWins && <span className="text-ds-success text-xs flex-shrink-0">▲</span>}
                    <div className="flex-1 bg-ds-bg rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${pb ?? 0}%`, backgroundColor: COMPARE_BAND_COLORS[b.score?.band] || '#A01535' }} />
                    </div>
                    <span className={`text-xs font-mono w-7 flex-shrink-0 ${bWins ? 'font-bold text-ds-success' : 'text-ds-textMuted'}`}>
                      {pb != null ? pb : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Assessment */}
          {(a.score?.score_summary || b.score?.score_summary) && (
            <div className="border-b border-ds-border">
              <div className="px-6 py-3 bg-ds-bg border-b border-ds-border">
                <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">AI Assessment</p>
              </div>
              <div className="grid grid-cols-2">
                {cols.map((c, i) => {
                  const s = c.score?.score_summary;
                  return (
                    <div key={i} className={`px-5 py-4 space-y-3 ${i === 0 ? 'border-r border-ds-border' : ''}`}>
                      {!s && <p className="text-xs text-ds-textMuted italic">No AI assessment available.</p>}
                      {s?.summary && <p className="text-xs text-ds-textSecondary leading-relaxed">{s.summary}</p>}
                      {s?.strengths?.length > 0 && (
                        <div className="bg-ds-successLight rounded p-2.5 space-y-1">
                          <p className="text-xs font-semibold text-ds-success uppercase tracking-wide">Strong Areas</p>
                          {s.strengths.map((item, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <span className="text-ds-success text-xs mt-0.5 flex-shrink-0">✓</span>
                              <span className="text-xs text-ds-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s?.gaps?.length > 0 && (
                        <div className="bg-ds-dangerLight rounded p-2.5 space-y-1">
                          <p className="text-xs font-semibold text-ds-danger uppercase tracking-wide">Areas to Improve</p>
                          {s.gaps.map((item, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <span className="text-ds-danger text-xs mt-0.5 flex-shrink-0">✗</span>
                              <span className="text-xs text-ds-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills */}
          <div>
            <div className="px-6 py-3 bg-ds-bg border-b border-ds-border">
              <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">Skills</p>
            </div>
            <div className="grid grid-cols-2">
              {cols.map((c, i) => (
                <div key={i} className={`px-5 py-4 ${i === 0 ? 'border-r border-ds-border' : ''}`}>
                  <div className="flex flex-wrap gap-1.5">
                    {(c.skills || []).slice(0, 14).map(s => (
                      <span key={s} className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-btn">{s}</span>
                    ))}
                    {(c.skills || []).length > 14 && (
                      <span className="text-xs text-ds-textMuted">+{c.skills.length - 14} more</span>
                    )}
                    {(!c.skills || c.skills.length === 0) && (
                      <p className="text-xs text-ds-textMuted italic">No skills data.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-ds-border flex-shrink-0">
          <div className="flex gap-4">
            <Link href={`/resumes/${a.resume_id}`} className="text-xs text-primary hover:underline">
              View {a.candidate_name || 'Candidate A'} →
            </Link>
            <Link href={`/resumes/${b.resume_id}`} className="text-xs text-primary hover:underline">
              View {b.candidate_name || 'Candidate B'} →
            </Link>
          </div>
          <button onClick={onClose}
            className="text-sm px-4 py-2 border border-ds-border rounded-btn text-ds-textMuted hover:bg-ds-bg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-ds-dangerLight flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ds-danger">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="font-heading font-bold text-ds-text text-base">Delete Job Profile?</h2>
            <p className="text-sm text-ds-textSecondary mt-1 leading-relaxed">
              Deleting this job profile will permanently remove all associated records including
              candidate scores and resume links. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="bg-ds-dangerLight rounded px-4 py-3">
          <p className="text-xs text-ds-danger font-medium">
            All candidate scores linked to this job profile will also be deleted.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <HoldToDeleteComponent onDelete={onDelete} />
          <button onClick={onCancel}
            className="w-full px-5 py-2.5 text-sm font-medium text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ score }) {
  const pct = Math.round((score?.overall_score ?? 0) * 100);
  const band = score?.band || 'Weak Match';
  const barColor = {
    'Strong Match': '#177A17', 'Good Match': '#0B8BC8',
    'Moderate Match': '#A26412', 'Weak Match': '#A01535',
  }[band] || '#A01535';

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-ds-bg rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-xs font-mono font-semibold text-ds-text w-8 text-right">{pct}</span>
    </div>
  );
}

function CandidatePagination({ page, totalPages, total, pageSize, onPage, onPageSize }) {
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-ds-card border border-ds-border rounded">
      <p className="text-xs text-ds-textMuted">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
          className="text-xs border border-ds-inputBorder rounded px-2 py-1.5 bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
        </select>
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors"
        >
          ← Prev
        </button>
        <span className="text-xs text-ds-textMuted font-mono">{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function JobProfileDetailInner() {
  const { id }      = useParams();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [tab, setTab]               = useState('candidates');
  const [expandedId, setExpandedId] = useState(null);
  const [rescoring, setRescoring]   = useState(null);
  const [filterBand, setFilterBand] = useState('all');
  const [sortBy, setSortBy]         = useState('score_desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [addSearch, setAddSearch]             = useState('');
  const [selectedIds, setSelectedIds]         = useState(new Set());
  const [adding, setAdding]                   = useState(false);

  const [isEditing, setIsEditing]             = useState(false);
  const [editTitle, setEditTitle]             = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRoleType, setEditRoleType]       = useState('technical');
  const [editSeniority, setEditSeniority]     = useState('mid');
  const [editYears, setEditYears]             = useState(0);
  const [editDegree, setEditDegree]           = useState('None');
  const [editField, setEditField]             = useState('');
  const [editCerts, setEditCerts]             = useState('');
  const [editSkills, setEditSkills]           = useState([]);
  const [editWeights, setEditWeights]         = useState({});
  const [editOrganizationId, setEditOrganizationId] = useState(null);
  const [savingEdit, setSavingEdit]           = useState(false);
  const [editError, setEditError]             = useState('');

  const [candidateSearch, setCandidateSearch]     = useState('');
  const [candidatePage, setCandidatePage]         = useState(1);
  const [candidatePageSize, setCandidatePageSize] = useState(50);

  const [compareIds, setCompareIds]   = useState(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (resumeId) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(resumeId)) { next.delete(resumeId); }
      else if (next.size < 2)  { next.add(resumeId); }
      return next;
    });
  };

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['job-candidates', id],
    queryFn: () => getJobCandidates(id),
  });

  useEffect(() => {
    if (job && searchParams.get('edit') === '1' && !isEditing) {
      startEdit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, searchParams]);

  useEffect(() => { setCandidatePage(1); setCompareIds(new Set()); }, [filterBand, sortBy, candidateSearch]);

  const { data: allResumesData } = useQuery({
    queryKey: ['resumes-picker'],
    queryFn: () => getResumes(1, 500),
    enabled: showAddModal,
  });

  const handleAddResumes = async () => {
    setAdding(true);
    try {
      for (const resumeId of selectedIds) {
        await scoreResume(resumeId, id);
      }
      queryClient.invalidateQueries({ queryKey: ['job-candidates', id] });
      setShowAddModal(false);
      setSelectedIds(new Set());
      setAddSearch('');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = () => {
    setEditTitle(job.title || '');
    setEditDescription(job.description || '');
    setEditRoleType(job.role_type || 'technical');
    setEditSeniority(job.seniority || 'mid');
    setEditYears(job.required_years_experience || 0);
    setEditDegree(job.required_degree || 'None');
    setEditField(job.required_field || '');
    setEditCerts((job.required_certs || []).join(', '));
    setEditOrganizationId(job.organization_id || null);
    setEditSkills((job.job_skills || []).map(s => ({ skill: s.skill, proficiency: s.proficiency, is_required: s.is_required })));
    const defaultW = WEIGHTS_TABLE[`${job.role_type || 'technical'}.${job.seniority || 'mid'}`] || WEIGHTS_TABLE['technical.mid'];
    setEditWeights(job.custom_weights
      ? Object.fromEntries(Object.entries(job.custom_weights).map(([k, v]) => [k, v > 1 ? v : Math.round(v * 100)]))
      : { ...defaultW });
    setEditError('');
    setIsEditing(true);
  };

  const weightTotal = Object.values(editWeights).reduce((a, b) => a + b, 0);

  const handleRoleTypeChange = (val) => { setEditRoleType(val); setEditWeights({ ...(WEIGHTS_TABLE[`${val}.${editSeniority}`] || WEIGHTS_TABLE['technical.mid']) }); };
  const handleSeniorityChange = (val) => { setEditSeniority(val); setEditWeights({ ...(WEIGHTS_TABLE[`${editRoleType}.${val}`] || WEIGHTS_TABLE['technical.mid']) }); };
  const updateWeight = (key, val) => setEditWeights(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, parseInt(val) || 0)) }));
  const updateSkill  = (i, f, v) => setEditSkills(prev => prev.map((s, idx) => idx === i ? { ...s, [f]: v } : s));
  const removeSkill  = (i) => setEditSkills(prev => prev.filter((_, idx) => idx !== i));
  const addSkill     = () => setEditSkills(prev => [...prev, { skill: '', proficiency: 'Intermediate', is_required: true }]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) { setEditError('Job title is required.'); return; }
    if (weightTotal !== 100) { setEditError(`Weights must sum to 100% (currently ${weightTotal}%).`); return; }
    setSavingEdit(true); setEditError('');
    try {
      const certsArray = editCerts.trim() ? editCerts.split(',').map(c => c.trim()).filter(Boolean) : [];
      await updateJob(id, { title: editTitle, description: editDescription, role_type: editRoleType, seniority: editSeniority, required_years_experience: parseInt(editYears) || 0, required_degree: editDegree, required_field: editField || null, required_certs: certsArray, custom_weights: editWeights, skills: editSkills, organization_id: editOrganizationId || null });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      setIsEditing(false);
    } catch { setEditError('Failed to save. Please try again.'); }
    finally { setSavingEdit(false); }
  };

  const handleDeleteConfirmed = async () => { await deleteJob(id); router.push('/jobs'); };
  const handleRescore = async (resumeId) => {
    setRescoring(resumeId);
    try { await rescoreCandidate(id, resumeId); queryClient.invalidateQueries({ queryKey: ['job-candidates', id] }); }
    finally { setRescoring(null); }
  };

  const handleExportExcel = (rows) => {
    const data = rows.map(c => ({
      'Name':          c.candidate_name || c.file_name || '',
      'Email Address': c.email || '',
      'Score':         c.score ? Math.round(c.score.overall_score * 100) : '',
      'Scored On':     c.score?.scored_at ? new Date(c.score.scored_at).toLocaleString() : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    const fileName = `${(job.title || 'candidates').replace(/[^a-z0-9]/gi, '_')}_candidates.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading...</p>;
  if (error || !job) return <p className="text-ds-danger">Job profile not found.</p>;

  const required   = job.job_skills?.filter(s => s.is_required)  || [];
  const niceToHave = job.job_skills?.filter(s => !s.is_required) || [];
  const inputCls   = 'w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors';

  const scored   = candidates.filter(c => c.score);
  const avgScore = scored.length ? Math.round(scored.reduce((s, c) => s + c.score.overall_score, 0) / scored.length * 100) : null;

  const allFilteredAndSorted = candidates
    .filter(c => filterBand === 'all' || c.score?.band === filterBand)
    .filter(c => {
      if (!candidateSearch) return true;
      const q = candidateSearch.toLowerCase();
      return (c.candidate_name || c.file_name || '').toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'score_asc') return (a.score?.overall_score ?? -1) - (b.score?.overall_score ?? -1);
      if (sortBy === 'name') return (a.candidate_name || a.file_name || '').localeCompare(b.candidate_name || b.file_name || '');
      if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
      return (b.score?.overall_score ?? -1) - (a.score?.overall_score ?? -1);
    });

  const candidateTotalPages    = Math.max(1, Math.ceil(allFilteredAndSorted.length / candidatePageSize));
  const effectiveCandidatePage = Math.min(candidatePage, candidateTotalPages);
  const paginatedCandidates    = allFilteredAndSorted.slice(
    (effectiveCandidatePage - 1) * candidatePageSize,
    effectiveCandidatePage * candidatePageSize,
  );

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        {showDeleteModal && <DeleteModal onCancel={() => setShowDeleteModal(false)} onDelete={handleDeleteConfirmed} />}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setIsEditing(false)} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors">← Cancel</button>
          <h1 className="font-heading text-xl font-bold text-ds-text">Edit Job Profile</h1>
          <button onClick={handleSaveEdit} disabled={savingEdit}
            className="text-sm bg-primary text-white px-5 py-2 rounded-btn font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {savingEdit ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
        {editError && <p className="text-sm text-ds-danger mb-4">{editError}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-ds-card rounded border border-ds-border p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Job Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Organization <span className="normal-case font-normal text-ds-textMuted">(optional)</span></label>
                <OrganizationSelect
                  value={editOrganizationId}
                  onChange={(id) => setEditOrganizationId(id)}
                  inputCls={inputCls}
                />
              </div>
            </div>
            <div className="bg-ds-card rounded border border-ds-border p-5 space-y-4">
              <h2 className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">Scoring Parameters</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-ds-textMuted mb-1.5">Role Type</label>
                  <select value={editRoleType} onChange={e => handleRoleTypeChange(e.target.value)} className={inputCls}>
                    {ROLE_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-ds-textMuted mb-1.5">Seniority</label>
                  <select value={editSeniority} onChange={e => handleSeniorityChange(e.target.value)} className={inputCls}>
                    {SENIORITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-ds-textMuted mb-1.5">Required Years</label>
                  <input type="number" min={0} max={30} value={editYears} onChange={e => setEditYears(e.target.value)} className={inputCls} /></div>
                <div><label className="block text-xs font-medium text-ds-textMuted mb-1.5">Minimum Degree</label>
                  <select value={editDegree} onChange={e => setEditDegree(e.target.value)} className={inputCls}>
                    {DEGREES.map(d => <option key={d} value={d}>{d === 'None' ? 'None (not required)' : d}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-ds-textMuted mb-1.5">Field of Study</label>
                  <input type="text" value={editField} onChange={e => setEditField(e.target.value)} placeholder="e.g. Computer Science" className={inputCls} /></div>
                <div><label className="block text-xs font-medium text-ds-textMuted mb-1.5">Required Certs <span className="opacity-60">(comma-sep)</span></label>
                  <input type="text" value={editCerts} onChange={e => setEditCerts(e.target.value)} placeholder="e.g. AWS SAA, CKA" className={inputCls} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ds-textMuted">Scoring Weights</p>
                  <span className={`text-xs font-mono font-semibold ${weightTotal === 100 ? 'text-ds-success' : 'text-ds-danger'}`}>{weightTotal}/100%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(editWeights).map(([k, v]) => (
                    <div key={k} className="flex flex-col items-center gap-0.5">
                      <div className="relative w-full">
                        <input type="number" min={0} max={100} value={v} onChange={e => updateWeight(k, e.target.value)}
                          className="w-full text-center text-sm font-mono border border-ds-inputBorder rounded px-1 py-1.5 bg-ds-bg focus:outline-none focus:ring-2 focus:ring-primary transition-colors" />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-ds-textMuted pointer-events-none">%</span>
                      </div>
                      <span className="text-xs text-ds-textMuted capitalize">{k}</span>
                    </div>
                  ))}
                </div>
                {weightTotal !== 100 && <p className="text-xs text-ds-danger mt-1.5">Weights must sum to 100% (currently {weightTotal}%)</p>}
              </div>
            </div>
            <div className="bg-ds-card rounded border border-ds-border p-5">
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Job Description</label>
              <RichTextEditor value={editDescription} onChange={setEditDescription} placeholder="Enter the job description…" minHeight="220px" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-ds-card rounded border border-ds-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">
                  Skills {editSkills.length > 0 && <span className="text-primary">({editSkills.length})</span>}
                </h2>
                <button onClick={addSkill} className="text-xs text-primary border border-primary-light px-2.5 py-1 rounded-btn hover:bg-primary-light transition-colors">+ Add</button>
              </div>
              {editSkills.length === 0
                ? <p className="text-sm text-ds-textMuted text-center py-6">No skills added.</p>
                : <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {editSkills.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-ds-bg border border-ds-border rounded px-3 py-2">
                        <input value={s.skill} onChange={e => updateSkill(i, 'skill', e.target.value)}
                          className="flex-1 text-sm border-0 outline-none bg-transparent font-medium text-ds-text min-w-0" />
                        <select value={s.proficiency} onChange={e => updateSkill(i, 'proficiency', e.target.value)}
                          className={`text-xs px-2 py-0.5 rounded-btn border font-medium cursor-pointer focus:outline-none ${PROFICIENCY_BORDER[s.proficiency]}`}>
                          {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-ds-textMuted cursor-pointer select-none flex-shrink-0">
                          <input type="checkbox" checked={s.is_required} onChange={e => updateSkill(i, 'is_required', e.target.checked)} className="accent-primary" />Req
                        </label>
                        <button onClick={() => removeSkill(i)} className="text-ds-textMuted hover:text-ds-danger text-lg leading-none flex-shrink-0">×</button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {showDeleteModal && <DeleteModal onCancel={() => setShowDeleteModal(false)} onDelete={handleDeleteConfirmed} />}

      {showCompare && compareIds.size === 2 && (() => {
        const selected = [...compareIds].map(rid => candidates.find(c => c.resume_id === rid)).filter(Boolean);
        if (selected.length < 2) return null;
        return <CompareModal candidates={selected} onClose={() => setShowCompare(false)} />;
      })()}

      {showAddModal && (() => {
        const existingIds = new Set(candidates.map(c => c.resume_id));
        const available = (allResumesData?.data || []).filter(r => !existingIds.has(r.id));
        const filtered = available.filter(r => {
          if (!addSearch) return true;
          const q = addSearch.toLowerCase();
          return (r.parsed_data?.[0]?.candidate_name || r.file_name || '').toLowerCase().includes(q)
            || (r.parsed_data?.[0]?.email || '').toLowerCase().includes(q);
        });
        const toggleId = (rid) => setSelectedIds(prev => {
          const next = new Set(prev);
          next.has(rid) ? next.delete(rid) : next.add(rid);
          return next;
        });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
            <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-ds-border flex-shrink-0">
                <h2 className="font-heading font-bold text-ds-text">Add Existing Resumes</h2>
                <button onClick={() => setShowAddModal(false)} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
              </div>
              <div className="px-5 py-3 border-b border-ds-border flex-shrink-0">
                <input
                  type="text" value={addSearch} onChange={e => setAddSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-ds-border">
                {!allResumesData && (
                  <p className="text-sm text-ds-textMuted text-center py-8">Loading resumes…</p>
                )}
                {allResumesData && filtered.length === 0 && (
                  <p className="text-sm text-ds-textMuted text-center py-8">
                    {available.length === 0 ? 'All uploaded resumes are already in this job.' : 'No resumes match your search.'}
                  </p>
                )}
                {filtered.map(r => {
                  const name = r.parsed_data?.[0]?.candidate_name || r.file_name;
                  const email = r.parsed_data?.[0]?.email;
                  const checked = selectedIds.has(r.id);
                  return (
                    <label key={r.id} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-ds-bg transition-colors">
                      <input type="checkbox" checked={checked} onChange={() => toggleId(r.id)} className="accent-primary w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ds-text truncate">{name}</p>
                        {email && <p className="text-xs text-ds-textMuted truncate">{email}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-ds-border flex-shrink-0">
                <span className="text-xs text-ds-textMuted">{selectedIds.size} selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddModal(false)}
                    className="text-sm px-4 py-2 rounded-btn border border-ds-border text-ds-textMuted hover:bg-ds-bg transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleAddResumes} disabled={selectedIds.size === 0 || adding}
                    className="text-sm bg-primary text-white px-4 py-2 rounded-btn font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
                    {adding
                      ? <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Scoring…</span>
                      : `Score & Add ${selectedIds.size > 0 ? selectedIds.size : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="bg-ds-card rounded border border-ds-border px-5 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/jobs')} className="text-ds-textMuted hover:text-ds-text transition-colors flex-shrink-0">←</button>
            <div className="min-w-0">
              <h1 className="font-heading text-lg font-bold text-ds-text truncate">{job.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {job.role_type && <span className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-btn font-medium">{ROLE_TYPE_LABELS[job.role_type] || job.role_type}</span>}
                {job.seniority && <span className="bg-ds-bg text-ds-textTertiary text-xs px-2 py-0.5 rounded-btn">{SENIORITY_LABELS[job.seniority] || job.seniority}</span>}
                {job.required_years_experience > 0 && <span className="text-xs text-ds-textMuted">{job.required_years_experience}+ yrs</span>}
                {job.required_degree && job.required_degree !== 'None' && <span className="text-xs text-ds-textMuted">{job.required_degree}</span>}
                <span className="text-xs text-ds-textMuted">{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-ds-text">{candidates.length}</p>
              <p className="text-xs text-ds-textMuted">Candidates</p>
            </div>
            {avgScore != null && (
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-ds-text">{avgScore}</p>
                <p className="text-xs text-ds-textMuted">Avg Score</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={startEdit}
                className="text-sm border border-ds-border text-ds-text px-3 py-1.5 rounded-btn hover:bg-ds-bg transition-colors">Edit</button>
              <button onClick={() => { setShowAddModal(true); setAddSearch(''); setSelectedIds(new Set()); }}
                className="text-sm border border-ds-border text-ds-text px-3 py-1.5 rounded-btn hover:bg-ds-bg transition-colors">Add Existing</button>
              <Link href={`/upload?jobId=${id}`}
                className="text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">Upload</Link>
              <button onClick={() => setShowDeleteModal(true)}
                className="text-sm bg-ds-dangerLight text-ds-danger border border-ds-dangerLight px-3 py-1.5 rounded-btn hover:bg-ds-danger hover:text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-ds-border">
        {['candidates', 'details'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-ds-textMuted hover:text-ds-text'
            }`}>
            {t}
            {t === 'candidates' && candidates.length > 0 &&
              <span className="ml-1.5 bg-primary-light text-primary text-xs px-1.5 py-0.5 rounded-btn">{candidates.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'candidates' && (
        <div className="space-y-3">
          {candidatesLoading && <p className="text-ds-textMuted text-sm">Loading candidates…</p>}

          {!candidatesLoading && candidates.length === 0 && (
            <div className="text-center py-16 bg-ds-card rounded border border-ds-border">
              <p className="text-ds-textMuted">No resumes submitted for this job yet.</p>
              <Link href={`/upload?jobId=${id}`} className="mt-2 inline-block text-sm text-primary hover:underline">
                Upload the first resume →
              </Link>
            </div>
          )}

          {!candidatesLoading && candidates.length > 0 && (
            <>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-textMuted pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={e => setCandidateSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                {candidateSearch && (
                  <button
                    onClick={() => setCandidateSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-lg leading-none"
                  >×</button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 bg-ds-card border border-ds-border rounded px-4 py-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'Strong Match', 'Good Match', 'Moderate Match', 'Weak Match'].map(b => (
                    <button key={b} onClick={() => setFilterBand(b)}
                      className={`text-xs px-3 py-1 rounded-btn font-medium transition-colors ${
                        filterBand === b ? 'bg-primary text-white' : 'bg-ds-bg text-ds-textMuted hover:text-ds-text hover:bg-ds-border'
                      }`}>
                      {b === 'all' ? 'All' : b}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="text-xs border border-ds-inputBorder rounded px-2.5 py-1.5 bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="score_desc">Score: High to Low</option>
                    <option value="score_asc">Score: Low to High</option>
                    <option value="name">Name A–Z</option>
                    <option value="date">Date: Newest</option>
                  </select>
                  <button
                    onClick={() => handleExportExcel(allFilteredAndSorted)}
                    className="text-xs border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-bg transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              {compareIds.size > 0 && (
                <div className="flex items-center justify-between bg-primary-light border border-primary/20 rounded px-4 py-2.5">
                  <span className="text-sm text-primary font-medium">
                    {compareIds.size === 1
                      ? '1 candidate selected — select one more to compare'
                      : '2 candidates selected — ready to compare'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCompareIds(new Set())}
                      className="text-xs text-primary hover:underline">
                      Clear
                    </button>
                    {compareIds.size === 2 && (
                      <button onClick={() => setShowCompare(true)}
                        className="text-sm bg-primary text-white px-4 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
                        Compare →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {allFilteredAndSorted.length === 0 ? (
                <p className="text-sm text-ds-textMuted text-center py-8">
                  {candidateSearch
                    ? `No candidates match "${candidateSearch}".`
                    : 'No candidates match the selected filter.'}
                </p>
              ) : (
                <>
                  <div className="bg-ds-card rounded border border-ds-border divide-y divide-ds-border overflow-hidden">
                    <div className="grid grid-cols-[28px_1fr_180px_160px_130px] items-center gap-3 px-4 py-2 bg-ds-bg">
                      <span className="text-xs text-ds-textMuted font-semibold text-center">
                        {compareIds.size > 0 ? `${compareIds.size}/2` : '#'}
                      </span>
                      <span className="text-xs text-ds-textMuted font-semibold uppercase tracking-wide">Candidate</span>
                      <span className="text-xs text-ds-textMuted font-semibold uppercase tracking-wide">Top Skills</span>
                      <span className="text-xs text-ds-textMuted font-semibold uppercase tracking-wide">Score</span>
                      <span className="text-xs text-ds-textMuted font-semibold uppercase tracking-wide text-right">Actions</span>
                    </div>

                    {paginatedCandidates.map((c) => {
                      return (
                        <div key={c.resume_id}>
                          <div className="grid grid-cols-[28px_1fr_180px_160px_130px] items-center gap-3 px-4 py-3 hover:bg-ds-bg transition-colors">
                            <label className="flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={compareIds.has(c.resume_id)}
                                onChange={() => toggleCompare(c.resume_id)}
                                disabled={compareIds.size >= 2 && !compareIds.has(c.resume_id)}
                                className="w-3.5 h-3.5 accent-primary cursor-pointer disabled:cursor-not-allowed"
                              />
                            </label>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ds-text truncate">{c.candidate_name || c.file_name}</p>
                              {c.email && <p className="text-xs text-ds-textMuted truncate">{c.email}</p>}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(c.skills || []).slice(0, 3).map(s => (
                                <span key={s} className="bg-primary-light text-primary text-xs px-1.5 py-0.5 rounded-btn">{s}</span>
                              ))}
                              {(c.skills || []).length > 3 && (
                                <span className="text-xs text-ds-textMuted">+{c.skills.length - 3}</span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {c.score ? (
                                <>
                                  <ScoreBar score={c.score} />
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-btn ${BAND_STYLES[c.score.band] || ''}`}>
                                    {c.score.band}
                                  </span>
                                  {c.score.scored_at && (
                                    <p className="text-xs text-ds-textMuted">
                                      {new Date(c.score.scored_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-ds-textMuted">Not scored</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => setExpandedId(expandedId === c.resume_id ? null : c.resume_id)}
                                className="text-xs border border-ds-border px-2 py-1 rounded-btn text-ds-text hover:bg-ds-bg transition-colors">
                                {expandedId === c.resume_id ? 'Hide' : 'Details'}
                              </button>
                              <button onClick={() => handleRescore(c.resume_id)} disabled={rescoring === c.resume_id}
                                className="text-xs border border-ds-border px-2 py-1 rounded-btn text-ds-text hover:bg-ds-bg disabled:opacity-50 transition-colors">
                                {rescoring === c.resume_id ? '…' : 'Rescore'}
                              </button>
                              <Link href={`/resumes/${c.resume_id}`}
                                className="text-xs bg-primary-light text-primary px-2 py-1 rounded-btn hover:bg-primary hover:text-white transition-colors">
                                View
                              </Link>
                            </div>
                          </div>

                          {expandedId === c.resume_id && c.score && (
                            <div className="border-t border-ds-border px-6 py-5 bg-ds-bg space-y-5">
                              {c.score.score_summary && (() => {
                                const s = c.score.score_summary;
                                return (
                                  <div className="space-y-3">
                                    <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">AI Assessment</p>
                                    {s.summary && (
                                      <p className="text-sm text-ds-text leading-relaxed">{s.summary}</p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {s.strengths?.length > 0 && (
                                        <div className="bg-ds-successLight rounded p-3 space-y-1.5">
                                          <p className="text-xs font-semibold text-ds-success uppercase tracking-wide">Strong Areas</p>
                                          <ul className="space-y-1">
                                            {s.strengths.map((item, i) => (
                                              <li key={i} className="text-xs text-ds-text flex items-start gap-1.5">
                                                <span className="text-ds-success mt-0.5 flex-shrink-0">✓</span>
                                                {item}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {s.gaps?.length > 0 && (
                                        <div className="bg-ds-dangerLight rounded p-3 space-y-1.5">
                                          <p className="text-xs font-semibold text-ds-danger uppercase tracking-wide">Areas to Improve</p>
                                          <ul className="space-y-1">
                                            {s.gaps.map((item, i) => (
                                              <li key={i} className="text-xs text-ds-text flex items-start gap-1.5">
                                                <span className="text-ds-danger mt-0.5 flex-shrink-0">✗</span>
                                                {item}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                              <ScoreBreakdown score={c.score} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <CandidatePagination
                    page={effectiveCandidatePage}
                    totalPages={candidateTotalPages}
                    total={allFilteredAndSorted.length}
                    pageSize={candidatePageSize}
                    onPage={setCandidatePage}
                    onPageSize={n => { setCandidatePageSize(n); setCandidatePage(1); }}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'details' && (
        <div className="space-y-5">
          {job.description && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-3">Job Description</h2>
              <div className="text-sm text-ds-textSecondary leading-relaxed rich-content"
                dangerouslySetInnerHTML={{ __html: job.description }} />
            </div>
          )}

          {required.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">
                Required Skills <span className="text-ds-textMuted font-normal text-sm">({required.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {required.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 border border-ds-border rounded px-3 py-1.5">
                    <span className="text-sm font-medium text-ds-text">{s.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-btn ${PROFICIENCY_COLORS[s.proficiency]}`}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {niceToHave.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">
                Nice-to-have Skills <span className="text-ds-textMuted font-normal text-sm">({niceToHave.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {niceToHave.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 border border-ds-border rounded px-3 py-1.5">
                    <span className="text-sm font-medium text-ds-text">{s.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-btn ${PROFICIENCY_COLORS[s.proficiency]}`}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!job.description && job.job_skills?.length === 0 && (
            <p className="text-center text-ds-textMuted py-8">No details recorded for this job profile.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobProfileDetail() {
  return (
    <Suspense fallback={<p className="text-ds-textMuted">Loading...</p>}>
      <JobProfileDetailInner />
    </Suspense>
  );
}
