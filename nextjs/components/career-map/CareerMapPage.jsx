'use client';
import { useState, useEffect } from 'react';
import ResumePicker from './ResumePicker';
import ResumeAnalysisLoader from './ResumeAnalysisLoader';
import Questionnaire from './Questionnaire';
import Recommendations from './Recommendations';
import CareerGraph from './CareerGraph';
import SkillGapDrawer from './SkillGapDrawer';
import NodeDetailPanel from './NodeDetailPanel';
import PreferenceModal from './roadmap/PreferenceModal';
import CourseCreationModal from '@/components/my-courses/CourseCreationModal';

const STEPS = {
  LOADING:          'LOADING',
  RESUME_PICKER:    'RESUME_PICKER',
  RESUME_ANALYSIS:  'RESUME_ANALYSIS',  // kept for legacy uploaded-resume fallback
  QUESTIONNAIRE:    'QUESTIONNAIRE',
  RECOMMENDATIONS:  'RECOMMENDATIONS',
  GRAPH:            'GRAPH',
};

const STEP_LABELS = [
  { key: STEPS.RESUME_PICKER,   label: 'Resume' },
  { key: STEPS.QUESTIONNAIRE,   label: 'Preferences' },
  { key: STEPS.RECOMMENDATIONS, label: 'Roles' },
  { key: STEPS.GRAPH,           label: 'Career Map' },
];

const STEP_ORDER = [STEPS.RESUME_PICKER, STEPS.QUESTIONNAIRE, STEPS.RECOMMENDATIONS, STEPS.GRAPH];

export default function CareerMapPage() {
  const [step, setStep]                       = useState(STEPS.LOADING);
  const [builderResumes, setBuilderResumes]   = useState([]);
  const [lastUsedResumeId, setLastUsedResumeId] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [sessionId, setSessionId]             = useState(null);
  const [profile, setProfile]                 = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [graphData, setGraphData]             = useState(null);
  const [skillGapData, setSkillGapData]       = useState(null);
  const [selectedNode, setSelectedNode]       = useState(null);
  const [skillGapOpen, setSkillGapOpen]       = useState(false);
  const [roadmapRoleId, setRoadmapRoleId]     = useState(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [error, setError]                     = useState('');

  useEffect(() => {
    fetch('/api/v1/career-map/published-resumes')
      .then(r => r.json())
      .then(data => {
        const resumes = data.resumes || [];
        setBuilderResumes(resumes);
        setLastUsedResumeId(data.lastUsedResumeId || null);

        if (resumes.length === 1) {
          // Auto-select single resume, skip picker
          setSelectedResumeId(resumes[0].id);
          setStep(STEPS.RESUME_PICKER); // show briefly then kick off analysis
        } else {
          setStep(STEPS.RESUME_PICKER);
        }
      })
      .catch(() => setStep(STEPS.RESUME_PICKER));
  }, []);

  async function handleResumeSelect(resumeId) {
    setSelectedResumeId(resumeId);
    setError('');
    setStep(STEPS.QUESTIONNAIRE); // show loading within questionnaire while analysing

    const res = await fetch('/api/v1/career-map/analyse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ builder_resume_id: resumeId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to analyse resume');
      setStep(STEPS.RESUME_PICKER);
      return;
    }
    setSessionId(data.session_id);
    setProfile(data.profile);
  }

  async function handleQuestionnaire(answers) {
    setError('');
    setRecommendationsLoading(true);
    setStep(STEPS.RECOMMENDATIONS);

    const res = await fetch('/api/v1/career-map/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id:           sessionId,
        extractedProfile:     profile,
        questionnaireAnswers: answers,
        confidenceScore:      0,   // Questionnaire sets this via submit-answer
        questionCount:        answers.length,
        adaptive_answers:     answers, // backward compat
      }),
    });
    const data = await res.json();
    setRecommendationsLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to get recommendations'); return; }
    setRecommendations(data.recommended_roles || []);
  }

  async function handleSelectRole(roleId) {
    setError('');
    const res = await fetch('/api/v1/career-map/compute-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, selected_role_id: roleId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to compute graph'); return; }
    setGraphData(data.graph_data);
    setSkillGapData(data.skill_gap_data);
    setStep(STEPS.GRAPH);
    setSkillGapOpen(true);
  }

  function handleStartOver() {
    setStep(STEPS.RESUME_PICKER);
    setSelectedResumeId(null);
    setSessionId(null);
    setProfile(null);
    setRecommendations([]);
    setGraphData(null);
    setSkillGapData(null);
    setSelectedNode(null);
    setError('');
  }

  // ── Step indicator ──────────────────────────────────────────────────────────
  const currentStepIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="gradient-mesh-1 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[var(--c-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--c-text)]">Career Map</h1>
            <p className="text-sm text-[var(--c-text-muted)] mt-0.5">Visualise your career path and skill gaps</p>
          </div>
          <div className="flex items-center gap-3">
            {(step === STEPS.RESUME_PICKER || step === STEPS.LOADING) && (
              <button
                onClick={() => setCourseModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-primary)] hover:border-[var(--c-primary)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Create course directly
              </button>
            )}
            {step !== STEPS.RESUME_PICKER && step !== STEPS.LOADING && (
              <button onClick={handleStartOver} className="text-sm text-[var(--c-primary)] hover:underline">
                ← Start over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      {step !== STEPS.LOADING && (
        <div className="bg-white border-b border-[var(--c-border)] px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            {STEP_LABELS.map((s, i) => {
              const idx = STEP_ORDER.indexOf(s.key);
              const isActive = s.key === step || (step === STEPS.QUESTIONNAIRE && s.key === STEPS.RESUME_PICKER && !profile);
              const isDone = idx < currentStepIdx;
              return (
                <span key={s.key} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[var(--c-border)]">›</span>}
                  <span className={`font-medium ${isActive ? 'text-[var(--c-primary)]' : isDone ? 'text-[var(--c-success)]' : 'text-[var(--c-text-muted)]'}`}>
                    {isDone ? '✓ ' : ''}{s.label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="px-6 pt-4">
          <div className="ds-alert ds-alert-error">{error}</div>
        </div>
      )}

      <div className={step === STEPS.GRAPH ? '' : 'max-w-3xl mx-auto px-6 py-8'}>
        {/* Loading — fetching resumes */}
        {step === STEPS.LOADING && (
          <div className="max-w-2xl mx-auto">
            <div className="card p-10 text-center space-y-4">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--c-primary)] rounded-full animate-pulse w-1/2" />
              </div>
              <p className="text-sm text-[var(--c-text-muted)]">Loading your resumes…</p>
            </div>
          </div>
        )}

        {/* Resume picker */}
        {step === STEPS.RESUME_PICKER && (
          <ResumePicker
            resumes={builderResumes}
            lastUsedResumeId={lastUsedResumeId}
            onSelect={handleResumeSelect}
            onSkip={() => {
              // Skip with no resume — questionnaire will handle profile manually
              setStep(STEPS.QUESTIONNAIRE);
            }}
          />
        )}

        {/* Questionnaire */}
        {step === STEPS.QUESTIONNAIRE && (
          <div className="animate-fade-in-scale">
            <Questionnaire
              profile={profile}
              sessionId={sessionId}
              onSubmit={handleQuestionnaire}
              loading={!profile}
            />
          </div>
        )}

        {/* Recommendations */}
        {step === STEPS.RECOMMENDATIONS && (
          <Recommendations
            roles={recommendations}
            loading={recommendationsLoading}
            onSelect={handleSelectRole}
          />
        )}

        {/* Graph */}
        {step === STEPS.GRAPH && graphData && (
          <div className="relative" style={{ height: 'calc(100vh - 130px)' }}>
            <CareerGraph graphData={graphData} onNodeClick={node => setSelectedNode(node)} />
            {skillGapOpen && skillGapData && (
              <SkillGapDrawer
                data={skillGapData}
                onClose={() => setSkillGapOpen(false)}
                onViewRoadmap={roleId => setRoadmapRoleId(roleId)}
              />
            )}
            {!skillGapOpen && (
              <button
                onClick={() => setSkillGapOpen(true)}
                className="absolute top-4 right-4 bg-white border border-[var(--c-border)] shadow-sm rounded-lg px-3 py-2 text-sm font-medium text-[var(--c-primary)] hover:bg-[var(--c-primary-light)] transition-colors"
              >
                Skill Gap →
              </button>
            )}
            {selectedNode && (
              <NodeDetailPanel
                node={selectedNode}
                sessionId={sessionId}
                onClose={() => setSelectedNode(null)}
                onViewRoadmap={roleId => { setRoadmapRoleId(roleId); setSelectedNode(null); }}
              />
            )}
          </div>
        )}
      </div>

      {roadmapRoleId && (
        <PreferenceModal
          open={!!roadmapRoleId}
          onClose={() => setRoadmapRoleId(null)}
          sessionId={sessionId}
          targetRoleId={roadmapRoleId}
          targetRoleTitle={skillGapData?.target_role_title || roadmapRoleId}
          missingSkills={skillGapData?.missing_skills || []}
          readinessScore={skillGapData?.match_percent || 0}
        />
      )}

      <CourseCreationModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
      />
    </div>
  );
}
