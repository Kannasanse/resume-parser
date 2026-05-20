'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ResumeAnalysisLoader from './ResumeAnalysisLoader';
import Questionnaire from './Questionnaire';
import Recommendations from './Recommendations';
import CareerGraph from './CareerGraph';
import SkillGapDrawer from './SkillGapDrawer';
import NodeDetailPanel from './NodeDetailPanel';
import PreferenceModal from './roadmap/PreferenceModal';

const STEPS = { RESUME: 'resume', QUESTIONNAIRE: 'questionnaire', RECOMMENDATIONS: 'recommendations', GRAPH: 'graph' };

export default function CareerMapPage() {
  const [step, setStep] = useState(STEPS.RESUME);
  const [resumes, setResumes] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [skillGapOpen, setSkillGapOpen] = useState(false);
  const [roadmapRoleId, setRoadmapRoleId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await sb.from('resumes').select('id, file_name, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10);
      setResumes(data || []);
    });
  }, []);

  async function handleAnalyse(resumeId) {
    setError('');
    setStep(STEPS.QUESTIONNAIRE);
    const res = await fetch('/api/v1/career-map/analyse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to analyse resume'); setStep(STEPS.RESUME); return; }
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
      body: JSON.stringify({ session_id: sessionId, questionnaire: answers }),
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

  return (
    <div className="gradient-mesh-1 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[var(--c-border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--c-text)]">Career Map</h1>
            <p className="text-sm text-[var(--c-text-muted)] mt-0.5">Visualise your career path and skill gaps</p>
          </div>
          {step !== STEPS.RESUME && (
            <button
              onClick={() => { setStep(STEPS.RESUME); setSessionId(null); setProfile(null); setRecommendations([]); setGraphData(null); setSkillGapData(null); setSelectedNode(null); }}
              className="text-sm text-[var(--c-primary)] hover:underline"
            >
              ← Start over
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-[var(--c-border)] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          {[
            { key: STEPS.RESUME, label: 'Resume' },
            { key: STEPS.QUESTIONNAIRE, label: 'Preferences' },
            { key: STEPS.RECOMMENDATIONS, label: 'Roles' },
            { key: STEPS.GRAPH, label: 'Career Map' },
          ].map((s, i) => {
            const steps = [STEPS.RESUME, STEPS.QUESTIONNAIRE, STEPS.RECOMMENDATIONS, STEPS.GRAPH];
            const currentIdx = steps.indexOf(step);
            const isActive = s.key === step;
            const isDone = steps.indexOf(s.key) < currentIdx;
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

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="ds-alert ds-alert-error">{error}</div>
        </div>
      )}

      <div className={step === STEPS.GRAPH ? '' : 'max-w-3xl mx-auto px-6 py-8'}>
        {step === STEPS.RESUME && (
          <ResumeAnalysisLoader resumes={resumes} onAnalyse={handleAnalyse} />
        )}
        {step === STEPS.QUESTIONNAIRE && (
          <div className="animate-fade-in-scale">
            <Questionnaire profile={profile} onSubmit={handleQuestionnaire} loading={!profile} />
          </div>
        )}
        {step === STEPS.RECOMMENDATIONS && (
          <Recommendations roles={recommendations} loading={recommendationsLoading} onSelect={handleSelectRole} />
        )}
        {step === STEPS.GRAPH && graphData && (
          <div className="relative" style={{ height: 'calc(100vh - 130px)' }}>
            <CareerGraph
              graphData={graphData}
              onNodeClick={(node) => setSelectedNode(node)}
            />
            {skillGapOpen && skillGapData && (
              <SkillGapDrawer
                data={skillGapData}
                onClose={() => setSkillGapOpen(false)}
                onViewRoadmap={(roleId) => setRoadmapRoleId(roleId)}
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
                onViewRoadmap={(roleId) => { setRoadmapRoleId(roleId); setSelectedNode(null); }}
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
    </div>
  );
}
