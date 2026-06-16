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

    // Fetch all roles from DB for graph construction
    const { data: allRoles } = await supabase
      .from('career_role_database')
      .select('*');

    const roleMap = Object.fromEntries((allRoles || []).map(r => [r.id, r]));
    const profile = session.extracted_profile;
    const userSkills = new Set([
      ...(profile.skills || []),
      ...(profile.topTechStack || []),
    ].map(s => s.toLowerCase()));

    // Check if the selected role is AI-generated (not in DB)
    const isAiRole = !roleMap[selected_role_id];

    // For AI-generated roles, resolve role data from session's saved recommendations
    const savedRecs = session.recommended_roles || [];
    const aiRole = isAiRole ? savedRecs.find(r => r.id === selected_role_id) : null;

    let nodes = [];
    let edges = [];

    if (isAiRole && aiRole) {
      // Build graph from AI role + related DB roles by skill overlap
      const aiSkillsNeeded = new Set((aiRole.key_skills_needed || []).map(s => s.toLowerCase()));
      const matchedSkillsArr = [...userSkills].filter(s => aiSkillsNeeded.has(s));
      const skillMatch = aiSkillsNeeded.size > 0
        ? Math.round((matchedSkillsArr.length / aiSkillsNeeded.size) * 100)
        : aiRole.readiness_score || 70;

      // Target node (AI-generated role)
      nodes.push({
        id: selected_role_id,
        type: 'target',
        data: {
          id: selected_role_id,
          title: aiRole.title,
          category: aiRole.category,
          seniority: aiRole.seniority,
          salary_min_usd: aiRole.salary_min_usd,
          salary_max_usd: aiRole.salary_max_usd,
          skill_match: skillMatch,
          is_locked: false,
          path_type: aiRole.pathType,
          estimated_months: aiRole.estimated_months,
        },
      });

      // Add current role node if inferrable
      const currentTitle = (profile.currentTitle || '').toLowerCase();
      const currentDbRole = (allRoles || []).find(r =>
        r.title.toLowerCase().includes(currentTitle) || currentTitle.includes(r.title.toLowerCase())
      );
      if (currentDbRole) {
        nodes.push({
          id: currentDbRole.id,
          type: 'current',
          data: {
            id: currentDbRole.id,
            title: currentDbRole.title,
            category: currentDbRole.category,
            seniority: currentDbRole.seniority,
            salary_min_usd: currentDbRole.salary_min_usd,
            salary_max_usd: currentDbRole.salary_max_usd,
            skill_match: 100,
            is_locked: false,
          },
        });
        edges.push({
          id: `${currentDbRole.id}-${selected_role_id}`,
          source: currentDbRole.id,
          target: selected_role_id,
          type: aiRole.pathType || 'vertical',
        });
      }

      // Add intermediate step nodes from other AI recommendations that form a path
      const otherRecs = savedRecs.filter(r =>
        r.id !== selected_role_id &&
        r.seniority !== aiRole.seniority &&
        r.category === aiRole.category
      ).slice(0, 2);

      for (const rec of otherRecs) {
        if (!nodes.find(n => n.id === rec.id)) {
          nodes.push({
            id: rec.id,
            type: 'path',
            data: {
              id: rec.id,
              title: rec.title,
              category: rec.category,
              seniority: rec.seniority,
              salary_min_usd: rec.salary_min_usd,
              salary_max_usd: rec.salary_max_usd,
              skill_match: rec.readiness_score || 60,
              is_locked: false,
            },
          });
        }
      }
    } else {
      // DB role — original BFS logic
      const visited = new Set();
      const queue = [{ id: selected_role_id, depth: 0 }];

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
    }

    // Compute skill gaps for selected role
    const targetDbRole = roleMap[selected_role_id];
    const targetRoleData = targetDbRole || aiRole;
    const requiredSkills = targetDbRole?.required_skills || aiRole?.key_skills_needed || [];
    const skillGapData = {
      target_role_id:    selected_role_id,
      target_role_title: targetRoleData?.title,
      required_skills:   requiredSkills,
      matched_skills:    requiredSkills.filter(s => userSkills.has(s.toLowerCase())),
      missing_skills:    requiredSkills.filter(s => !userSkills.has(s.toLowerCase())),
      match_percent: requiredSkills.length > 0
        ? Math.round((requiredSkills.filter(s => userSkills.has(s.toLowerCase())).length / requiredSkills.length) * 100)
        : (aiRole?.readiness_score || 0),
    };

    const graphData = { nodes, edges };

    // Save path record (non-fatal)
    let path = null;
    try {
      const { data } = await supabase
        .from('career_map_paths')
        .insert({
          session_id,
          selected_role_id,
          graph_data: graphData,
          skill_gap_data: skillGapData,
        })
        .select('id')
        .single();
      path = data;
    } catch (_) {}

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
