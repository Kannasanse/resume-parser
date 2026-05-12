// Maps our DB format to the flat data format used by design templates

export function adaptResumeData(resume) {
  const pi = resume?.personal_info || {};
  const sections = resume?.sections || [];

  const findSection = (type) => sections.find(s => s.type === type && s.enabled !== false);
  const findSections = (type) => sections.filter(s => s.type === type && s.enabled !== false);

  const summarySection = findSection('summary');
  const workSections = findSections('work_experience');
  const eduSections = findSections('education');
  const skillsSection = findSection('skills');
  const langSection = findSection('languages');
  const certSection = findSection('certifications');
  const projectsSection = findSection('projects');
  const hobbiesSection = findSection('hobbies');

  const experience = workSections.flatMap(sec =>
    (sec.content?.entries || []).map((e, i) => ({
      id: `${sec.id}-${i}`,
      company: e.employer || '',
      role: e.title || '',
      location: e.location || '',
      start: '',
      end: e.dates || '',
      bullets: e.bullets || [],
    }))
  );

  const education = eduSections.flatMap(sec =>
    (sec.content?.entries || []).map((e, i) => ({
      id: `${sec.id}-${i}`,
      school: e.school || '',
      degree: e.degree || '',
      location: e.location || '',
      start: '',
      end: e.dates || '',
    }))
  );

  const skills = (skillsSection?.content?.entries || []).map((e, i) => ({
    id: `skill-${i}`,
    name: e.name || '',
    level: e.level || 2,
  }));

  const languages = (langSection?.content?.entries || []).map((e, i) => ({
    id: `lang-${i}`,
    name: e.name || '',
    proficiency: e.level || 'Fluent',
    level: typeof e.level === 'number' ? e.level : 3,
  }));

  const certificates = (certSection?.content?.entries || []).map((e, i) => ({
    id: `cert-${i}`,
    name: e.name ? `${e.name}${e.issuer ? ` — ${e.issuer}` : ''}${e.date ? ` (${e.date})` : ''}` : '',
  }));

  const projects = (projectsSection?.content?.entries || []).map((e, i) => ({
    id: `proj-${i}`,
    title: e.title || '',
    desc: e.description || '',
    role: e.role || '',
    dates: e.dates || '',
    link: e.link || '',
  }));

  // Collect any custom sections
  const customSections = sections
    .filter(s => s.enabled !== false && !['work_experience','education','skills','languages','certifications','projects','hobbies','summary','references'].includes(s.type))
    .map(s => ({ id: s.id, title: s.title, content: s.content }));

  return {
    basics: {
      name: pi.name || '',
      title: pi.title || '',
      location: pi.location || '',
      email: pi.email || '',
      phone: pi.phone || '',
      linkedin: pi.linkedin || '',
      website: pi.link || '',
      photo: pi.photo || null,
    },
    summary: summarySection?.content?.text || '',
    experience,
    education,
    skills,
    languages,
    certificates,
    projects,
    interests: hobbiesSection ? [{ id: 'hobbies', title: hobbiesSection.content?.text || '' }] : [],
    customSections,
  };
}
