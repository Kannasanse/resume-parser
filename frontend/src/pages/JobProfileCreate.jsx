import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseJobSkills, createJob } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor';

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

const PROFICIENCY_OPTIONS = ['Expert', 'Advanced', 'Intermediate', 'Beginner', 'Nice-to-have'];

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-50 text-purple-700 border-purple-200',
  Advanced:      'bg-secondary-light text-secondary border-secondary',
  Intermediate:  'bg-ds-successLight text-ds-success border-ds-success',
  Beginner:      'bg-ds-warningLight text-ds-warning border-ds-warning',
  'Nice-to-have':'bg-ds-bg text-ds-textMuted border-ds-border',
};

const ROLE_TYPES  = ['technical', 'entry-level', 'specialized'];
const SENIORITIES = ['entry', 'junior', 'mid', 'senior'];
const DEGREES     = ['None', 'HS', 'Associates', 'Bachelors', 'Masters', 'PhD'];

const WEIGHTS_TABLE = {
  'technical.senior':   { skills: 30, experience: 30, title: 15, projects: 10, education: 5,  certs: 5,  quality: 5  },
  'technical.mid':      { skills: 30, experience: 25, title: 15, projects: 10, education: 10, certs: 5,  quality: 5  },
  'technical.junior':   { skills: 25, experience: 20, title: 5,  projects: 15, education: 20, certs: 5,  quality: 10 },
  'technical.entry':    { skills: 25, experience: 10, title: 5,  projects: 20, education: 25, certs: 5,  quality: 10 },
  'specialized.senior': { skills: 25, experience: 25, title: 10, projects: 5,  education: 10, certs: 20, quality: 5  },
  'entry-level.entry':  { skills: 25, experience: 10, title: 5,  projects: 20, education: 25, certs: 5,  quality: 10 },
};

export default function JobProfileCreate() {
  const navigate = useNavigate();
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills]           = useState([]);
  const [roleType, setRoleType]       = useState('technical');
  const [seniority, setSeniority]     = useState('mid');
  const [requiredYears, setRequiredYears]   = useState(0);
  const [requiredDegree, setRequiredDegree] = useState('None');
  const [requiredField, setRequiredField]   = useState('');
  const [requiredCerts, setRequiredCerts]   = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [parseError, setParseError] = useState('');
  const [saveError, setSaveError]   = useState('');
  const [customWeights, setCustomWeights] = useState({ ...WEIGHTS_TABLE['technical.mid'] });

  const weightTotal = Object.values(customWeights).reduce((a, b) => a + b, 0);

  const handleRoleTypeChange = (val) => {
    setRoleType(val);
    const defaults = WEIGHTS_TABLE[`${val}.${seniority}`] || WEIGHTS_TABLE['technical.mid'];
    setCustomWeights({ ...defaults });
  };

  const handleSeniorityChange = (val) => {
    setSeniority(val);
    const defaults = WEIGHTS_TABLE[`${roleType}.${val}`] || WEIGHTS_TABLE['technical.mid'];
    setCustomWeights({ ...defaults });
  };

  const updateWeight = (key, val) => {
    const num = Math.max(0, Math.min(100, parseInt(val) || 0));
    setCustomWeights(prev => ({ ...prev, [key]: num }));
  };

  const handleGenerateSkills = async () => {
    const plainText = stripHtml(description).trim();
    if (!plainText) { setParseError('Enter a job description first.'); return; }
    setParsing(true);
    setParseError('');
    try {
      const { skills: parsed } = await parseJobSkills(plainText);
      setSkills(parsed);
      if (parsed.length === 0) setParseError('No recognisable skills found. Try adding more detail.');
    } catch {
      setParseError('Failed to parse skills. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const updateSkill = (index, field, value) =>
    setSkills(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));

  const removeSkill = (index) => setSkills(prev => prev.filter((_, i) => i !== index));

  const addSkill = () =>
    setSkills(prev => [...prev, { skill: '', proficiency: 'Intermediate', is_required: true }]);

  const handleSave = async () => {
    if (!title.trim()) { setSaveError('Job title is required.'); return; }
    if (weightTotal !== 100) { setSaveError(`Scoring weights must sum to 100% (currently ${weightTotal}%).`); return; }
    setSaving(true);
    setSaveError('');
    try {
      const certsArray = requiredCerts.trim()
        ? requiredCerts.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const { id } = await createJob({
        title, description, skills,
        role_type: roleType, seniority,
        required_years_experience: parseInt(requiredYears) || 0,
        required_degree: requiredDegree,
        required_field: requiredField || null,
        required_certs: certsArray,
        custom_weights: customWeights,
      });
      navigate(`/jobs/${id}`);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-ds-text mb-6">New Job Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Title */}
          <div className="bg-ds-card rounded border border-ds-border p-5">
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputCls}
            />
          </div>

          {/* Scoring parameters */}
          <div className="bg-ds-card rounded border border-ds-border p-5 space-y-4">
            <h2 className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">Scoring Parameters</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ds-textMuted mb-1.5">Role Type</label>
                <select value={roleType} onChange={e => handleRoleTypeChange(e.target.value)} className={inputCls}>
                  {ROLE_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ds-textMuted mb-1.5">Seniority</label>
                <select value={seniority} onChange={e => handleSeniorityChange(e.target.value)} className={inputCls}>
                  {SENIORITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ds-textMuted mb-1.5">Required Years</label>
                <input type="number" min={0} max={30} value={requiredYears}
                  onChange={e => setRequiredYears(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ds-textMuted mb-1.5">Minimum Degree</label>
                <select value={requiredDegree} onChange={e => setRequiredDegree(e.target.value)} className={inputCls}>
                  {DEGREES.map(d => <option key={d} value={d}>{d === 'None' ? 'None (not required)' : d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ds-textMuted mb-1.5">Field of Study</label>
                <input type="text" value={requiredField}
                  onChange={e => setRequiredField(e.target.value)}
                  placeholder="e.g. Computer Science" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ds-textMuted mb-1.5">
                  Required Certs <span className="text-ds-textMuted opacity-60">(comma-sep)</span>
                </label>
                <input type="text" value={requiredCerts}
                  onChange={e => setRequiredCerts(e.target.value)}
                  placeholder="e.g. AWS SAA, CKA" className={inputCls} />
              </div>
            </div>

            {/* Editable scoring weights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-ds-textMuted">Scoring Weights</p>
                <span className={`text-xs font-mono font-semibold ${weightTotal === 100 ? 'text-ds-success' : 'text-ds-danger'}`}>
                  {weightTotal}/100%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(customWeights).map(([k, v]) => (
                  <div key={k} className="flex flex-col items-center gap-0.5">
                    <div className="relative w-full">
                      <input
                        type="number" min={0} max={100} value={v}
                        onChange={e => updateWeight(k, e.target.value)}
                        className="w-full text-center text-sm font-mono border border-ds-inputBorder rounded px-1 py-1.5 bg-ds-bg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-ds-textMuted pointer-events-none">%</span>
                    </div>
                    <span className="text-xs text-ds-textMuted capitalize">{k}</span>
                  </div>
                ))}
              </div>
              {weightTotal !== 100 && (
                <p className="text-xs text-ds-danger mt-1.5">Weights must sum to 100% (currently {weightTotal}%)</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-ds-card rounded border border-ds-border p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Job Description</label>
              <button
                onClick={handleGenerateSkills}
                disabled={parsing}
                className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-1.5 rounded-btn font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {parsing ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : '✦ Generate Skills'}
              </button>
            </div>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Paste the full job description here..."
              minHeight="220px"
            />
            {parseError && <p className="mt-1.5 text-sm text-ds-danger">{parseError}</p>}
          </div>
        </div>

        {/* Right column — skills */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ds-card rounded border border-ds-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">
                Skills {skills.length > 0 && <span className="text-primary">({skills.length})</span>}
              </h2>
              <button onClick={addSkill}
                className="text-xs text-primary border border-primary-light px-2.5 py-1 rounded-btn hover:bg-primary-light transition-colors">
                + Add
              </button>
            </div>

            {skills.length === 0 ? (
              <p className="text-sm text-ds-textMuted text-center py-6">
                Paste a job description and click Generate Skills.
              </p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-ds-bg border border-ds-border rounded px-3 py-2">
                    <input
                      value={s.skill}
                      onChange={e => updateSkill(i, 'skill', e.target.value)}
                      className="flex-1 text-sm border-0 outline-none bg-transparent font-medium text-ds-text min-w-0"
                    />
                    <select
                      value={s.proficiency}
                      onChange={e => updateSkill(i, 'proficiency', e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-btn border font-medium cursor-pointer focus:outline-none ${PROFICIENCY_COLORS[s.proficiency]}`}
                    >
                      {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-ds-textMuted cursor-pointer select-none flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={s.is_required}
                        onChange={e => updateSkill(i, 'is_required', e.target.checked)}
                        className="accent-primary"
                      />
                      Req
                    </label>
                    <button onClick={() => removeSkill(i)} className="text-ds-textMuted hover:text-ds-danger text-lg leading-none flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saveError && <p className="text-sm text-ds-danger">{saveError}</p>}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-primary text-white px-4 py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Job Profile'}
            </button>
            <button onClick={() => navigate('/jobs')}
              className="text-sm text-ds-textMuted px-4 py-2.5 rounded-btn border border-ds-border hover:bg-ds-card transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
