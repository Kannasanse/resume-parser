export const PREDEFINED_SKILLS = {
  'Programming Languages': [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
    'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'Scala',
  ],
  'Web & Frontend': [
    'React', 'Vue.js', 'Angular', 'Next.js', 'HTML/CSS',
    'Tailwind CSS', 'Svelte', 'Redux', 'GraphQL', 'REST APIs',
  ],
  'Backend & APIs': [
    'Node.js', 'Express.js', 'FastAPI', 'Django', 'Spring Boot',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase',
  ],
  'DevOps & Cloud': [
    'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure',
    'CI/CD', 'GitHub Actions', 'Terraform', 'Linux', 'Nginx',
  ],
  'Data & AI': [
    'SQL', 'Python for Data Science', 'Machine Learning',
    'TensorFlow', 'PyTorch', 'Data Analysis', 'Pandas',
    'Power BI', 'Tableau', 'LLM Development',
  ],
  'Mobile': [
    'React Native', 'Flutter', 'iOS Development', 'Android Development',
  ],
  'Design & Product': [
    'Figma', 'UI/UX Design', 'Product Management', 'Agile/Scrum',
    'User Research', 'Wireframing',
  ],
  'Soft Skills': [
    'Communication', 'Leadership', 'Project Management',
    'Problem Solving', 'Critical Thinking', 'Team Collaboration',
  ],
};

export const ALL_SKILLS = Object.values(PREDEFINED_SKILLS).flat();
