import supabase from '@/lib/supabase.js';
import { findExistingByAlias } from './findExistingByAlias.js';

/**
 * Resolve a skill name to a canonical skill record.
 * - Finds existing skill by slug / alias / similarity
 * - Auto-adds the typed name as an alias when a match is found under a different name
 * - Creates a new skill if no match found
 *
 * Returns { skill_id, skill_name, created, merged, reason }
 * Never throws — errors return { skill_id: null, skill_name: name }.
 */
export async function resolveSkill(skillName, userId) {
  if (!skillName?.trim()) return { skill_id: null, skill_name: '' };
  const name = skillName.trim();

  try {
    const found = await findExistingByAlias(name);

    if (found) {
      const { skill, reason } = found;
      // Add the user's typed name as alias if it isn't already recorded
      const aliases = skill.aliases || [];
      if (!aliases.map(a => a.toLowerCase()).includes(name.toLowerCase())) {
        await supabase
          .from('skills')
          .update({ aliases: [...aliases, name] })
          .eq('id', skill.id)
          .catch(() => {});
      }
      return {
        skill_id:   skill.id,
        skill_name: skill.name,
        created:    false,
        merged:     reason !== 'slug_match',
        reason,
      };
    }

    // No match — create a new user-submitted skill
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const row = { name, slug, source: 'user_submitted', is_active: true };
    if (userId) row.created_by = userId;

    const { data: newSkill, error } = await supabase
      .from('skills').insert(row).select('id, name').single();

    if (error) {
      console.error('[resolveSkill] create error:', error.message);
      return { skill_id: null, skill_name: name, created: false };
    }

    return { skill_id: newSkill.id, skill_name: newSkill.name, created: true, merged: false };
  } catch (err) {
    console.error('[resolveSkill] exception:', err.message);
    return { skill_id: null, skill_name: name };
  }
}
