import { buildSearchQuery }   from './buildSearchQuery.js';
import { searchWithTavily }   from './providers/tavily.js';
import { searchWithExa }      from './providers/exa.js';
import { structureWebContent } from './structureWebContent.js';

export async function generateFromWeb({ sectionHeading, skill, currentLevel }) {
  const query = buildSearchQuery(sectionHeading, skill, currentLevel);

  // Try Tavily first
  let webResult = await searchWithTavily(query);

  // Exa fallback
  if (!webResult || webResult.quality < 0.5) {
    webResult = await searchWithExa(query);
  }

  // No web result — signal caller to fall back to AI
  if (!webResult) {
    return null;
  }

  // Summarise / structure with llama-3.1-8b-instant
  const content = await structureWebContent({
    rawContent:    webResult.content,
    sectionHeading,
    skill,
    currentLevel,
    sourceUrl:     webResult.url,
    sourceTitle:   webResult.title,
  });

  if (!content) return null;

  let sourceDomain = '';
  try { sourceDomain = new URL(webResult.url).hostname.replace('www.', ''); } catch {}

  return {
    content,
    source_type:   'web',
    source_url:    webResult.url,
    source_title:  webResult.title,
    source_domain: sourceDomain,
    fetched_at:    new Date().toISOString(),
  };
}
