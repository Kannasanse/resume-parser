import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseJobSkills, createJob } from '../lib/api';

const PROFICIENCY_OPTIONS = ['Expert', 'Advanced', 'Intermediate', 'Beginner', 'Nice-to-have'];

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-100 text-purple-700 border-purple-200',
  Advanced:      'bg-blue-100 text-blue-700 border-blue-200',
  Intermediate:  'bg-green-100 text-green-700 border-green-200',
  Beginner:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Nice-to-have':'bg-gray-100 text-gray-500 border-gray-200',
};

export default function JobProfileCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleGenerateSkills = async () => {
    if (!description.trim()) { setParseError('Enter a job description first.'); return; }
    setParsing(true);
    setParseError('');
    try {
      const { skills: parsed } = await parseJobSkills(description);
      setSkills(parsed);
      if (parsed.length === 0) setParseError('No recognisable skills found. Try adding more detail to the description.');
    } catch {
      setParseError('Failed to parse skills. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const updateSkill = (index, field, value) =>
    setSkills(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));

  const removeSkill = (index) =>
    setSkills(prev => prev.filter((_, i) => i !== index));

  const addSkill = () =>
    setSkills(prev => [...prev, { skill: '', proficiency: 'Intermediate', is_required: true }]);

  const handleSave = async () => {
    if (!title.trim()) { setSaveError('Job title is required.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const { id } = await createJob({ title, description, skills });
      navigate(`/jobs/${id}`);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Job Profile</h1>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Description + Generate Skills */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Job Description</label>
          <button
            onClick={handleGenerateSkills}
            disabled={parsing}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {parsing ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <> Generate Skills</>
            )}
          </button>
        </div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={8}
          placeholder="Paste the full job description here..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
        />
        {parseError && <p className="mt-1 text-sm text-red-500">{parseError}</p>}
      </div>

      {/* Skills */}
      {(skills.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Required Skills
              <span className="ml-2 text-sm font-normal text-gray-400">({skills.length} found)</span>
            </h2>
            <button
              onClick={addSkill}
              className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50"
            >
              + Add Skill
            </button>
          </div>

          <div className="space-y-2">
            {skills.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                {/* Skill name */}
                <input
                  value={s.skill}
                  onChange={e => updateSkill(i, 'skill', e.target.value)}
                  className="flex-1 text-sm border-0 outline-none bg-transparent font-medium text-gray-800"
                />

                {/* Proficiency selector */}
                <select
                  value={s.proficiency}
                  onChange={e => updateSkill(i, 'proficiency', e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer focus:outline-none ${PROFICIENCY_COLORS[s.proficiency]}`}
                >
                  {PROFICIENCY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* Required toggle */}
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={s.is_required}
                    onChange={e => updateSkill(i, 'is_required', e.target.checked)}
                    className="accent-indigo-600"
                  />
                  Required
                </label>

                {/* Remove */}
                <button
                  onClick={() => removeSkill(i)}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {saveError && <p className="text-sm text-red-500">{saveError}</p>}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Job Profile'}
        </button>
        <button
          onClick={() => navigate('/jobs')}
          className="text-sm text-gray-500 px-4 py-2.5 rounded-lg border hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
