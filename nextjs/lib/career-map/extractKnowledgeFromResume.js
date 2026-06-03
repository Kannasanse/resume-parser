export function extractKnowledgeFromResume(profile) {
  if (!profile) return {};

  return {
    hasCurrentRole:     !!profile.currentTitle || !!profile.current_role,
    hasCareerHistory:   (profile.experience?.length ?? 0) >= 2,
    hasClearIndustry:   !!(profile.industry) || (profile.industries?.length ?? 0) > 0,
    hasTargetRole:      !!profile.target_role || hasClearProgression(profile),
    hasTimeline:        false, // almost never stated on a resume
    hasLearningSignal:  (profile.certifications?.length ?? 0) > 0 || (profile.courses?.length ?? 0) > 0,
    hasLocation:        !!profile.location,
    hasSkills:          (profile.skills?.length ?? 0) >= 3,
    hasSenioritySignal: !!(profile.currentSeniority || profile.seniority_level)
                        || detectSeniorityFromTitle(profile.currentTitle || profile.current_role),
    hasDomainSignal:    !!(profile.currentDomain || profile.domain),
  };
}

function hasClearProgression(profile) {
  const roles = (profile.experience || []).map(e => e.title).filter(Boolean);
  return roles.length >= 3;
}

function detectSeniorityFromTitle(title) {
  if (!title) return false;
  return /senior|sr\.|lead|principal|staff|manager|director|vp|head of/i.test(title);
}
