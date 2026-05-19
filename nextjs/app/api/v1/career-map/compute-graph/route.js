import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { session_id, selected_role_id } = await request.json();

    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Fetch all roles for graph construction
    const { data: allRoles } = await supabase
      .from('career_role_database')
      .select('*');

    const roleMap = Object.fromEntries((allRoles || []).map(r => [r.id, r]));
    const profile = session.extracted_profile;
    const userSkills = new Set([
      ...(profile.skills || []),
      ...(profile.topTechStack || []),
    ].map(s => s.toLowerCase()));

    // BFS from selected role — expand up to 3 hops
    const visited = new Set();
    const nodes = [];
    const edges = [];
    const queue = [{ id: selected_role_id, depth: 0 }];

    // Also include current role if we can infer it
    const currentTitle = (profile.currentTitle || profile.current_title || '').toLowerCase();
    const currentRoleId = (allRoles || []).find(r =>
      r.title.toLowerCase().includes(currentTitle) || currentTitle.includes(r.title.toLowerCase())
    )?.id;

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id) || depth > 3) continue;
      visited.add(id);

      const role = roleMap[id];
      if (!role) continue;

      const roleSkills = new Set((role.required_skills || []).map(s => s.toLowerCase()));
      const matchedSkills = [...userSkills].filter(s => roleSkills.has(s));
      const skillMatch = roleSkills.size > 0 ? Math.round((matchedSkills.length / roleSkills.size) * 100) : 0;

      let nodeType = 'path';
      if (id === selected_role_id) nodeType = 'target';
      else if (id === currentRoleId) nodeType = 'current';

      nodes.push({
        id,
        type: nodeType,
        data: {
          id,
          title: role.title,
          category: role.category,
          seniority: role.seniority,
          salary_min_usd: role.salary_min_usd,
          salary_max_usd: role.salary_max_usd,
          skill_match: skillMatch,
          is_locked: depth > 1 && skillMatch < 40,
        },
      });

      if (depth < 3) {
        const neighbors = [
          ...(role.vertical_next || []).map(nid => ({ id: nid, type: 'vertical' })),
          ...(role.horizontal_peers || []).map(nid => ({ id: nid, type: 'horizontal' })),
          ...(role.diagonal_options || []).map(nid => ({ id: nid, type: 'diagonal' })),
        ];
        for (const { id: nid, type: edgeType } of neighbors) {
          if (!visited.has(nid) && roleMap[nid]) {
            queue.push({ id: nid, depth: depth + 1 });
            edges.push({
              id: `${id}-${nid}`,
              source: id,
              target: nid,
              type: edgeType,
            });
          }
        }
      }
    }

    // Compute skill gaps for selected role
    const targetRole = roleMap[selected_role_id];
    const requiredSkills = targetRole?.required_skills || [];
    const skillGapData = {
      target_role_id: selected_role_id,
      target_role_title: targetRole?.title,
      required_skills: requiredSkills,
      matched_skills: requiredSkills.filter(s => userSkills.has(s.toLowerCase())),
      missing_skills: requiredSkills.filter(s => !userSkills.has(s.toLowerCase())),
      match_percent: requiredSkills.length > 0
        ? Math.round((requiredSkills.filter(s => userSkills.has(s.toLowerCase())).length / requiredSkills.length) * 100)
        : 0,
    };

    const graphData = { nodes, edges };

    // Save path record
    const { data: path } = await supabase
      .from('career_map_paths')
      .insert({
        session_id,
        selected_role_id,
        graph_data: graphData,
        skill_gap_data: skillGapData,
      })
      .select('id')
      .single();

    // Update session selected role
    await supabase
      .from('career_map_sessions')
      .update({ selected_role_id, updated_at: new Date().toISOString() })
      .eq('id', session_id);

    return NextResponse.json({ path_id: path?.id, graph_data: graphData, skill_gap_data: skillGapData });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('compute-graph error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
