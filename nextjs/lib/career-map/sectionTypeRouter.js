// Determines whether a section type warrants web sourcing (Tavily/Exa)
export function needsWebSourcing(sectionType) {
  return sectionType === 'concept' || sectionType === 'practical';
}

// Returns the best search query for a section
export function getSearchQuery(section, skill, currentLevel) {
  if (section.search_query) return section.search_query;

  const levelHint = {
    beginner:     'tutorial for beginners',
    intermediate: 'in-depth guide',
    advanced:     'advanced deep dive',
  }[currentLevel] ?? 'guide tutorial';

  return `${skill} ${section.heading} ${levelHint}`;
}
