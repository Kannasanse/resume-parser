const JSEARCH_BASE = 'https://api.openwebninja.com/jsearch';

export async function fetchFromJSearch(query, options = {}) {
  const params = new URLSearchParams({
    query,
    page:        String(options.page ?? 1),
    num_pages:   String(options.numPages ?? 1),
    date_posted: options.datePosted ?? 'month',
    country:     'in',
    language:    'en',
  });

  const response = await fetch(`${JSEARCH_BASE}/search-v2?${params}`, {
    headers: {
      'x-api-key': process.env.JSEARCH_API_KEY,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`JSearch API error ${response.status}: ${err.message ?? 'Unknown'}`);
  }

  const data = await response.json();
  return (data.data ?? []).map(normaliseJob);
}

function normaliseJob(job) {
  const bestApply = job.apply_options?.find(o => o.is_direct) ?? job.apply_options?.[0];

  return {
    job_id:          job.job_id,
    title:           job.job_title,
    company:         job.employer_name,
    company_logo:    job.employer_logo ?? null,
    location:        [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
    city:            job.job_city ?? '',
    country:         job.job_country ?? 'IN',
    is_remote:       job.job_is_remote ?? false,
    employment_type: job.job_employment_type ?? 'FULLTIME',
    posted_at:       job.job_posted_at_datetime_utc ?? new Date().toISOString(),
    description:     (job.job_description ?? '').slice(0, 400),
    apply_link:      bestApply?.apply_link ?? job.job_apply_link ?? '',
    apply_options:   (job.apply_options ?? []).map(o => ({
      publisher: o.publisher,
      link:      o.apply_link,
      is_direct: o.is_direct,
    })),
    salary_min:      job.job_min_salary     ?? null,
    salary_max:      job.job_max_salary     ?? null,
    salary_currency: job.job_salary_currency ?? null,
    salary_period:   job.job_salary_period   ?? null,
    required_skills: job.job_required_skills ?? null,
    source:          job.job_publisher ?? 'Google for Jobs',
    google_link:     job.job_google_link ?? '',
  };
}
