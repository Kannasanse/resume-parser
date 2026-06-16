import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';
import { findExistingByAlias } from '@/lib/skills/findExistingByAlias.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/skills
 * Create a skill on-the-fly from user input.
 * Checks for duplicates via alias/slug before inserting.
 * Returns { skill, created, merged, reason? }
 */
export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { name, category } = await request.json();

    if (!name?.trim()) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }

    const trimmed = name.trim();

    // Check aliases / slug / similarity before creating
    const existing = await findExistingByAlias(trimmed);

    if (existing) {
      const { skill, reason } = existing;
      // Absorb the user's typed name as an alias if different from canonical
      const aliases = skill.aliases || [];
      if (!aliases.map(a => a.toLowerCase()).includes(trimmed.toLowerCase())) {
        await supabase
          .from('skills')
          .update({ aliases: [...aliases, trimmed] })
          .eq('id', skill.id)
          .catch(() => {});
      }
      return Response.json({
        skill,
        created: false,
        merged:  reason !== 'slug_match',
        reason,
        message: reason !== 'slug_match'
          ? `Mapped to "${skill.name}" — "${trimmed}" is recognised as an alias`
          : null,
      });
    }

    // Create new skill
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const { data: skill, error } = await supabase
      .from('skills')
      .insert({
        name:         trimmed,
        slug,
        category:     category || null,
        source:       'user_submitted',
        is_verified:  false,
        is_active:    true,
        created_by:   user.id,
      })
      .select('id, name, slug, category, aliases, is_active')
      .single();

    if (error) throw error;

    return Response.json({ skill, created: true, merged: false }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
