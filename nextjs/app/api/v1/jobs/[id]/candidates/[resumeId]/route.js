import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    const { id: jobId, resumeId } = await params;

    // Remove the score record for this resume+job pair
    const { error: scoreErr } = await supabase
      .from('resume_scores')
      .delete()
      .eq('resume_id', resumeId)
      .eq('job_profile_id', jobId);
    if (scoreErr) throw scoreErr;

    // Clear job_id on the resume if it was pointing to this job
    const { error: resumeErr } = await supabase
      .from('resumes')
      .update({ job_id: null })
      .eq('id', resumeId)
      .eq('job_id', jobId);
    if (resumeErr) throw resumeErr;

    return Response.json({ message: 'Candidate removed from job profile' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
