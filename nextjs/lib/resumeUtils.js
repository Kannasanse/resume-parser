export function deduplicateByEmail(resumes) {
  const map = new Map();
  for (const r of resumes) {
    const email = r.parsed_data?.[0]?.email || `__no_email_${r.id}`;
    const scores = r.resume_scores || [];
    if (!map.has(email)) {
      map.set(email, { resume: r, jobs: scores });
    } else {
      const existing = map.get(email);
      const existingBest = Math.max(...existing.jobs.map(s => s.overall_score ?? 0), 0);
      const newBest      = Math.max(...scores.map(s => s.overall_score ?? 0), 0);
      if (newBest > existingBest) {
        map.set(email, { resume: r, jobs: scores });
      } else {
        const knownIds = new Set(existing.jobs.map(j => j.job_profile_id));
        for (const s of scores) {
          if (!knownIds.has(s.job_profile_id)) { existing.jobs.push(s); knownIds.add(s.job_profile_id); }
        }
      }
    }
  }
  return [...map.values()];
}
