import crypto from 'crypto';

const SENIORITY = /^(senior|sr\.?|lead|principal|staff|junior|jr\.?|associate|mid(-level)?)\s+/i;

export function buildJobQuery(profile) {
  const city     = (profile.city    || '').trim() || 'India';
  const country  = (profile.country || '').trim() || 'India';
  const headline = (profile.headline || '').trim();
  const cleanTitle = headline.replace(SENIORITY, '').trim() || headline || 'Software Developer';
  const query    = `${cleanTitle} in ${city}, ${country}`;
  return { query, jobTitle: cleanTitle, city, country };
}

export function buildCacheKey(jobTitle, city, country = 'india') {
  const normalised = `${jobTitle.toLowerCase().trim()}|${city.toLowerCase().trim()}|${country.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(normalised).digest('hex');
}
