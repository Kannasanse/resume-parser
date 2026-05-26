import crypto from 'crypto';

const SENIORITY = /^(senior|sr\.?|lead|principal|staff|junior|jr\.?|associate|mid(-level)?)\s+/i;

export function buildJobQuery(profile) {
  const city      = (profile.location || '').split(',')[0].trim() || 'India';
  const headline  = (profile.headline || '').trim();
  const cleanTitle = headline.replace(SENIORITY, '').trim() || headline || 'Software Developer';
  const query     = `${cleanTitle} in ${city}, India`;
  return { query, jobTitle: cleanTitle, city, country: 'India' };
}

export function buildCacheKey(jobTitle, city) {
  const normalised = `${jobTitle.toLowerCase().trim()}|${city.toLowerCase().trim()}|india`;
  return crypto.createHash('sha256').update(normalised).digest('hex');
}
