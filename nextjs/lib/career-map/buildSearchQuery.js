export function buildSearchQuery(sectionHeading, skill, level) {
  const levelMap = {
    beginner:     'introduction guide tutorial',
    intermediate: 'in-depth guide tutorial',
    advanced:     'advanced deep dive internals',
  };
  const levelHint = levelMap[level] ?? 'guide tutorial';
  return `${skill} ${sectionHeading} ${levelHint}`;
}
