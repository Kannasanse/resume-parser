// One-time ESCO skill import script
// Run with: node scripts/importEscoSkills.js
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ESCO_API = 'https://ec.europa.eu/esco/api';
const BATCH_SIZE = 50;

// Map ESCO ISCO group labels to Proflect categories
const ESCO_CATEGORY_MAP = {
  'information and communications technology': 'Programming Languages',
  'database and network professionals': 'Databases',
  'software and applications developers': 'Web & Frontend',
  'systems administrators': 'DevOps & Cloud',
  'science and engineering': 'Data & AI',
  'natural sciences': 'Data & AI',
  'mathematics': 'Data & AI',
  'security': 'Cybersecurity',
  'design': 'Design & UX',
  'management': 'Product & Management',
  'communication': 'Soft Skills',
};

function mapEscoCategory(skill) {
  const broader = (skill.broaderHierarchyConcepts?.[0]?.title || '').toLowerCase();
  for (const [key, category] of Object.entries(ESCO_CATEGORY_MAP)) {
    if (broader.includes(key)) return category;
  }
  return 'Other';
}

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchEscoSkills(offset = 0) {
  try {
    const url = new URL(`${ESCO_API}/search`);
    url.searchParams.set('type', 'skill');
    url.searchParams.set('language', 'en');
    url.searchParams.set('offset', offset);
    url.searchParams.set('limit', BATCH_SIZE);
    const res = await fetch(url.toString());
    if (!res.ok) { console.error('ESCO API error:', res.status); return []; }
    const data = await res.json();
    return data._embedded?.results ?? [];
  } catch (err) {
    console.error('Fetch error:', err.message);
    return [];
  }
}

async function importSkills() {
  let offset = 0;
  let totalImported = 0;
  let hasMore = true;

  console.log('Starting ESCO skill import...');

  while (hasMore) {
    const skills = await fetchEscoSkills(offset);
    if (skills.length === 0) { hasMore = false; break; }

    const rows = skills.map(skill => ({
      name:        skill.title,
      slug:        makeSlug(skill.title),
      category:    mapEscoCategory(skill),
      description: skill.description?.en?.literal ?? null,
      source:      'esco',
      esco_uri:    skill.uri,
      is_active:   true,
      is_verified: true,
    })).filter(r => r.name && r.slug);

    const { error } = await supabase
      .from('skills')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });

    if (error) {
      console.error('Upsert error:', error.message);
    } else {
      totalImported += rows.length;
      process.stdout.write(`\rImported ${totalImported} skills...`);
    }

    offset += BATCH_SIZE;
    await new Promise(r => setTimeout(r, 200)); // gentle rate limiting
  }

  console.log(`\n✅ ESCO import complete. Total: ${totalImported} skills`);
}

importSkills().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
